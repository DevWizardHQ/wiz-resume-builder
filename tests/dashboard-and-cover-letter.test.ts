import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as getResumesRoute, POST as createResumeRoute } from '@/app/api/resumes/route';
import {
  GET as getResumeByIdRoute,
  PATCH as patchResumeRoute,
  DELETE as deleteResumeRoute,
} from '@/app/api/resumes/[id]/route';
import { POST as coverLetterRoute } from '@/app/api/ai/cover-letter/route';
import {
  SAMPLE_ENGINEER_RESUME,
  SAMPLE_PRODUCT_RESUME,
  SAMPLE_EXECUTIVE_RESUME,
  DEMO_RESUMES,
} from '@/lib/sample-data';
import { INITIAL_RESUME_DATA, ResumeData, ResumeRecord } from '@/types/resume';
import { generateCoverLetter, buildCoverLetterPrompt } from '@/lib/ai/local-client';

function createJsonRequest(url: string, method: string, body?: any): NextRequest {
  if (body !== undefined) {
    return new NextRequest(new URL(url, 'http://localhost:3000'), {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }
  return new NextRequest(new URL(url, 'http://localhost:3000'), {
    method,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('Dashboard & Resume CRUD API Routes', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe('GET /api/resumes (List Resumes)', () => {
    it('returns 200 with demo resume records when offline/unauthenticated', async () => {
      const req = createJsonRequest('http://localhost:3000/api/resumes', 'GET');
      const res = await getResumesRoute(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(Array.isArray(json.resumes)).toBe(true);
      expect(json.resumes.length).toBeGreaterThanOrEqual(1);
      expect(json.resumes[0]).toHaveProperty('title');
      expect(json.resumes[0]).toHaveProperty('template_id');
      expect(json.resumes[0]).toHaveProperty('ats_score');
    });
  });

  describe('POST /api/resumes (Create & Clone Resumes)', () => {
    it('creates a new blank/custom resume successfully', async () => {
      const req = createJsonRequest('http://localhost:3000/api/resumes', 'POST', {
        title: 'Senior Frontend Architect',
        template_id: 'modern-minimal',
        use_sample_data: false,
      });

      const res = await createResumeRoute(req);
      expect(res.status).toBe(201);

      const json = await res.json();
      expect(json.resume).toBeDefined();
      expect(json.resume.title).toBe('Senior Frontend Architect');
      expect(json.resume.template_id).toBe('modern-minimal');
      expect(json.resume.slug).toBe('senior-frontend-architect');
    });

    it('creates a new resume pre-filled with ATS sample data when use_sample_data is true', async () => {
      const req = createJsonRequest('http://localhost:3000/api/resumes', 'POST', {
        title: 'Alex Rivera Tech Lead',
        template_id: 'executive',
        use_sample_data: true,
      });

      const res = await createResumeRoute(req);
      expect(res.status).toBe(201);

      const json = await res.json();
      expect(json.resume.title).toBe('Alex Rivera Tech Lead');
      expect(json.resume.content.contact.fullName).toBe('Alex Rivera');
      expect(json.resume.ats_score).toBeGreaterThan(60);
    });

    it('duplicates/clones an existing resume when clone_from_id is provided', async () => {
      const req = createJsonRequest('http://localhost:3000/api/resumes', 'POST', {
        clone_from_id: 'demo-resume-1',
      });

      const res = await createResumeRoute(req);
      expect(res.status).toBe(201);

      const json = await res.json();
      expect(json.resume).toBeDefined();
      expect(json.resume.title).toContain('Copy');
      expect(json.resume.template_id).toBe('classic-ats');
      expect(json.resume.content.contact.fullName).toBe(
        SAMPLE_ENGINEER_RESUME.contact.fullName
      );
    });
  });

  describe('GET /api/resumes/[id] (Fetch Single Resume)', () => {
    it('returns 200 with demo resume for special aliases (demo, sample)', async () => {
      const req = createJsonRequest('http://localhost:3000/api/resumes/demo', 'GET');
      const res = await getResumeByIdRoute(req, {
        params: Promise.resolve({ id: 'demo' }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.resume).toBeDefined();
      expect(json.resume.id).toBe(DEMO_RESUMES[0].id);
    });

    it('returns a fresh blank template for id="new"', async () => {
      const req = createJsonRequest('http://localhost:3000/api/resumes/new', 'GET');
      const res = await getResumeByIdRoute(req, {
        params: Promise.resolve({ id: 'new' }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.resume.id).toBe('new');
      expect(json.resume.title).toBe('Untitled Resume');
    });

    it('returns existing demo resume if found in fallback records', async () => {
      const req = createJsonRequest('http://localhost:3000/api/resumes/demo-resume-2', 'GET');
      const res = await getResumeByIdRoute(req, {
        params: Promise.resolve({ id: 'demo-resume-2' }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.resume.title).toBe('Principal Product Manager - FinTech');
    });
  });

  describe('PATCH /api/resumes/[id] (Update & Auto-save Sync)', () => {
    it('updates resume metadata and auto-computes ATS score on content change', async () => {
      const updatedContent: ResumeData = {
        ...SAMPLE_ENGINEER_RESUME,
        contact: {
          ...SAMPLE_ENGINEER_RESUME.contact,
          fullName: 'Elena Rostova',
        },
      };

      const req = createJsonRequest('http://localhost:3000/api/resumes/demo-resume-1', 'PATCH', {
        title: 'Elena Principal Architect',
        template_id: 'executive',
        content: updatedContent,
      });

      const res = await patchResumeRoute(req, {
        params: Promise.resolve({ id: 'demo-resume-1' }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.resume.title).toBe('Elena Principal Architect');
      expect(json.resume.slug).toBe('elena-principal-architect');
      expect(json.resume.template_id).toBe('executive');
      expect(json.resume.content.contact.fullName).toBe('Elena Rostova');
      expect(json.resume.ats_score).toBeGreaterThan(0);
    });
  });

  describe('DELETE /api/resumes/[id] (Delete Resume)', () => {
    it('deletes resume record and returns success 200', async () => {
      const req = createJsonRequest('http://localhost:3000/api/resumes/test-delete-id', 'DELETE');
      const res = await deleteResumeRoute(req, {
        params: Promise.resolve({ id: 'test-delete-id' }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.id).toBe('test-delete-id');
    });
  });
});

describe('AI Cover Letter Studio & Generator', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe('POST /api/ai/cover-letter', () => {
    it('returns 400 when missing required parameters', async () => {
      // Missing resume
      const req1 = createJsonRequest('http://localhost:3000/api/ai/cover-letter', 'POST', {
        jobTitle: 'Staff Engineer',
        company: 'Stripe',
      });
      const res1 = await coverLetterRoute(req1);
      expect(res1.status).toBe(400);

      // Missing company
      const req2 = createJsonRequest('http://localhost:3000/api/ai/cover-letter', 'POST', {
        resume: SAMPLE_ENGINEER_RESUME,
        jobTitle: 'Staff Engineer',
      });
      const res2 = await coverLetterRoute(req2);
      expect(res2.status).toBe(400);

      // Missing jobTitle
      const req3 = createJsonRequest('http://localhost:3000/api/ai/cover-letter', 'POST', {
        resume: SAMPLE_ENGINEER_RESUME,
        company: 'Stripe',
      });
      const res3 = await coverLetterRoute(req3);
      expect(res3.status).toBe(400);
    });

    it('generates structured tailored cover letter via fallback when Ollama is offline', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Connection refused'));

      const req = createJsonRequest('http://localhost:3000/api/ai/cover-letter', 'POST', {
        resume: SAMPLE_ENGINEER_RESUME,
        company: 'Apex Cloud Systems',
        jobTitle: 'Principal Distributed Systems Architect',
        jobDescription: 'Seeking expert in Kafka, Go, Kubernetes microservices, and high-throughput streaming.',
      });

      const res = await coverLetterRoute(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.source).toBe('fallback');
      expect(json.coverLetter).toBeDefined();
      expect(json.coverLetter).toContain('Alex Rivera');
      expect(json.coverLetter).toContain('Apex Cloud Systems');
      expect(json.coverLetter).toContain('Principal Distributed Systems Architect');
      expect(json.coverLetter.length).toBeGreaterThan(200);
    });

    it('formats prompt accurately incorporating candidate accomplishments and target role', () => {
      const prompt = buildCoverLetterPrompt(
        SAMPLE_ENGINEER_RESUME,
        'Staff Software Engineer',
        'Anthropic',
        'Looking for distributed systems and AI systems engineers.'
      );

      expect(prompt).toContain('Alex Rivera');
      expect(prompt).toContain('Staff Software Engineer');
      expect(prompt).toContain('Anthropic');
      expect(prompt).toContain('Apex Cloud Systems');
      expect(prompt).toContain('TypeScript');
    });
  });
});
