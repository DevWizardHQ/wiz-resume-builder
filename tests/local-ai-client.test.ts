import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  checkOllamaHealth,
  buildBulletPrompt,
  buildCoverLetterPrompt,
  generateFallbackBullets,
  generateFallbackCoverLetter,
  rewriteBulletPoints,
  generateCoverLetter,
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

    // Each bullet should start with an action verb and contain quantifiable metrics or impact
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

describe('Local AI Client - Inference & Graceful Degradation', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('returns parsed bullets with source "ollama" when Ollama responds successfully', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        response: '- Spearheaded the migration to Next.js 15, improving page load speeds by 40%.\n- Engineered microservices architecture handling 100k requests/sec.',
      }),
    });

    const result = await rewriteBulletPoints('Built Next.js app and scaled microservices');
    expect(result.source).toBe('ollama');
    expect(result.bullets.length).toBe(2);
    expect(result.bullets[0]).toContain('Spearheaded the migration to Next.js 15');
    expect(result.bullets[1]).toContain('Engineered microservices architecture');
  });

  it('falls back seamlessly to rule-based bullets with source "fallback" when Ollama is offline', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Failed to fetch'));

    const result = await rewriteBulletPoints('Created automated deployment pipelines for the infrastructure team');
    expect(result.source).toBe('fallback');
    expect(result.bullets.length).toBeGreaterThanOrEqual(2);
    expect(result.bullets[0]).toMatch(/^(Spearheaded|Architected|Optimized|Engineered|Streamlined|Accelerated|Implemented)/);
  });

  it('returns cover letter with source "ollama" when inference succeeds', async () => {
    const mockCoverLetter = `Dear Hiring Team,\n\nI am writing to express my enthusiasm for the Senior Engineer role...\n\nSincerely,\nCandidate`;
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        response: mockCoverLetter,
      }),
    });

    const result = await generateCoverLetter(INITIAL_RESUME_DATA, 'Senior Engineer', 'Acme Inc');
    expect(result.source).toBe('ollama');
    expect(result.coverLetter).toBe(mockCoverLetter);
  });

  it('falls back seamlessly to structured cover letter when Ollama is offline', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Connection refused'));

    const result = await generateCoverLetter(INITIAL_RESUME_DATA, 'Lead Architect', 'Nexus Corp');
    expect(result.source).toBe('fallback');
    expect(result.coverLetter).toContain('Dear Hiring Team at Nexus Corp');
    expect(result.coverLetter).toContain('Lead Architect');
  });
});
