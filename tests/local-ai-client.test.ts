import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  checkOllamaHealth,
  buildBulletPrompt,
  buildCoverLetterPrompt,
  generateFallbackBullets,
  generateFallbackCoverLetter,
  rewriteBulletPoints,
  generateCoverLetter,
  resolveAiProviderConfig,
  DEFAULT_OLLAMA_ENDPOINT,
} from '@/lib/ai/local-client';
import { INITIAL_RESUME_DATA, ResumeData } from '@/types/resume';

describe('Local AI Client - Health Checker', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('reports available: true when Ollama endpoint returns models', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        models: [
          { name: 'llama3.2:latest', size: 2000000000 },
          { name: 'mistral:latest', size: 4000000000 },
        ],
      }),
    });

    const health = await checkOllamaHealth('http://localhost:11434');
    expect(health.available).toBe(true);
    expect(health.models).toEqual(['llama3.2:latest', 'mistral:latest']);
    expect(health.message).toContain('Ollama is running');
  });

  it('reports available: false when Ollama endpoint is offline/unreachable', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'));

    const health = await checkOllamaHealth('http://localhost:11434');
    expect(health.available).toBe(false);
    expect(health.models).toEqual([]);
    expect(health.message).toContain('Could not connect to Ollama');
  });

  it('handles request timeout gracefully with AbortError', async () => {
    const abortError = new Error('The operation was aborted');
    abortError.name = 'AbortError';
    global.fetch = vi.fn().mockRejectedValue(abortError);

    const health = await checkOllamaHealth('http://localhost:11434', 100);
    expect(health.available).toBe(false);
    expect(health.message).toContain('timed out');
  });
});

describe('AI Client - Provider Resolution', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('resolves omniroute when OMNIROUTE_API_KEY is present', () => {
    delete process.env.AI_PROVIDER;
    delete process.env.OPENAI_API_KEY;
    process.env.OMNIROUTE_API_KEY = 'test-omniroute-key';

    const config = resolveAiProviderConfig();
    expect(config.provider).toBe('omniroute');
    expect(config.apiKey).toBe('test-omniroute-key');
    expect(config.baseUrl).toContain('omniroute');
  });

  it('resolves openai when explicitly configured in AI_PROVIDER', () => {
    process.env.AI_PROVIDER = 'openai';
    process.env.OPENAI_API_KEY = 'test-openai-key';

    const config = resolveAiProviderConfig();
    expect(config.provider).toBe('openai');
    expect(config.apiKey).toBe('test-openai-key');
    expect(config.baseUrl).toContain('openai.com');
  });

  it('allows explicit override via options', () => {
    const config = resolveAiProviderConfig({
      provider: 'openai',
      apiKey: 'manual-openai-key',
      model: 'gpt-4o',
    });
    expect(config.provider).toBe('openai');
    expect(config.apiKey).toBe('manual-openai-key');
    expect(config.model).toBe('gpt-4o');
  });
});

describe('Local AI Client - Prompt Builders', () => {
  it('builds bullet rewrite prompt containing Google X-Y-Z formula instructions', () => {
    const prompt = buildBulletPrompt('Responsible for building backend services', 'Senior Backend Engineer', 'executive');
    expect(prompt).toContain('Google\'s X-Y-Z formula');
    expect(prompt).toContain('Senior Backend Engineer');
    expect(prompt).toContain('executive');
    expect(prompt).toContain('Responsible for building backend services');
  });

  it('builds cover letter prompt incorporating candidate resume data and job details', () => {
    const resume: ResumeData = {
      ...INITIAL_RESUME_DATA,
      contact: {
        fullName: 'Jordan Taylor',
        email: 'jordan@example.com',
        phone: '555-0100',
        location: 'Seattle, WA',
      },
      skills: [
        {
          id: 'sk-1',
          visible: true,
          order: 0,
          categoryName: 'Tech',
          skills: ['TypeScript', 'Next.js', 'PostgreSQL'],
        },
      ],
      experience: [
        {
          id: 'exp-1',
          visible: true,
          order: 0,
          company: 'Acme Systems',
          role: 'Staff Engineer',
          startDate: '2020-01',
          current: true,
          bullets: ['Scaled distributed services to 1M users.'],
        },
      ],
    };

    const prompt = buildCoverLetterPrompt(resume, 'Principal Architect', 'CloudScale Inc', 'Looking for cloud expert');
    expect(prompt).toContain('Jordan Taylor');
    expect(prompt).toContain('Principal Architect');
    expect(prompt).toContain('CloudScale Inc');
    expect(prompt).toContain('TypeScript');
    expect(prompt).toContain('Staff Engineer');
    expect(prompt).toContain('Looking for cloud expert');
  });
});

describe('Local AI Client - Rule-Based Fallback Generators', () => {
  it('generates 2-3 Google X-Y-Z style bullets with strong verbs and metrics', () => {
    const rawDraft = 'I worked on the search engine. I also helped with frontend optimization.';
    const bullets = generateFallbackBullets(rawDraft, 'Full Stack Engineer');

    expect(bullets.length).toBeGreaterThanOrEqual(2);
    expect(bullets.length).toBeLessThanOrEqual(3);

    for (const bullet of bullets) {
      expect(bullet).toMatch(/^(Spearheaded|Architected|Optimized|Engineered|Streamlined|Accelerated|Implemented|Orchestrated|Transformed|Delivered)/);
      expect(bullet.length).toBeGreaterThan(25);
    }
  });

  it('returns empty array for empty or whitespace rawText', () => {
    expect(generateFallbackBullets('')).toEqual([]);
    expect(generateFallbackBullets('   ')).toEqual([]);
  });

  it('generates structured professional 4-paragraph cover letter using candidate info', () => {
    const resume: ResumeData = {
      ...INITIAL_RESUME_DATA,
      contact: {
        fullName: 'Elena Rostova',
        email: 'elena@example.com',
        phone: '555-0199',
        location: 'San Francisco, CA',
      },
      experience: [
        {
          id: 'exp-1',
          visible: true,
          order: 0,
          company: 'Fintech Innovations',
          role: 'Lead Full Stack Engineer',
          startDate: '2021-01',
          current: true,
          bullets: ['Architected payment processing engine processing $10M+ in transactions monthly.'],
        },
      ],
      skills: [
        {
          id: 'sk-1',
          visible: true,
          order: 0,
          categoryName: 'Core',
          skills: ['TypeScript', 'Next.js', 'PostgreSQL', 'Docker'],
        },
      ],
    };

    const letter = generateFallbackCoverLetter(resume, 'Senior Software Engineer', 'Stripe');

    expect(letter).toContain('Elena Rostova');
    expect(letter).toContain('Dear Hiring Team at Stripe');
    expect(letter).toContain('Senior Software Engineer');
    expect(letter).toContain('Lead Full Stack Engineer');
    expect(letter).toContain('Fintech Innovations');
    expect(letter).toContain('TypeScript, Next.js, PostgreSQL');
    expect(letter).toContain('Sincerely,');
  });
});

describe('AI Client - OmniRoute, OpenAI & Local Inference', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('executes chat completion via OmniRoute provider and formats Bearer auth header', async () => {
    global.fetch = vi.fn().mockImplementation(async (url: string, init?: any) => {
      expect(url).toContain('api.omniroute.ai');
      expect(init.headers.Authorization).toBe('Bearer test-omniroute-secret');
      return {
        ok: true,
        status: 200,
        json: async () => ({
          choices: [
            {
              message: {
                content: '- Spearheaded OmniRoute cloud infrastructure scaling, improving uptime to 99.99%.\n- Engineered high-throughput microservices reducing response latency by 45%.',
              },
            },
          ],
        }),
      };
    });

    const result = await rewriteBulletPoints('Built cloud infrastructure and optimized latency', 'DevOps', 'executive', {
      provider: 'omniroute',
      apiKey: 'test-omniroute-secret',
    });

    expect(result.source).toBe('omniroute');
    expect(result.bullets.length).toBe(2);
    expect(result.bullets[0]).toContain('Spearheaded OmniRoute cloud infrastructure');
  });

  it('executes chat completion via OpenAI provider with gpt-4o model', async () => {
    global.fetch = vi.fn().mockImplementation(async (url: string, init?: any) => {
      expect(url).toContain('api.openai.com');
      expect(init.headers.Authorization).toBe('Bearer test-openai-secret');
      return {
        ok: true,
        status: 200,
        json: async () => ({
          choices: [
            {
              message: {
                content: '- Architected distributed event-driven pipeline handling 50M events daily.\n- Optimized memory consumption by 30% via zero-copy data buffers.',
              },
            },
          ],
        }),
      };
    });

    const result = await rewriteBulletPoints('Scaled event pipelines with zero copy buffers', 'Backend Engineer', 'technical', {
      provider: 'openai',
      apiKey: 'test-openai-secret',
      model: 'gpt-4o',
    });

    expect(result.source).toBe('openai');
    expect(result.bullets.length).toBe(2);
    expect(result.bullets[0]).toContain('Architected distributed event-driven pipeline');
  });

  it('returns parsed bullets with source "ollama" when Ollama responds successfully', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        response: '- Spearheaded the migration to Next.js 15, improving page load speeds by 40%.\n- Engineered microservices architecture handling 100k requests/sec.',
      }),
    });

    const result = await rewriteBulletPoints('Built Next.js app and scaled microservices', undefined, undefined, {
      provider: 'ollama',
    });
    expect(result.source).toBe('ollama');
    expect(result.bullets.length).toBe(2);
    expect(result.bullets[0]).toContain('Spearheaded the migration to Next.js 15');
  });

  it('falls back seamlessly to rule-based bullets when provider fails or is offline', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Failed to fetch'));

    const result = await rewriteBulletPoints('Created automated deployment pipelines for the infrastructure team', undefined, undefined, {
      provider: 'omniroute',
      apiKey: 'test-key',
    });
    expect(result.source).toBe('fallback');
    expect(result.bullets.length).toBeGreaterThanOrEqual(2);
    expect(result.bullets[0]).toMatch(/^(Spearheaded|Architected|Optimized|Engineered|Streamlined|Accelerated|Implemented)/);
  });

  it('generates cover letter via OmniRoute provider', async () => {
    const mockCoverLetter = `Dear Hiring Team at Stripe,\n\nI am thrilled to apply for the Senior Infrastructure Engineer position...\n\nSincerely,\nCandidate`;
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [
          {
            message: {
              content: mockCoverLetter,
            },
          },
        ],
      }),
    });

    const result = await generateCoverLetter(INITIAL_RESUME_DATA, 'Senior Infrastructure Engineer', 'Stripe', undefined, {
      provider: 'omniroute',
      apiKey: 'test-omniroute-key',
    });

    expect(result.source).toBe('omniroute');
    expect(result.coverLetter).toBe(mockCoverLetter);
  });

  it('falls back seamlessly to structured cover letter when external API is offline', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Connection refused'));

    const result = await generateCoverLetter(INITIAL_RESUME_DATA, 'Lead Architect', 'Nexus Corp', undefined, {
      provider: 'openai',
      apiKey: 'test-openai-key',
    });
    expect(result.source).toBe('fallback');
    expect(result.coverLetter).toContain('Dear Hiring Team at Nexus Corp');
    expect(result.coverLetter).toContain('Lead Architect');
  });
});
