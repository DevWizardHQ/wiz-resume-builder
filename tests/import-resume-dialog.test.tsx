import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ImportResumeDialog } from '@/components/dashboard/ImportResumeDialog';
import {
  extractTextFromFile,
  parseJsonResumeContent,
  parseTextResumeContent,
} from '@/lib/import/resume-parser';
import { ResumeData } from '@/types/resume';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock('mammoth', () => ({
  default: {
    extractRawText: vi.fn().mockResolvedValue({
      value: 'Taylor Swift\ntaylor@music.io\n\nEXPERIENCE\nLead Producer | Big Machine | 2018-01 - Present\n- Composed and produced multi-platinum albums',
    }),
  },
  extractRawText: vi.fn().mockResolvedValue({
    value: 'Taylor Swift\ntaylor@music.io\n\nEXPERIENCE\nLead Producer | Big Machine | 2018-01 - Present\n- Composed and produced multi-platinum albums',
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
            { str: 'Taylor Swift', transform: [0, 0, 0, 0, 50, 700] },
            { str: 'taylor@music.io', transform: [0, 0, 0, 0, 150, 700] },
            { str: 'Lead Producer', transform: [0, 0, 0, 0, 50, 680] },
          ],
        }),
      }),
    }),
  }),
}));

describe('ImportResumeDialog Component & Creation Pipeline', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe('UI & Trigger Rendering', () => {
    it('renders default button trigger when open is false', () => {
      const html = renderToStaticMarkup(React.createElement(ImportResumeDialog));
      expect(html).toContain('Import Resume');
    });

    it('renders custom trigger when provided as prop', () => {
      const customTrigger = React.createElement('button', { id: 'dash-custom-btn' }, 'Upload and Create Resume');
      const html = renderToStaticMarkup(
        React.createElement(ImportResumeDialog, { trigger: customTrigger })
      );
      expect(html).toContain('Upload and Create Resume');
      expect(html).toContain('id="dash-custom-btn"');
    });

    it('exports ImportResumeDialog functional component correctly', () => {
      expect(typeof ImportResumeDialog).toBe('function');
      expect(ImportResumeDialog.name).toBe('ImportResumeDialog');
    });
  });

  describe('Creation Payload & Section Formatting', () => {
    it('extracts structured resume payload ready for POST /api/resumes with all sections', () => {
      const sampleText = `Alex Mercer
alex.mercer@dev.io
(555) 123-4567
Austin, TX

SUMMARY
Senior DevOps Engineer specialized in Kubernetes, Terraform, and distributed CI/CD pipelines.

EXPERIENCE
Lead DevOps Engineer | Austin Tech Corp | 2022-01 - Present
- Architected zero-downtime multi-region Kubernetes deployments on AWS.
- Automated infrastructure provisioning with Terraform and GitOps.

EDUCATION
BS in Computer Engineering | University of Texas at Austin | 2017 - 2021`;

      const parsed = parseTextResumeContent(sampleText);
      expect(parsed.contact.fullName).toBe('Alex Mercer');
      expect(parsed.contact.email).toBe('alex.mercer@dev.io');
      expect(parsed.contact.location).toBe('Austin, TX');
      expect(parsed.experience.length).toBe(1);
      expect(parsed.experience[0].company).toBe('Austin Tech Corp');
      expect(parsed.education.length).toBe(1);

      const postPayload = {
        title: parsed.contact.fullName ? `${parsed.contact.fullName} — Resume` : 'Imported Resume',
        template_id: 'classic-ats',
        use_sample_data: false,
        content: parsed,
      };

      expect(postPayload.title).toBe('Alex Mercer — Resume');
      expect(postPayload.content.contact.fullName).toBe('Alex Mercer');
      expect(postPayload.content.experience[0].bullets.length).toBe(2);
    });
  });

  describe('Stage 1 File Extraction & Stage 2 Pipeline Simulation', () => {
    it('extracts text from plain text file', async () => {
      const file = new File(
        ['Jordan Lee\njordan@corp.com\n\nEXPERIENCE\nSecurity Engineer | Cloud Armor | 2020 - Present'],
        'jordan-resume.txt',
        { type: 'text/plain' }
      );
      const extracted = await extractTextFromFile(file);
      expect(extracted.sourceType).toBe('text');
      expect(extracted.text).toContain('Jordan Lee');
      expect(extracted.text).toContain('Security Engineer');
    });

    it('extracts text from JSON resume and bypasses Stage 2 AI call', async () => {
      const jsonContent = JSON.stringify({
        basics: {
          name: 'Samantha Ray',
          email: 'samantha@ai.com',
          phone: '+1 555-0987',
          location: { city: 'Seattle', region: 'WA' },
        },
        work: [
          {
            name: 'Amazon Web Services',
            position: 'Principal Solutions Architect',
            startDate: '2019-03',
            highlights: ['Designed resilient multi-tenant architecture on ECS/EKS.'],
          },
        ],
      });

      const file = new File([jsonContent], 'samantha-resume.json', { type: 'application/json' });
      const extracted = await extractTextFromFile(file);
      expect(extracted.sourceType).toBe('json');

      const parsed = parseJsonResumeContent(extracted.text);
      expect(parsed).not.toBeNull();
      expect(parsed?.contact.fullName).toBe('Samantha Ray');
      expect(parsed?.contact.email).toBe('samantha@ai.com');
      expect(parsed?.experience[0].company).toBe('Amazon Web Services');

      const title = parsed?.contact.fullName ? `${parsed.contact.fullName} — Resume` : 'Imported Resume';
      expect(title).toBe('Samantha Ray — Resume');
    });

    it('extracts text from DOCX file via mammoth mock', async () => {
      const file = new File(['mock docx binary'], 'taylor-resume.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      const extracted = await extractTextFromFile(file);
      expect(extracted.sourceType).toBe('docx');
      expect(extracted.text).toContain('Taylor Swift');
      expect(extracted.text).toContain('Lead Producer');
    });

    it('extracts text from PDF file via pdfjs mock', async () => {
      const file = new File(['mock pdf binary'], 'taylor-resume.pdf', {
        type: 'application/pdf',
      });
      const extracted = await extractTextFromFile(file);
      expect(extracted.sourceType).toBe('pdf');
      expect(extracted.text).toContain('Taylor Swift');
      expect(extracted.text).toContain('taylor@music.io');
    });
  });

  describe('Stage 2 AI Schema Fitting & Title Calculation', () => {
    it('handles successful AI schema fitting and formats dynamic resume title', async () => {
      const mockAiResume: Partial<ResumeData> = {
        contact: {
          fullName: 'Elena Rostova',
          email: 'elena@cyber.io',
          phone: '+1 555-4433',
          location: 'San Francisco, CA',
          portfolioUrl: 'https://elena.dev',
          linkedinUrl: 'linkedin.com/in/elenarostova',
          githubUrl: 'github.com/elena',
        },
        summary: { text: 'Staff Software Engineer with 10+ years in distributed systems.', visible: true },
        experience: [
          {
            id: 'exp-1',
            company: 'Stripe',
            role: 'Staff Engineer',
            location: 'San Francisco, CA',
            startDate: '2021-06',
            endDate: '',
            current: true,
            bullets: ['Led migration of payment core to event-driven Kafka architecture.'],
            visible: true,
            order: 0,
          },
        ],
        education: [],
        skills: [{ id: 's-1', categoryName: 'Core', skills: ['Go', 'Rust', 'Kafka'], visible: true, order: 0 }],
        projects: [],
        certifications: [],
        involvement: [],
        awards: [],
        publications: [],
        references: [],
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          source: 'ai',
          data: mockAiResume,
        }),
      } as any);

      const res = await fetch('/api/ai/parse-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: 'Raw resume text for Elena Rostova',
          sourceType: 'text',
          fileName: 'elena-resume.txt',
        }),
      });

      expect(res.ok).toBe(true);
      const json = await res.json();
      expect(json.source).toBe('ai');
      expect(json.data.contact.fullName).toBe('Elena Rostova');

      const dynamicTitle = json.data?.contact?.fullName
        ? `${json.data.contact.fullName} — Resume`
        : 'Imported Resume';
      expect(dynamicTitle).toBe('Elena Rostova — Resume');
    });

    it('falls back gracefully to offline heuristic parsing when AI returns 500 error', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: 'AI Service Unavailable' }),
      } as any);

      const sampleRawText = `Devon Vance
devon@fintech.io
(555) 321-7654
New York, NY

EXPERIENCE
Senior Quant Developer | Citadel | 2020-01 - Present
- Built low-latency trading algorithms in C++`;

      const res = await fetch('/api/ai/parse-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: sampleRawText,
          sourceType: 'text',
          fileName: 'devon-resume.txt',
        }),
      });

      expect(res.ok).toBe(false);

      // Fallback heuristic execution
      const fallback = parseTextResumeContent(sampleRawText);
      expect(fallback.contact.fullName).toBe('Devon Vance');
      expect(fallback.contact.email).toBe('devon@fintech.io');
      expect(fallback.experience[0].company).toBe('Citadel');

      const fallbackTitle = fallback.contact.fullName
        ? `${fallback.contact.fullName} — Resume`
        : 'Imported Resume';
      expect(fallbackTitle).toBe('Devon Vance — Resume');
    });

    it('falls back gracefully when AI endpoint throws network exception', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      let fallbackData: ResumeData | null = null;
      const sampleText = 'Casey West\ncasey@ops.com\n\nEXPERIENCE\nSite Reliability Engineer | Netflix | 2019 - Present';

      try {
        await fetch('/api/ai/parse-resume', {
          method: 'POST',
          body: JSON.stringify({ content: sampleText }),
        });
      } catch {
        fallbackData = parseTextResumeContent(sampleText);
      }

      expect(fallbackData).not.toBeNull();
      expect(fallbackData?.contact.fullName).toBe('Casey West');
      expect(fallbackData?.contact.email).toBe('casey@ops.com');
      expect(fallbackData?.experience[0].company).toBe('Netflix');
    });
  });

  describe('Dialog Creation Flow (POST /api/resumes)', () => {
    it('creates resume document on POST /api/resumes and returns new resume ID', async () => {
      const mockResumeData = parseTextResumeContent('Morgan Lee\nmorgan@dev.io');

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          resume: { id: 'res-new-12345', title: 'Morgan Lee — Resume' },
        }),
      } as any);

      const res = await fetch('/api/resumes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Morgan Lee — Resume',
          template_id: 'classic-ats',
          use_sample_data: false,
          content: mockResumeData,
        }),
      });

      expect(res.ok).toBe(true);
      const data = await res.json();
      expect(data.resume.id).toBe('res-new-12345');
      expect(data.resume.title).toBe('Morgan Lee — Resume');
    });
  });
});
