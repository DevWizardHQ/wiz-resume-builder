import {
  AiClientOptions,
  AiProvider,
  callOllamaGenerateApi,
  callOpenAiCompatibleApi,
  resolveAiProviderConfig,
} from '@/lib/ai/local-client';

export type SummarySeniorityLevel =
  | 'entry'
  | 'mid'
  | 'senior'
  | 'lead'
  | 'executive';

export type SummaryTone =
  | 'impactful'
  | 'technical'
  | 'leadership'
  | 'concise';

export interface SummaryGenerationRequest {
  jobTitle?: string;
  targetRole?: string;
  yearsOfExperience?: number | string;
  seniorityLevel?: SummarySeniorityLevel;
  tone?: SummaryTone;
  topSkills?: string[];
  keyAchievements?: string[];
  currentSummary?: string;
}

export interface SummaryVariation {
  id: string;
  label: string;
  tone: SummaryTone;
  text: string;
  wordCount: number;
  characterCount: number;
  keyStrengths: string[];
}

export interface SummaryGenerationResult {
  variations: SummaryVariation[];
  source: AiProvider;
  modelUsed?: string;
}

/**
 * Normalizes and formats years of experience string/number.
 */
function formatYears(years?: number | string): string {
  if (years === undefined || years === null || years === '') return '';
  const num = typeof years === 'number' ? years : parseInt(String(years).replace(/[^\d]/g, ''), 10);
  if (isNaN(num) || num <= 0) return '';
  return num === 1 ? '1+ year' : `${num}+ years`;
}

/**
 * Builds the LLM prompt for generating 3 ATS-compliant professional summaries.
 */
export function buildSummaryPrompt(req: SummaryGenerationRequest): string {
  const role = req.targetRole || req.jobTitle || 'Software Professional';
  const seniority = req.seniorityLevel || 'senior';
  const years = formatYears(req.yearsOfExperience);
  const skillsList = (req.topSkills || []).filter(Boolean).slice(0, 10).join(', ');
  const achievements = (req.keyAchievements || []).filter(Boolean).slice(0, 3).join('; ');
  const primaryTone = req.tone || 'impactful';

  return `You are a world-class executive resume writer and ATS optimization specialist.
Generate 3 distinct, ATS-compliant, high-impact professional resume summaries tailored for a ${seniority}-level "${role}".

Candidate Background:
- Target Role: ${role}
- Seniority Level: ${seniority}
${years ? `- Experience: ${years} of professional experience\n` : ''}${skillsList ? `- Core Skills: ${skillsList}\n` : ''}${achievements ? `- Key Achievements: ${achievements}\n` : ''}${req.currentSummary ? `- Current Draft: ${req.currentSummary}\n` : ''}
Preferred Primary Tone: ${primaryTone}

Strict ATS & Style Rules:
1. Write in active, third-person implied voice (NEVER use "I", "me", "my", "our", or "we").
2. Keep each summary concise and impactful: exactly 2 to 4 sentences (40 to 80 words).
3. Seamlessly weave in relevant high-value industry keywords and core competencies.
4. Include quantified business value, scale, or velocity metrics where appropriate.
5. Provide exactly 3 distinct variations formatted as JSON with the following schema:

[
  {
    "id": "results-driven",
    "label": "Results & Impact Driven",
    "tone": "impactful",
    "text": "<2-4 sentences highlighting business outcomes, efficiency gains, and quantified ROI>",
    "keyStrengths": ["Business Impact", "Performance Optimization", "ROI Delivery"]
  },
  {
    "id": "technical-mastery",
    "label": "Technical & Architecture Focused",
    "tone": "technical",
    "text": "<2-4 sentences highlighting deep technical competencies, tooling, and engineering rigor>",
    "keyStrengths": ["System Architecture", "Modern Tech Stack", "Engineering Rigor"]
  },
  {
    "id": "leadership-growth",
    "label": "Leadership & Strategic Growth",
    "tone": "leadership",
    "text": "<2-4 sentences highlighting cross-functional leadership, team mentoring, and scaling>",
    "keyStrengths": ["Cross-Functional Leadership", "Team Mentorship", "Strategic Execution"]
  }
]

Output ONLY the valid JSON array. Do NOT include markdown code fences, headers, or any introductory commentary.`;
}

/**
 * Deterministic rule-based fallback summary generator when LLM is unavailable.
 */
export function generateFallbackSummaries(
  req: SummaryGenerationRequest
): SummaryVariation[] {
  const role = (req.targetRole || req.jobTitle || 'Software Engineer').trim();
  const seniority = req.seniorityLevel || 'senior';
  const years = formatYears(req.yearsOfExperience) || (seniority === 'executive' ? '12+ years' : seniority === 'lead' ? '8+ years' : seniority === 'senior' ? '5+ years' : seniority === 'mid' ? '3+ years' : '1+ year');
  const skills = (req.topSkills || []).filter(Boolean);
  const primarySkills = skills.slice(0, 4).join(', ') || 'modern architecture, system design, and agile methodologies';
  const secondarySkills = skills.slice(4, 8).join(', ') || 'cloud infrastructure, performance optimization, and CI/CD automation';

  // 1. Results & Impact Variation
  const impactfulText = `${seniority === 'executive' ? 'Visionary executive and' : seniority === 'lead' ? 'Accomplished lead' : seniority === 'senior' ? 'Results-oriented senior' : 'Driven'} ${role} with ${years} of proven experience delivering high-scale software solutions and accelerating digital transformation. Expert at leveraging ${primarySkills} to boost operational efficiency and optimize system throughput. Demonstrated track record of translating complex product requirements into robust, high-performance architectures that drive measurable business growth.`;

  // 2. Technical & Architecture Variation
  const technicalText = `Technically adept ${role} specializing in ${primarySkills} and ${secondarySkills}. Combines deep domain expertise with rigorous engineering practices to design, develop, and deploy mission-critical systems with 99.9% uptime. Passionate about automated testing, architectural scalability, and building maintainable codebases that adhere to industry-standard security and performance benchmarks.`;

  // 3. Leadership & Scale Variation
  const leadershipText = `Strategic ${seniority === 'entry' ? 'collaborative' : 'cross-functional'} ${role} with extensive experience coordinating agile teams, mentoring engineering talent, and partnering with executive stakeholders. Skilled in steering roadmap execution, bridging technical and product priorities, and championing best practices across ${primarySkills}. Adept at fostering a culture of continuous delivery, technical excellence, and rapid innovation in fast-paced environments.`;

  const results: SummaryVariation[] = [
    {
      id: 'impactful',
      label: 'Results & Impact Driven',
      tone: 'impactful',
      text: impactfulText,
      wordCount: impactfulText.split(/\s+/).length,
      characterCount: impactfulText.length,
      keyStrengths: ['Quantified Impact', 'Business Alignment', 'System Throughput'],
    },
    {
      id: 'technical',
      label: 'Technical & Architecture Focused',
      tone: 'technical',
      text: technicalText,
      wordCount: technicalText.split(/\s+/).length,
      characterCount: technicalText.length,
      keyStrengths: ['Technical Depth', 'Architecture & Scalability', 'Engineering Rigor'],
    },
    {
      id: 'leadership',
      label: 'Leadership & Strategic Growth',
      tone: 'leadership',
      text: leadershipText,
      wordCount: leadershipText.split(/\s+/).length,
      characterCount: leadershipText.length,
      keyStrengths: ['Stakeholder Management', 'Agile Execution', 'Team Mentorship'],
    },
  ];

  return results;
}

/**
 * Parses raw LLM response text into structured SummaryVariation array.
 */
export function parseSummaryResponse(
  rawText: string,
  req: SummaryGenerationRequest
): SummaryVariation[] {
  if (!rawText || typeof rawText !== 'string') {
    return generateFallbackSummaries(req);
  }

  // Attempt 1: Direct JSON parsing or extracting JSON from markdown code blocks
  try {
    let cleanJson = rawText.trim();
    // Remove markdown code fences if present (```json ... ``` or ``` ...)
    const jsonBlockMatch = cleanJson.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonBlockMatch && jsonBlockMatch[1]) {
      cleanJson = jsonBlockMatch[1].trim();
    }

    // Try parsing as array
    const parsed = JSON.parse(cleanJson);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((item: any, index: number) => {
        const text = String(item.text || item.summary || item.content || '').trim();
        const tone: SummaryTone =
          item.tone === 'technical' || item.tone === 'leadership' || item.tone === 'concise' || item.tone === 'impactful'
            ? item.tone
            : index === 0
            ? 'impactful'
            : index === 1
            ? 'technical'
            : 'leadership';

        const label =
          typeof item.label === 'string' && item.label.length > 0
            ? item.label
            : tone === 'impactful'
            ? 'Results & Impact Driven'
            : tone === 'technical'
            ? 'Technical & Architecture Focused'
            : tone === 'leadership'
            ? 'Leadership & Strategic Growth'
            : 'Concise & ATS-Focused';

        const rawStrengths = Array.isArray(item.keyStrengths)
          ? item.keyStrengths.map(String)
          : Array.isArray(item.strengths)
          ? item.strengths.map(String)
          : ['ATS Compliant', 'Impact Driven'];

        return {
          id: String(item.id || `summary-var-${index + 1}`),
          label,
          tone,
          text,
          wordCount: text.split(/\s+/).filter(Boolean).length,
          characterCount: text.length,
          keyStrengths: rawStrengths.slice(0, 3),
        };
      }).filter((v) => v.text.length > 20);
    }
  } catch {
    // If JSON parsing fails, continue to heuristic text extraction
  }

  // Attempt 2: Extract paragraphs / numbered items
  const paragraphs = rawText
    .split(/(?:\n\s*\n|\n(?=\d+\.|\bOption\b|\bVariation\b))/gi)
    .map((p) => p.replace(/^(?:Option\s*\d+:?|\d+[\.\)]\s*|[-*]\s*)/i, '').trim())
    .filter((p) => p.length > 40 && !p.startsWith('{') && !p.startsWith('['));

  if (paragraphs.length >= 2) {
    const tones: SummaryTone[] = ['impactful', 'technical', 'leadership', 'concise'];
    const labels = [
      'Results & Impact Driven',
      'Technical & Architecture Focused',
      'Leadership & Strategic Growth',
    ];

    return paragraphs.slice(0, 3).map((text, idx) => ({
      id: `summary-var-${idx + 1}`,
      label: labels[idx] || `Summary Option ${idx + 1}`,
      tone: tones[idx % tones.length],
      text,
      wordCount: text.split(/\s+/).filter(Boolean).length,
      characterCount: text.length,
      keyStrengths: ['ATS Optimized', 'Career Focused'],
    }));
  }

  // Fallback to rule-based generation
  return generateFallbackSummaries(req);
}

/**
 * Generates ATS-optimized professional summaries using OmniRoute, OpenAI, Ollama, or Fallback.
 */
export async function generateProfessionalSummaries(
  req: SummaryGenerationRequest,
  options: AiClientOptions = {}
): Promise<SummaryGenerationResult> {
  const config = resolveAiProviderConfig(options);
  const prompt = buildSummaryPrompt(req);

  // 1. OmniRoute execution
  if (config.provider === 'omniroute' && config.apiKey) {
    const rawOutput = await callOpenAiCompatibleApi(
      config.baseUrl,
      config.apiKey,
      config.model,
      [
        {
          role: 'system',
          content:
            'You are an expert resume writer and career strategist specializing in ATS-compliant executive summaries. Output valid JSON arrays only.',
        },
        { role: 'user', content: prompt },
      ],
      config.timeoutMs
    );

    if (rawOutput) {
      const parsed = parseSummaryResponse(rawOutput, req);
      if (parsed.length > 0) {
        return {
          variations: parsed,
          source: 'omniroute',
          modelUsed: config.model,
        };
      }
    }
  }

  // 2. OpenAI execution
  if (config.provider === 'openai' && config.apiKey) {
    const rawOutput = await callOpenAiCompatibleApi(
      config.baseUrl,
      config.apiKey,
      config.model,
      [
        {
          role: 'system',
          content:
            'You are an expert resume writer and career strategist specializing in ATS-compliant executive summaries. Output valid JSON arrays only.',
        },
        { role: 'user', content: prompt },
      ],
      config.timeoutMs
    );

    if (rawOutput) {
      const parsed = parseSummaryResponse(rawOutput, req);
      if (parsed.length > 0) {
        return {
          variations: parsed,
          source: 'openai',
          modelUsed: config.model,
        };
      }
    }
  }

  // 3. Local Ollama execution
  if (config.provider === 'ollama') {
    const rawOutput = await callOllamaGenerateApi(
      config.baseUrl,
      config.model,
      prompt,
      config.timeoutMs
    );

    if (rawOutput) {
      const parsed = parseSummaryResponse(rawOutput, req);
      if (parsed.length > 0) {
        return {
          variations: parsed,
          source: 'ollama',
          modelUsed: config.model,
        };
      }
    }
  }

  // 4. Graceful deterministic fallback
  const fallbackVariations = generateFallbackSummaries(req);
  return {
    variations: fallbackVariations,
    source: 'fallback',
    modelUsed: 'heuristic-engine',
  };
}
