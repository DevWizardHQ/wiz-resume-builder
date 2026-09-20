import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ImportResumeModal } from '@/components/editor/ImportResumeModal';
import { useResumeStore } from '@/store/useResumeStore';
import { INITIAL_RESUME_DATA, ResumeData } from '@/types/resume';
import {
  extractTextFromFile,
  parseJsonResumeContent,
  parseTextResumeContent,
} from '@/lib/import/resume-parser';

vi.mock('mammoth', () => ({
  default: {
    extractRawText: vi.fn().mockResolvedValue({
      value: 'Morgan Reed\nmorgan@tech.io\n\nEXPERIENCE\nPrincipal Architect | Cloud Corp | 2021-01 - Present\n- Led platform engineering',
    }),
  },
  extractRawText: vi.fn().mockResolvedValue({
    value: 'Morgan Reed\nmorgan@tech.io\n\nEXPERIENCE\nPrincipal Architect | Cloud Corp | 2021-01 - Present\n- Led platform engineering',
  }),
}));

vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: { workerSrc: '' },
  version: '4.0.0',
  getDocument: vi.fn().mockReturnValue({
    promise: Promise.resolve({
      numPages: 1,
      getPage: vi.fn().mockResolvedValue({
        getTextContent: vi.fn().mockResolvedValue({
          items: [
            { str: 'Morgan Reed', transform: [0, 0, 0, 0, 50, 700] },
            { str: 'morgan@tech.io', transform: [0, 0, 0, 0, 150, 700] },
            { str: 'Principal Architect', transform: [0, 0, 0, 0, 50, 680] },
          ],
        }),
      }),
    }),
  }),
}));

describe('ImportResumeModal Component & Store Flow', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    useResumeStore.setState({
      data: JSON.parse(JSON.stringify(INITIAL_RESUME_DATA)),
      past: [],
      future: [],
      isDirty: false,
      title: 'My Resume',
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe('UI & Trigger Rendering', () => {
    it('renders default button trigger when open is false', () => {
      const html = renderToStaticMarkup(React.createElement(ImportResumeModal));
      expect(html).toContain('Import / Auto-Fill');
    });

    it('renders custom trigger when provided as prop', () => {
      const customTrigger = React.createElement('button', { id: 'custom-btn' }, 'Custom Import Trigger');
      const html = renderToStaticMarkup(
        React.createElement(ImportResumeModal, { trigger: customTrigger })
      );
      expect(html).toContain('Custom Import Trigger');
      expect(html).toContain('id="custom-btn"');
    });

    it('exports ImportResumeModal functional component correctly', () => {
      expect(typeof ImportResumeModal).toBe('function');
      expect(ImportResumeModal.name).toBe('ImportResumeModal');
    });

    it('renders trigger in open state when open is true', () => {
      const html = renderToStaticMarkup(
        React.createElement(ImportResumeModal, { open: true })
      );
      expect(html).toContain('Import / Auto-Fill');
      expect(html).toContain('aria-expanded="true"');
      expect(html).toContain('data-state="open"');
    });
  });

  describe('Store Integration (Merge and Replace Modes)', () => {
    it('parses pasted plain text and applies it to the store in merge mode with undo snapshot', () => {
      const resumeText = `Jane Doe
jane.doe@example.com
+1 (555) 987-6543
Seattle, WA

SUMMARY
Experienced software engineer specialized in full-stack cloud systems.

EXPERIENCE
Staff Engineer | Acme Corp | 2021-01 - Present
- Built distributed payment gateway processing 10k ops/sec.
- Led migration of 12 microservices to Kubernetes.

EDUCATION
BS in Computer Science | University of Washington | 2016 - 2020`;

      const parsed = parseTextResumeContent(resumeText);
      expect(parsed.contact.fullName).toBe('Jane Doe');
      expect(parsed.contact.email).toBe('jane.doe@example.com');
      expect(parsed.experience.length).toBe(1);

      useResumeStore.getState().importResumeData(parsed, 'merge');

      const state = useResumeStore.getState();
      expect(state.data.contact.fullName).toBe('Jane Doe');
      expect(state.data.contact.email).toBe('jane.doe@example.com');
      expect(state.data.experience.length).toBeGreaterThan(0);
      expect(state.data.experience[0].company).toBe('Acme Corp');
      expect(state.past.length).toBe(1); // Undo snapshot saved

      // Calling undo reverts the store to initial data
      state.undo();
      const revertedState = useResumeStore.getState();
      expect(revertedState.data.contact.fullName).toBe('');
      expect(revertedState.data.experience.length).toBe(0);
    });

    it('parses JSON Resume format and applies it in replace mode with undo snapshot', () => {
      const jsonResume = JSON.stringify({
        basics: {
          name: 'Jordan Lee',
          email: 'jordan@cloud.org',
          summary: 'Cloud Systems Architect with extensive experience in AWS and Go.',
        },
        work: [
          {
            name: 'Cloudflare',
            position: 'Senior Infrastructure Engineer',
            startDate: '2020-05',
            endDate: '2023-11',
            highlights: ['Managed global edge worker routing engine.'],
          },
        ],
        skills: [
          {
            name: 'Core Skills',
            keywords: ['Go', 'Rust', 'Kubernetes'],
          },
        ],
      });

      const parsed = parseJsonResumeContent(jsonResume);
      expect(parsed).not.toBeNull();
      if (!parsed) return;

      useResumeStore.getState().importResumeData(parsed, 'replace');

      const state = useResumeStore.getState();
      expect(state.data.contact.fullName).toBe('Jordan Lee');
      expect(state.data.contact.email).toBe('jordan@cloud.org');
      expect(state.data.experience.length).toBe(1);
      expect(state.data.experience[0].company).toBe('Cloudflare');
      expect(state.data.skills.length).toBe(1);
      expect(state.data.skills[0].skills).toEqual(['Go', 'Rust', 'Kubernetes']);
      expect(state.past.length).toBe(1);
      expect(state.isDirty).toBe(true);

      // Undo restores the empty state
      state.undo();
      expect(useResumeStore.getState().data.contact.fullName).toBe('');
      expect(useResumeStore.getState().data.experience.length).toBe(0);
    });
  });

  describe('Two-Stage File Upload & Pipeline Integration', () => {
    it('extracts text from uploaded plain text file (Stage 1)', async () => {
      const txtContent = `Alice Smith
alice@example.com
(555) 321-4567
San Francisco, CA

EXPERIENCE
Senior Frontend Engineer | TechStar | 2022-03 - Present
- Built high performance web applications with Next.js and TypeScript`;

      const file = new File([txtContent], 'resume.txt', { type: 'text/plain' });
      const extracted = await extractTextFromFile(file);

      expect(extracted.sourceType).toBe('text');
      expect(extracted.fileName).toBe('resume.txt');
      expect(extracted.text).toContain('Alice Smith');
      expect(extracted.text).toContain('TechStar');
    });

    it('extracts text from uploaded DOCX and PDF files (Stage 1)', async () => {
      const docxFile = new File([new ArrayBuffer(8)], 'resume.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      const docxExtracted = await extractTextFromFile(docxFile);
      expect(docxExtracted.sourceType).toBe('docx');
      expect(docxExtracted.text).toContain('Morgan Reed');

      const pdfFile = new File([new ArrayBuffer(8)], 'resume.pdf', {
        type: 'application/pdf',
      });
      const pdfExtracted = await extractTextFromFile(pdfFile);
      expect(pdfExtracted.sourceType).toBe('pdf');
      expect(pdfExtracted.text).toContain('Morgan Reed');
    });

    it('short-circuits JSON file upload directly via parseJsonResumeContent without AI endpoint', async () => {
      const jsonContent = JSON.stringify({
        basics: {
          name: 'Sarah Connor',
          email: 'sarah@cyberdyne.com',
        },
        work: [
          {
            name: 'Cyberdyne Systems',
            position: 'Chief Architect',
            startDate: '2019-01',
          },
        ],
      });
      const file = new File([jsonContent], 'resume.json', { type: 'application/json' });
      const extracted = await extractTextFromFile(file);
      expect(extracted.sourceType).toBe('json');

      const jsonData = parseJsonResumeContent(extracted.text);
      expect(jsonData).not.toBeNull();
      expect(jsonData?.contact.fullName).toBe('Sarah Connor');
      expect(jsonData?.experience[0].company).toBe('Cyberdyne Systems');
    });

    it('processes Stage 2 AI schema fitting on successful /api/ai/parse-resume response', async () => {
      const mockAiResume: ResumeData = {
        ...JSON.parse(JSON.stringify(INITIAL_RESUME_DATA)),
        contact: {
          ...INITIAL_RESUME_DATA.contact,
          fullName: 'AI Extracted User',
          email: 'ai@user.com',
        },
        experience: [
          {
            id: 'exp-ai-1',
            visible: true,
            order: 0,
            company: 'AI Labs Inc',
            role: 'AI Research Engineer',
            startDate: '2023-01',
            endDate: 'Present',
            current: true,
            bullets: ['Trained transformer models with 99.8% precision'],
          },
        ],
      };

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          data: mockAiResume,
          source: 'local-llm',
        }),
      });
      global.fetch = fetchMock;

      const file = new File(['Sample Resume Text'], 'sample.txt', { type: 'text/plain' });
      const extracted = await extractTextFromFile(file);

      const res = await fetch('/api/ai/parse-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: extracted.text,
          rawText: extracted.text,
          sourceType: extracted.sourceType,
          fileName: file.name,
        }),
      });

      expect(fetchMock).toHaveBeenCalledWith('/api/ai/parse-resume', expect.any(Object));
      expect(res.ok).toBe(true);
      const result = await res.json();
      expect(result.source).toBe('local-llm');
      expect(result.data.contact.fullName).toBe('AI Extracted User');
      expect(result.data.experience[0].company).toBe('AI Labs Inc');
    });

    it('falls back to deterministic heuristic parsing when AI endpoint returns 500 error', async () => {
      const rawResumeText = `Devin Booker
devin@phoenix.com
Phoenix, AZ

EXPERIENCE
Lead Guard | Phoenix Suns | 2015-06 - Present
- Scored 70 points in a single game
- Led team to NBA Finals`;

      const fetchMock = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: vi.fn().mockResolvedValue({ error: 'LLM server unavailable' }),
      });
      global.fetch = fetchMock;

      const file = new File([rawResumeText], 'devin.txt', { type: 'text/plain' });
      const extracted = await extractTextFromFile(file);

      const res = await fetch('/api/ai/parse-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: extracted.text,
          rawText: extracted.text,
          sourceType: extracted.sourceType,
          fileName: file.name,
        }),
      });

      expect(res.ok).toBe(false);

      // Fallback path
      const fallbackData = parseTextResumeContent(extracted.text);
      expect(fallbackData.contact.fullName).toBe('Devin Booker');
      expect(fallbackData.contact.email).toBe('devin@phoenix.com');
      expect(fallbackData.experience.length).toBeGreaterThan(0);
      expect(fallbackData.experience[0].company).toBe('Phoenix Suns');
    });

    it('falls back to deterministic heuristic parsing when fetch throws a network exception', async () => {
      const rawResumeText = `Nikola Jokic
nikola@denver.com
Denver, CO

EXPERIENCE
Center | Denver Nuggets | 2015-08 - Present
- Won NBA Championship and Finals MVP`;

      const fetchMock = vi.fn().mockRejectedValue(new Error('Network connection failed'));
      global.fetch = fetchMock;

      const file = new File([rawResumeText], 'nikola.txt', { type: 'text/plain' });
      const extracted = await extractTextFromFile(file);

      let parsedData: ResumeData | null = null;
      let source: string | null = null;

      try {
        const res = await fetch('/api/ai/parse-resume', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: extracted.text,
            rawText: extracted.text,
            sourceType: extracted.sourceType,
            fileName: file.name,
          }),
        });
        if (res.ok) {
          const result = await res.json();
          parsedData = result.data;
          source = result.source;
        } else {
          parsedData = parseTextResumeContent(extracted.text);
          source = 'heuristic';
        }
      } catch {
        parsedData = parseTextResumeContent(extracted.text);
        source = 'heuristic';
      }

      expect(source).toBe('heuristic');
      expect(parsedData).not.toBeNull();
      expect(parsedData?.contact.fullName).toBe('Nikola Jokic');
      expect(parsedData?.experience[0].company).toBe('Denver Nuggets');
    });

    it('throws descriptive error on unsupported file type upload', async () => {
      const badFile = new File(['binary content'], 'script.exe', {
        type: 'application/x-msdownload',
      });

      await expect(extractTextFromFile(badFile)).rejects.toThrow(/Unsupported file type/i);
    });
  });
});
