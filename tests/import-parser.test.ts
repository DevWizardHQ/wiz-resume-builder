import { describe, it, expect, vi } from 'vitest';
import {
  extractTextFromFile,
  extractDocxText,
  extractPdfText,
  sanitizeAtsText,
  parseImportedFile,
  parseEducationSection,
} from '@/lib/import/resume-parser';

vi.mock('mammoth', () => ({
  default: {
    extractRawText: vi.fn().mockResolvedValue({ value: 'Extracted DOCX text from mock' }),
  },
  extractRawText: vi.fn().mockResolvedValue({ value: 'Extracted DOCX text from mock' }),
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
            { str: 'Alex Doe', transform: [0, 0, 0, 0, 50, 700] },
            { str: 'alex@example.com', transform: [0, 0, 0, 0, 150, 700] },
            { str: 'Software Engineer', transform: [0, 0, 0, 0, 50, 680] },
          ],
        }),
      }),
    }),
  }),
}));

describe('Stage 1 - Document Text Extraction', () => {
  it('extracts plain text and markdown files properly', async () => {
    const txtBlob = new Blob(
      ['Alex Doe\nalex@example.com\nSoftware Engineer\n\nEXPERIENCE\nSenior Dev | Acme | 2020 - Present\n- Built scalable APIs'],
      { type: 'text/plain' }
    );
    const file = new File([txtBlob], 'resume.txt', { type: 'text/plain' });
    const result = await extractTextFromFile(file);

    expect(result.sourceType).toBe('text');
    expect(result.text).toContain('Alex Doe');
    expect(result.text).toContain('alex@example.com');
    expect(result.fileName).toBe('resume.txt');
  });

  it('extracts markdown files with text sourceType', async () => {
    const mdBlob = new Blob(
      ['# Jane Developer\n**Email**: jane@code.dev\n\n## Skills\n- TypeScript\n- React'],
      { type: 'text/markdown' }
    );
    const file = new File([mdBlob], 'resume.md', { type: 'text/markdown' });
    const result = await extractTextFromFile(file);

    expect(result.sourceType).toBe('text');
    expect(result.text).toContain('Jane Developer');
    expect(result.fileName).toBe('resume.md');
  });

  it('identifies json files and preserves JSON string payload', async () => {
    const jsonContent = JSON.stringify({
      basics: {
        name: 'Jordan Smith',
        email: 'jordan@example.com',
        summary: 'Passionate full stack engineer',
      },
      work: [
        {
          company: 'TechCorp',
          position: 'Lead Architect',
          startDate: '2021-01',
          endDate: 'Present',
        },
      ],
    });
    const file = new File([jsonContent], 'resume.json', {
      type: 'application/json',
    });
    const result = await extractTextFromFile(file);

    expect(result.sourceType).toBe('json');
    expect(result.text).toContain('Jordan Smith');
    expect(result.text).toContain('TechCorp');
    expect(result.fileName).toBe('resume.json');
  });

  it('identifies docx files and invokes extraction helper', async () => {
    const dummyBuffer = new ArrayBuffer(8);
    const file = new File([dummyBuffer], 'resume.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

    const result = await extractTextFromFile(file);
    expect(result.sourceType).toBe('docx');
    expect(result.fileName).toBe('resume.docx');
    expect(result.text).toContain('Extracted DOCX text');
  });

  it('identifies pdf files and invokes pdfjs extraction helper', async () => {
    const dummyBuffer = new ArrayBuffer(8);
    const file = new File([dummyBuffer], 'resume.pdf', {
      type: 'application/pdf',
    });

    const result = await extractTextFromFile(file);
    expect(result.sourceType).toBe('pdf');
    expect(result.fileName).toBe('resume.pdf');
    expect(result.text).toContain('Alex Doe');
    expect(result.text).toContain('alex@example.com');
  });

  it('throws descriptive error on unsupported file types', async () => {
    const file = new File(['malicious binary'], 'payload.exe', {
      type: 'application/x-msdownload',
    });

    await expect(extractTextFromFile(file)).rejects.toThrow(
      /Unsupported file type/i
    );
  });

  it('sanitizes ATS text by stripping leading first-person pronouns and trimming whitespace', () => {
    expect(sanitizeAtsText('  I developed scalable distributed systems. ')).toBe(
      'developed scalable distributed systems.'
    );
    expect(sanitizeAtsText('My team delivered the cloud platform.')).toBe(
      'team delivered the cloud platform.'
    );
    expect(sanitizeAtsText('We architected high-throughput pipelines.')).toBe(
      'architected high-throughput pipelines.'
    );
    expect(sanitizeAtsText('Engineered reliable microservices with 99.99% uptime.')).toBe(
      'Engineered reliable microservices with 99.99% uptime.'
    );
  });

  it('parses imported file into structured resume data via parseImportedFile', async () => {
    const txtContent = `Taylor Swift
taylor@music.com | Nashville, TN

EXPERIENCE
Lead Artist | Big Machine Records | 2006-01 - 2018-12
- Produced multi-platinum albums
- Managed international stadium tours

EDUCATION
High School Diploma, Hendersonville High School, 2008

SKILLS
Songwriting, Production, Vocals`;

    const file = new File([txtContent], 'taylor_resume.txt', {
      type: 'text/plain',
    });
    const result = await parseImportedFile(file);

    expect(result.sourceType).toBe('text');
    expect(result.data.contact.fullName).toBe('Taylor Swift');
    expect(result.data.contact.email).toBe('taylor@music.com');
    expect(result.data.experience.length).toBeGreaterThan(0);
    expect(result.data.experience[0].company).toBe('Big Machine Records');
  });
});

describe('Stage 2 - Advanced Education Heuristic Parsing', () => {
  it('parses multiple single-newline separated education entries', () => {
    const text = `B.S. in Computer Science, Stanford University, 2016-09 - 2020-06
M.S. in Artificial Intelligence, MIT, 2020-09 - 2022-06`;
    const items = parseEducationSection(text);
    expect(items).toHaveLength(2);
    expect(items[0].institution).toBe('Stanford University');
    expect(items[0].degree).toBe('B.S.');
    expect(items[0].fieldOfStudy).toBe('Computer Science');
    expect(items[0].startDate).toBe('2016-09');
    expect(items[0].endDate).toBe('2020-06');
    expect(items[1].institution).toBe('MIT');
    expect(items[1].degree).toBe('M.S.');
    expect(items[1].fieldOfStudy).toBe('Artificial Intelligence');
  });

  it('parses institution-first multi-line education blocks', () => {
    const text = `University of Oxford
Master of Science in Mathematics
2018 - 2020
GPA: 3.95/4.0
Dean's List, Distinction in Mathematics`;
    const items = parseEducationSection(text);
    expect(items).toHaveLength(1);
    expect(items[0].institution).toBe('University of Oxford');
    expect(items[0].degree).toBe('Master of Science');
    expect(items[0].fieldOfStudy).toBe('Mathematics');
    expect(items[0].startDate).toBe('2018');
    expect(items[0].endDate).toBe('2020');
    expect(items[0].gpa).toBe('3.95/4.0');
    expect(items[0].honors).toEqual(expect.arrayContaining(["Dean's List", 'Distinction in Mathematics']));
  });

  it('parses international and vocational degree types', () => {
    const text = `B.Tech in Information Technology
National Institute of Technology
2014 - 2018 | CGPA: 3.82`;
    const items = parseEducationSection(text);
    expect(items).toHaveLength(1);
    expect(items[0].degree).toBe('B.Tech');
    expect(items[0].fieldOfStudy).toBe('Information Technology');
    expect(items[0].institution).toBe('National Institute of Technology');
    expect(items[0].gpa).toBe('3.82');
  });
});

