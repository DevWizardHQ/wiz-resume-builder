import { ResumeData } from '@/types/resume';

export type AiProvider = 'omniroute' | 'openai' | 'ollama' | 'fallback';

export const DEFAULT_OMNIROUTE_BASE_URL =
  process.env.OMNIROUTE_BASE_URL || 'https://api.omniroute.ai/v1';
export const DEFAULT_OMNIROUTE_MODEL =
  process.env.OMNIROUTE_MODEL || 'gpt-4o-mini';

export const DEFAULT_OPENAI_BASE_URL =
  process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
export const DEFAULT_OPENAI_MODEL =
  process.env.OPENAI_MODEL || 'gpt-4o-mini';

export const DEFAULT_OLLAMA_ENDPOINT =
  process.env.OLLAMA_BASE_URL ||
  process.env.NEXT_PUBLIC_OLLAMA_URL ||
  'http://localhost:11434';
export const DEFAULT_OLLAMA_MODEL =
  process.env.OLLAMA_MODEL || 'llama3.2';

export const RECOMMENDED_MODELS = [
  'gpt-4o-mini',
  'gpt-4o',
  'claude-3-5-sonnet',
  'llama3.2',
  'llama3.1',
  'mistral',
  'qwen2.5',
];

export interface OllamaHealthStatus {
  available: boolean;
  models: string[];
  endpoint: string;
  message?: string;
  provider?: AiProvider;
}

export interface BulletRewriteResult {
  bullets: string[];
  source: AiProvider;
  modelUsed?: string;
  provider?: string;
}

export interface CoverLetterResult {
  coverLetter: string;
  source: AiProvider;
  modelUsed?: string;
  provider?: string;
}

export interface AiClientOptions {
  provider?: AiProvider | 'auto';
  apiKey?: string;
  endpoint?: string;
  baseUrl?: string;
  model?: string;
  timeoutMs?: number;
}

// Backward compatibility alias
export type LocalAiClientOptions = AiClientOptions;

const FALLBACK_ACTION_VERBS = [
  'Spearheaded',
  'Architected',
  'Optimized',
  'Engineered',
  'Streamlined',
  'Accelerated',
  'Implemented',
  'Orchestrated',
  'Transformed',
  'Delivered',
];

const FALLBACK_IMPACT_METRICS = [
  'resulting in a 35% increase in system throughput and reduced response latency',
  'achieving a 25% improvement in operational efficiency and team delivery speed',
  'scaling core architecture to support 100K+ active users with 99.9% uptime',
  'driving a 30% reduction in infrastructure costs and error rates',
  'accelerating deployment velocity by 40% through modern automated workflows',
];

/**
 * Resolves the active AI provider, base URL, API key, and model.
 * Prioritizes OmniRoute when configured, with OpenAI for future and Ollama/Fallback.
 */
export function resolveAiProviderConfig(options: AiClientOptions = {}): {
  provider: AiProvider;
  baseUrl: string;
  apiKey?: string;
  model: string;
  timeoutMs: number;
} {
  const envProvider = (process.env.AI_PROVIDER || 'auto').toLowerCase();
  const explicitProvider = options.provider;

  const omnirouteKey = options.apiKey || process.env.OMNIROUTE_API_KEY || '';
  const openaiKey = options.apiKey || process.env.OPENAI_API_KEY || '';
  const timeoutMs = options.timeoutMs || 10000;

  // 1. Explicitly requested provider in options
  if (explicitProvider && explicitProvider !== 'auto') {
    if (explicitProvider === 'omniroute') {
      return {
        provider: 'omniroute',
        baseUrl: options.baseUrl || options.endpoint || DEFAULT_OMNIROUTE_BASE_URL,
        apiKey: omnirouteKey,
        model: options.model || DEFAULT_OMNIROUTE_MODEL,
        timeoutMs,
      };
    }
    if (explicitProvider === 'openai') {
      return {
        provider: 'openai',
        baseUrl: options.baseUrl || options.endpoint || DEFAULT_OPENAI_BASE_URL,
        apiKey: openaiKey,
        model: options.model || DEFAULT_OPENAI_MODEL,
        timeoutMs,
      };
    }
    if (explicitProvider === 'ollama') {
      return {
        provider: 'ollama',
        baseUrl: options.baseUrl || options.endpoint || DEFAULT_OLLAMA_ENDPOINT,
        model: options.model || DEFAULT_OLLAMA_MODEL,
        timeoutMs,
      };
    }
    return {
      provider: 'fallback',
      baseUrl: '',
      model: 'heuristic-rules',
      timeoutMs,
    };
  }

  // 2. Explicitly configured provider via AI_PROVIDER environment variable
  if (envProvider === 'omniroute') {
    return {
      provider: 'omniroute',
      baseUrl: options.baseUrl || options.endpoint || DEFAULT_OMNIROUTE_BASE_URL,
      apiKey: omnirouteKey,
      model: options.model || DEFAULT_OMNIROUTE_MODEL,
      timeoutMs,
    };
  }
  if (envProvider === 'openai') {
    return {
      provider: 'openai',
      baseUrl: options.baseUrl || options.endpoint || DEFAULT_OPENAI_BASE_URL,
      apiKey: openaiKey,
      model: options.model || DEFAULT_OPENAI_MODEL,
      timeoutMs,
    };
  }
  if (envProvider === 'ollama') {
    return {
      provider: 'ollama',
      baseUrl: options.baseUrl || options.endpoint || DEFAULT_OLLAMA_ENDPOINT,
      model: options.model || DEFAULT_OLLAMA_MODEL,
      timeoutMs,
    };
  }

  // 3. Auto-detection based on available API keys:
  // OmniRoute has primary priority for this deployment
  if (omnirouteKey && omnirouteKey.trim().length > 0) {
    return {
      provider: 'omniroute',
      baseUrl: options.baseUrl || options.endpoint || DEFAULT_OMNIROUTE_BASE_URL,
      apiKey: omnirouteKey,
      model: options.model || DEFAULT_OMNIROUTE_MODEL,
      timeoutMs,
    };
  }

  // OpenAI key available
  if (openaiKey && openaiKey.trim().length > 0) {
    return {
      provider: 'openai',
      baseUrl: options.baseUrl || options.endpoint || DEFAULT_OPENAI_BASE_URL,
      apiKey: openaiKey,
      model: options.model || DEFAULT_OPENAI_MODEL,
      timeoutMs,
    };
  }

  // Default to local Ollama with fallback
  return {
    provider: 'ollama',
    baseUrl: options.baseUrl || options.endpoint || DEFAULT_OLLAMA_ENDPOINT,
    model: options.model || DEFAULT_OLLAMA_MODEL,
    timeoutMs,
  };
}

/**
 * Checks connectivity and available models on the local Ollama daemon.
 */
export async function checkOllamaHealth(
  endpoint = DEFAULT_OLLAMA_ENDPOINT,
  timeoutMs = 2000
): Promise<OllamaHealthStatus> {
  const normalizedEndpoint = endpoint.replace(/\/+$/, '');
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${normalizedEndpoint}/api/tags`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      const rawModels = Array.isArray(data?.models) ? data.models : [];
      const models = rawModels
        .map((m: any) => (typeof m === 'string' ? m : m.name || m.model || ''))
        .filter(Boolean);

      return {
        available: true,
        models,
        endpoint: normalizedEndpoint,
        provider: 'ollama',
        message:
          models.length > 0
            ? `Ollama is running with ${models.length} model(s) installed.`
            : 'Ollama is running, but no models are installed yet. Pull one via: ollama pull llama3.2',
      };
    }

    return {
      available: false,
      models: [],
      endpoint: normalizedEndpoint,
      provider: 'ollama',
      message: `Ollama returned status ${response.status}: ${response.statusText}`,
    };
  } catch (error: any) {
    clearTimeout(timeoutId);

    const isTimeout = error?.name === 'AbortError';
    return {
      available: false,
      models: [],
      endpoint: normalizedEndpoint,
      provider: 'ollama',
      message: isTimeout
        ? `Connection to Ollama timed out after ${timeoutMs}ms at ${normalizedEndpoint}`
        : `Could not connect to Ollama at ${normalizedEndpoint}. Make sure the daemon is running (e.g. "ollama serve").`,
    };
  }
}

/**
 * Builds the LLM prompt for rewriting bullet points into Google X-Y-Z formula.
 */
export function buildBulletPrompt(
  rawText: string,
  context?: string,
  tone = 'professional'
): string {
  return `You are an elite ATS resume optimization engine and career coach.
Your task is to transform the provided work experience draft into 2 to 3 high-impact, professional resume bullet points.

Strict Requirements:
1. Apply Google's X-Y-Z formula: "Accomplished [X] as measured by [Y], by doing [Z]".
2. Begin every bullet point with a strong, active past-tense verb (e.g., Spearheaded, Engineered, Architected, Optimized, Streamlined, Accelerated).
3. Include realistic, quantifiable metrics (percentages, numbers, scale, time saved, cost reductions) consistent with the context.
4. Keep each bullet concise (1 to 2 lines), ATS-optimized, with a ${tone} tone.
5. Output ONLY the raw bullet points (one per line, starting with "- "). Do NOT output any intro, outro, headers, or conversational filler.

${context ? `Role / Context: ${context}\n` : ''}Input Draft:
${rawText}

Rewritten Bullet Points:`;
}

/**
 * Generates rule-based bullet points when LLM services are unreachable.
 */
export function generateFallbackBullets(
  rawText: string,
  context?: string
): string[] {
  if (!rawText || rawText.trim().length === 0) {
    return [];
  }

  // Clean rawText and split into sentences/clauses
  const cleaned = rawText.replace(/^[\s*•\-#\d.)]+/gm, '').trim();

  const lines = cleaned
    .split(/\n+|\.\s+(?=[A-Z])/)
    .map((line) => line.trim().replace(/\.$/, ''))
    .filter((line) => line.length > 5);

  const baseItems = lines.length > 0 ? lines : [cleaned];
  const bullets: string[] = [];

  for (let i = 0; i < Math.min(3, Math.max(2, baseItems.length)); i++) {
    const item = baseItems[i % baseItems.length];
    const verb = FALLBACK_ACTION_VERBS[i % FALLBACK_ACTION_VERBS.length];
    const impact =
      FALLBACK_IMPACT_METRICS[i % FALLBACK_IMPACT_METRICS.length];

    // Strip leading words if they repeat common phrases
    let coreAction = item
      .replace(
        /^(i\s+|we\s+|responsible for\s+|worked on\s+|helped\s+to\s+|built\s+|developed\s+)/i,
        ''
      )
      .trim();

    // Ensure first letter is lowercased for clause joining if needed
    if (coreAction.length > 0) {
      coreAction =
        coreAction.charAt(0).toLowerCase() + coreAction.slice(1);
    } else {
      coreAction = context
        ? `key engineering deliverables for ${context}`
        : 'mission-critical software deliverables';
    }

    // Check if the item already contains numbers or percentages
    const hasMetric = /(?:\d+%|\$\d+|\d+x|\d+\s*(?:k|m|users|requests|ms))/i.test(
      item
    );

    if (hasMetric) {
      bullets.push(
        `${verb} ${coreAction}, optimizing system performance and engineering reliability.`
      );
    } else {
      bullets.push(`${verb} ${coreAction}, ${impact}.`);
    }
  }

  return bullets;
}

/**
 * Executes a chat completion request to an OpenAI-compatible endpoint (OmniRoute or OpenAI).
 */
async function callOpenAiCompatibleApi(
  baseUrl: string,
  apiKey: string,
  model: string,
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  timeoutMs: number
): Promise<string | null> {
  const normalizedBaseUrl = baseUrl.replace(/\/+$/, '');
  const endpoint = normalizedBaseUrl.endsWith('/chat/completions')
    ? normalizedBaseUrl
    : `${normalizedBaseUrl}/chat/completions`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      return typeof content === 'string' ? content : null;
    }

    return null;
  } catch (error) {
    clearTimeout(timeoutId);
    return null;
  }
}

/**
 * Executes a generation request to the local Ollama daemon.
 */
async function callOllamaGenerateApi(
  endpoint: string,
  model: string,
  prompt: string,
  timeoutMs: number
): Promise<string | null> {
  const normalizedEndpoint = endpoint.replace(/\/+$/, '');
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${normalizedEndpoint}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        options: {
          temperature: 0.7,
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      return typeof data.response === 'string' ? data.response : null;
    }

    return null;
  } catch (error) {
    clearTimeout(timeoutId);
    return null;
  }
}

/**
 * Rewrites raw experience text into Google X-Y-Z formula bullets using OmniRoute, OpenAI, Ollama, or fallback.
 */
export async function rewriteBulletPoints(
  rawText: string,
  context?: string,
  tone = 'professional',
  options: AiClientOptions = {}
): Promise<BulletRewriteResult> {
  if (!rawText || rawText.trim().length === 0) {
    return { bullets: [], source: 'fallback' };
  }

  const config = resolveAiProviderConfig(options);
  const prompt = buildBulletPrompt(rawText, context, tone);

  // 1. OmniRoute API execution
  if (config.provider === 'omniroute' && config.apiKey) {
    const outputText = await callOpenAiCompatibleApi(
      config.baseUrl,
      config.apiKey,
      config.model,
      [
        {
          role: 'system',
          content:
            'You are an elite ATS resume optimization engine. Always output high-impact Google X-Y-Z bullets.',
        },
        { role: 'user', content: prompt },
      ],
      config.timeoutMs
    );

    if (outputText) {
      const parsedBullets = parseRawBullets(outputText);
      if (parsedBullets.length > 0) {
        return {
          bullets: parsedBullets.slice(0, 4),
          source: 'omniroute',
          modelUsed: config.model,
          provider: 'omniroute',
        };
      }
    }
  }

  // 2. OpenAI API execution
  if (config.provider === 'openai' && config.apiKey) {
    const outputText = await callOpenAiCompatibleApi(
      config.baseUrl,
      config.apiKey,
      config.model,
      [
        {
          role: 'system',
          content:
            'You are an elite ATS resume optimization engine. Always output high-impact Google X-Y-Z bullets.',
        },
        { role: 'user', content: prompt },
      ],
      config.timeoutMs
    );

    if (outputText) {
      const parsedBullets = parseRawBullets(outputText);
      if (parsedBullets.length > 0) {
        return {
          bullets: parsedBullets.slice(0, 4),
          source: 'openai',
          modelUsed: config.model,
          provider: 'openai',
        };
      }
    }
  }

  // 3. Local Ollama execution
  if (config.provider === 'ollama') {
    const outputText = await callOllamaGenerateApi(
      config.baseUrl,
      config.model,
      prompt,
      config.timeoutMs
    );

    if (outputText) {
      const parsedBullets = parseRawBullets(outputText);
      if (parsedBullets.length > 0) {
        return {
          bullets: parsedBullets.slice(0, 4),
          source: 'ollama',
          modelUsed: config.model,
          provider: 'ollama',
        };
      }
    }
  }

  // 4. Graceful deterministic fallback
  const fallbackBullets = generateFallbackBullets(rawText, context);
  return {
    bullets: fallbackBullets,
    source: 'fallback',
    modelUsed: 'heuristic-engine',
  };
}

/**
 * Parses raw LLM text output into clean, standalone bullet strings.
 */
function parseRawBullets(outputText: string): string[] {
  return outputText
    .split('\n')
    .map((line: string) => line.trim())
    .filter((line: string) => line.length > 0)
    .map((line: string) => line.replace(/^[\s*•\-#\d.)]+/, '').trim())
    .filter((line: string) => line.length > 10);
}

/**
 * Builds the LLM prompt for creating a tailored professional cover letter.
 */
export function buildCoverLetterPrompt(
  resume: ResumeData,
  jobTitle: string,
  company: string,
  jobDescription?: string
): string {
  const contact = resume.contact || {};
  const fullName = contact.fullName || 'Candidate';
  const email = contact.email || '';
  const phone = contact.phone || '';
  const location = contact.location || '';

  const skills = (resume.skills || [])
    .filter((s) => s.visible !== false)
    .flatMap((s) => s.skills || [])
    .slice(0, 15)
    .join(', ');

  const recentExp = (resume.experience || [])
    .filter((e) => e.visible !== false)
    .slice(0, 2)
    .map(
      (e) =>
        `${e.role} at ${e.company} (${e.startDate} - ${e.endDate || 'Present'}): ${(e.bullets || []).slice(0, 2).join('; ')}`
    )
    .join('\n');

  const summary = resume.summary?.visible ? resume.summary.text : '';

  return `You are a premier executive career strategist.
Write a compelling, tailored, professional 3-to-4 paragraph cover letter for ${fullName} applying for the position of "${jobTitle}" at "${company}".

Candidate Details:
- Name: ${fullName}
- Contact: ${[email, phone, location].filter(Boolean).join(' | ')}
${summary ? `- Professional Summary: ${summary}\n` : ''}${skills ? `- Core Skills & Competencies: ${skills}\n` : ''}${recentExp ? `- Relevant Experience:\n${recentExp}\n` : ''}
${jobDescription ? `Target Job Description:\n${jobDescription}\n` : ''}

Structure Guidelines:
1. Header / Salutation: Formal salutation to Hiring Team at ${company}.
2. Paragraph 1 (Opening & Hook): Express enthusiastic interest in the ${jobTitle} role at ${company}, stating years of expertise and high-level value.
3. Paragraph 2 (Proven Accomplishments & Technical Competence): Highlight 2-3 specific technical strengths and quantifiable achievements directly relevant to the role.
4. Paragraph 3 (Company Alignment & Impact): Articulate why ${company}'s mission and technological goals resonate with the candidate's background.
5. Paragraph 4 (Professional Closing): Confident call to action requesting an interview, thanking the hiring manager.
6. Formal Sign-off.

Write the complete cover letter clearly with standard paragraph breaks. Do NOT include placeholder tokens like "[Your Name]"—use the candidate's provided information.`;
}

/**
 * Generates a structured template-based cover letter when external LLMs are offline.
 */
export function generateFallbackCoverLetter(
  resume: ResumeData,
  jobTitle: string,
  company: string,
  jobDescription?: string
): string {
  const contact = resume.contact || {};
  const fullName = contact.fullName || 'Professional Candidate';
  const email = contact.email || 'candidate@example.com';
  const phone = contact.phone || '';
  const location = contact.location || '';

  const visibleSkills = (resume.skills || [])
    .filter((s) => s.visible !== false)
    .flatMap((s) => s.skills || []);

  const topSkillsStr =
    visibleSkills.length > 0
      ? visibleSkills.slice(0, 6).join(', ')
      : 'modern software engineering, architecture, and scalable system design';

  const visibleExp = (resume.experience || []).filter(
    (e) => e.visible !== false
  );
  const primaryRole =
    visibleExp.length > 0 ? visibleExp[0].role : 'Senior Professional';
  const primaryCompany =
    visibleExp.length > 0 ? visibleExp[0].company : 'leading organizations';
  const topBullet =
    visibleExp.length > 0 && visibleExp[0].bullets?.length > 0
      ? visibleExp[0].bullets[0]
      : 'driving mission-critical initiatives and delivering high-performance scalable solutions';

  const contactLine = [email, phone, location].filter(Boolean).join(' | ');

  return `${fullName}
${contactLine}

Dear Hiring Team at ${company},

I am writing to express my enthusiastic interest in the ${jobTitle} position at ${company}. With a proven track record as a ${primaryRole} and extensive expertise across ${topSkillsStr}, I am eager to leverage my background to drive immediate impact on your team's upcoming initiatives.

Throughout my career, most notably at ${primaryCompany}, I have focused on engineering robust, high-availability systems and accelerating delivery cycles. For example, I led key efforts ${topBullet.replace(/^[A-Z]/, (c) => c.toLowerCase())}. My technical foundation combined with a relentless focus on business outcomes enables me to bridge complex architectural requirements with scalable product execution.

What excites me most about ${company} is your commitment to innovation, excellence, and building impactful products. I am confident that my technical proficiency, analytical problem-solving abilities, and collaborative leadership will make a meaningful contribution to ${company}'s ongoing success.

I welcome the opportunity to discuss how my experience and skill set align with your goals for the ${jobTitle} role. Thank you for your time and consideration, and I look forward to speaking with you.

Sincerely,

${fullName}`;
}

/**
 * Generates a tailored cover letter using OmniRoute, OpenAI, Ollama, or graceful fallback.
 */
export async function generateCoverLetter(
  resume: ResumeData,
  jobTitle: string,
  company: string,
  jobDescription?: string,
  options: AiClientOptions = {}
): Promise<CoverLetterResult> {
  const config = resolveAiProviderConfig(options);
  const prompt = buildCoverLetterPrompt(
    resume,
    jobTitle,
    company,
    jobDescription
  );

  // 1. OmniRoute API
  if (config.provider === 'omniroute' && config.apiKey) {
    const outputText = await callOpenAiCompatibleApi(
      config.baseUrl,
      config.apiKey,
      config.model,
      [
        {
          role: 'system',
          content:
            'You are a premier executive career coach and professional cover letter author.',
        },
        { role: 'user', content: prompt },
      ],
      config.timeoutMs
    );

    if (outputText && outputText.trim().length > 100) {
      return {
        coverLetter: outputText.trim(),
        source: 'omniroute',
        modelUsed: config.model,
        provider: 'omniroute',
      };
    }
  }

  // 2. OpenAI API
  if (config.provider === 'openai' && config.apiKey) {
    const outputText = await callOpenAiCompatibleApi(
      config.baseUrl,
      config.apiKey,
      config.model,
      [
        {
          role: 'system',
          content:
            'You are a premier executive career coach and professional cover letter author.',
        },
        { role: 'user', content: prompt },
      ],
      config.timeoutMs
    );

    if (outputText && outputText.trim().length > 100) {
      return {
        coverLetter: outputText.trim(),
        source: 'openai',
        modelUsed: config.model,
        provider: 'openai',
      };
    }
  }

  // 3. Local Ollama API
  if (config.provider === 'ollama') {
    const outputText = await callOllamaGenerateApi(
      config.baseUrl,
      config.model,
      prompt,
      config.timeoutMs
    );

    if (outputText && outputText.trim().length > 100) {
      return {
        coverLetter: outputText.trim(),
        source: 'ollama',
        modelUsed: config.model,
        provider: 'ollama',
      };
    }
  }

  // 4. Fallback structured template
  const fallbackText = generateFallbackCoverLetter(
    resume,
    jobTitle,
    company,
    jobDescription
  );
  return {
    coverLetter: fallbackText,
    source: 'fallback',
    modelUsed: 'template-generator',
  };
}
