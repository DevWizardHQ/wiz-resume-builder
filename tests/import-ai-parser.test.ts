import { describe, it, expect, beforeEach } from 'vitest';
import {
  buildResumeParsePrompt,
  extractStructuredResume,
  parseResumeWithAi,
} from '@/lib/ai/resume-parser-ai';
import {
  parsePlainTextResume,
  importedResumeToData,
} from '@/lib/import/resume-parser';
import { useResumeStore } from '@/store/useResumeStore';
import { INITIAL_RESUME_DATA } from '@/types/resume';

const RAW_TEXT = `Jane Doe
jane.doe@example.com | +1 (555) 013-2478

EXPERIENCE
Senior Full Stack Engineer, Acme Corp
2018-03 - 2024-01
- Led migration to TypeScript microservices
- Reduced infrastructure costs by 22%

EDUCATION
B.S. Computer Science, MIT, 2011-09 - 2015-05

SKILLS
TypeScript, React, Node.js, AWS, Kubernetes
`;

describe('Resume Import AI - prompt engineering', () => {
  it('builds a structured-parse prompt with strict JSON output rules', () => {
    const prompt = buildResumeParsePrompt(RAW_TEXT);
    expect(prompt).toContain('JSON Resume schema');
    expect(prompt).toContain('Jane Doe');
    expect(prompt).toContain('Output ONLY');
    expect(prompt).toContain('do NOT use "I", "me", "my"');
  });
});

describe('Resume Import AI - structured response parsing', () => {
  it('extracts structured resume from valid JSON, falling back per-field', () => {
    const fallback = parsePlainTextResume(RAW_TEXT);
    const llmJson = JSON.stringify({
      work: [
        {
          company: 'Acme Corp',
          position: 'Principal Engineer',
          startDate: '2018-03',
          endDate: '2024-01',
          highlights: [
            'Led migration to TypeScript microservices',
            'Reduced infrastructure costs by 22%',
            'Drove SLOs to 99.9%',
          ],
        },
      ],
      skills: [{ name: 'Languages', keywords: ['TypeScript', 'Go'] }],
    });
    const result = extractStructuredResume(llmJson, fallback);
    expect(result.experience[0].role).toBe('Principal Engineer');
    expect(result.experience[0].bullets).toContain('Drove SLOs to 99.9%');
    // Fields the LLM did not supply keep the heuristic fallback values
    expect(result.contact.email).toBe('jane.doe@example.com');
    expect(result.education).toHaveLength(1);
    expect(result.skills[0].categoryName).toBe('Languages');
  });

  it('returns the fallback when LLM JSON is invalid or empty', () => {
    const fallback = parsePlainTextResume(RAW_TEXT);
    const result = extractStructuredResume('not json at all', fallback);
    expect(result.experience).toHaveLength(1);
    expect(result.contact.fullName).toBe('Jane Doe');
  });
});

describe('Resume Import AI - full provider pipeline', () => {
  it('degrades to heuristic fallback when no AI provider is configured', async () => {
    const result = await parseResumeWithAi(RAW_TEXT);
    expect(result.data.contact.email).toBe('jane.doe@example.com');
    expect(result.source).toBe('heuristic');
    expect(result.data.experience.length).toBeGreaterThan(0);
  });
});

describe('Resume Import AI - Zustand store integration', () => {
  beforeEach(() => {
    useResumeStore.setState({
      data: JSON.parse(JSON.stringify(INITIAL_RESUME_DATA)),
      past: [],
      future: [],
      isDirty: false,
    });
  });

  it('replaces resume data and records a history snapshot', () => {
    const store = useResumeStore.getState();
    const imported = parsePlainTextResume(RAW_TEXT);
    (store as any).importResumeData(importedResumeToData(imported), 'replace');

    const state = useResumeStore.getState();
    expect(state.data.contact.fullName).toBe('Jane Doe');
    expect(state.data.experience).toHaveLength(1);
    expect(state.past.length).toBe(1);
    expect(state.isDirty).toBe(true);

    // Undo restores the previous (empty) resume
    state.undo();
    expect(useResumeStore.getState().data.contact.fullName).toBe('');
  });
});

describe('Resume Import AI - merge mode', () => {
  beforeEach(() => {
    useResumeStore.setState({
      data: {
        ...JSON.parse(JSON.stringify(INITIAL_RESUME_DATA)),
        experience: [
          {
            id: 'existing-1',
            visible: true,
            order: 0,
            company: 'Existing Co',
            role: 'Engineer',
            startDate: '2016-01',
            endDate: '2018-02',
            current: false,
            bullets: ['Existing bullet'],
          },
        ],
        skills: [
          {
            id: 'existing-skill',
            visible: true,
            order: 0,
            categoryName: 'Existing',
            skills: ['Java'],
          },
        ],
      },
      past: [],
      future: [],
      isDirty: false,
    });
  });

  it('appends imported items and merges contact fields without losing existing data', () => {
    const store = useResumeStore.getState();
    const imported = parsePlainTextResume(RAW_TEXT);
    (store as any).importResumeData(importedResumeToData(imported), 'merge');

    const state = useResumeStore.getState();
    // Contact merge: existing fields preserved, imported fills empties
    expect(state.data.contact.fullName).toBe('Jane Doe');

    // Experience: existing kept + imported appended
    expect(state.data.experience).toHaveLength(2);
    expect(state.data.experience[0].company).toBe('Existing Co');
    expect(state.data.experience[1].company).toBe('Acme Corp');

    // Skills merge by category name
    expect(state.data.skills.length).toBeGreaterThanOrEqual(1);
    // Undo returns to the original
    state.undo();
    expect(useResumeStore.getState().data.experience).toHaveLength(1);
  });
});

describe('POST /api/ai/parse-resume route handler', () => {
  it('returns 400 when body content is missing', async () => {
    const { POST } = await import('@/app/api/ai/parse-resume/route');
    const req = new Request('http://localhost:3000/api/ai/parse-resume', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req as any);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('No resume content');
  });

  it('short-circuits JSON Resume format without LLM', async () => {
    const { POST } = await import('@/app/api/ai/parse-resume/route');
    const jsonResume = JSON.stringify({
      basics: { name: 'Alex Smith', email: 'alex@example.com' },
      work: [{ company: 'Test Co', position: 'Dev' }],
    });
    const req = new Request('http://localhost:3000/api/ai/parse-resume', {
      method: 'POST',
      body: JSON.stringify({ content: jsonResume, sourceType: 'json' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.source).toBe('json');
    expect(body.data.contact.fullName).toBe('Alex Smith');
    expect(body.data.experience[0].company).toBe('Test Co');
  });

  it('parses text resume via fallback when no LLM key is configured', async () => {
    const { POST } = await import('@/app/api/ai/parse-resume/route');
    const req = new Request('http://localhost:3000/api/ai/parse-resume', {
      method: 'POST',
      body: JSON.stringify({ rawText: RAW_TEXT, sourceType: 'text' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.contact.email).toBe('jane.doe@example.com');
    expect(body.source).toBe('heuristic');
  });
});

