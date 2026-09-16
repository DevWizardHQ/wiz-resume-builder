import { describe, it, expect, vi, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as bulletRewriteRoute } from '@/app/api/ai/bullet-rewrite/route';
import { POST as atsAuditRoute } from '@/app/api/ai/ats-audit/route';
import { POST as coverLetterRoute } from '@/app/api/ai/cover-letter/route';
import { INITIAL_RESUME_DATA, ResumeData } from '@/types/resume';

function createJsonRequest(url: string, body: any): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('AI API Routes - /api/ai/bullet-rewrite', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('returns 400 when text parameter is missing or empty', async () => {
    const req = createJsonRequest('http://localhost:3000/api/ai/bullet-rewrite', {});
    const res = await bulletRewriteRoute(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error).toContain('Missing or invalid "text"');
  });

  it('returns 200 and rewritten bullets using fallback when Ollama is offline', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Offline'));

    const req = createJsonRequest('http://localhost:3000/api/ai/bullet-rewrite', {
      text: 'Developed payment gateway and improved API performance',
      context: 'Senior Backend Engineer',
    });

    const res = await bulletRewriteRoute(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.source).toBe('fallback');
    expect(json.bullets.length).toBeGreaterThanOrEqual(2);
  });
});

describe('AI API Routes - /api/ai/ats-audit', () => {
  it('returns 400 when resume object is missing', async () => {
    const req = createJsonRequest('http://localhost:3000/api/ai/ats-audit', {});
    const res = await atsAuditRoute(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error).toContain('Missing or invalid "resume"');
  });

  it('returns 200 with full ATS analysis result for valid resume payload', async () => {
    const sampleResume: ResumeData = {
      ...INITIAL_RESUME_DATA,
      contact: {
        fullName: 'Jordan Smith',
        email: 'jordan@example.com',
        phone: '123-456-7890',
        location: 'New York, NY',
      },
      summary: {
        text: 'Senior Full Stack Engineer with 6 years experience in Next.js and TypeScript.',
        visible: true,
      },
    };

    const req = createJsonRequest('http://localhost:3000/api/ai/ats-audit', {
      resume: sampleResume,
      jobDescription: 'Seeking Senior Engineer with Next.js and TypeScript experience.',
    });

    const res = await atsAuditRoute(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.overallScore).toBeDefined();
    expect(json.formatScore).toBeDefined();
    expect(json.keywordScore).toBeDefined();
    expect(json.matchedKeywords).toContain('typescript');
    expect(json.matchedKeywords).toContain('next.js');
  });
});

describe('AI API Routes - /api/ai/cover-letter', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('returns 400 when jobTitle or company is missing', async () => {
    const req1 = createJsonRequest('http://localhost:3000/api/ai/cover-letter', {
      resume: INITIAL_RESUME_DATA,
      company: 'Google',
    });
    const res1 = await coverLetterRoute(req1);
    expect(res1.status).toBe(400);

    const req2 = createJsonRequest('http://localhost:3000/api/ai/cover-letter', {
      resume: INITIAL_RESUME_DATA,
      jobTitle: 'Software Engineer',
    });
    const res2 = await coverLetterRoute(req2);
    expect(res2.status).toBe(400);
  });

  it('returns 200 with generated cover letter for valid payload', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Offline'));

    const req = createJsonRequest('http://localhost:3000/api/ai/cover-letter', {
      resume: {
        ...INITIAL_RESUME_DATA,
        contact: {
          fullName: 'Taylor Morgan',
          email: 'taylor@example.com',
          phone: '555-0100',
          location: 'Austin, TX',
        },
      },
      jobTitle: 'Lead Software Architect',
      company: 'Anthropic',
      jobDescription: 'Seeking lead architect to design AI applications.',
    });

    const res = await coverLetterRoute(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.coverLetter).toBeDefined();
    expect(json.coverLetter).toContain('Taylor Morgan');
    expect(json.coverLetter).toContain('Dear Hiring Team at Anthropic');
    expect(json.coverLetter).toContain('Lead Software Architect');
  });
});
