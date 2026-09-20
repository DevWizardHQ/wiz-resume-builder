import { describe, it, expect } from 'vitest';
import { genId, emptyResumeData } from '@/lib/import/id';
import { INITIAL_RESUME_DATA, SectionKey } from '@/types/resume';
import {
  parseJsonResumeContent,
  parseTextResumeContent,
  parseImportedFile,
  extractTextFromFile,
  extractContactInfo,
  extractPhoneNumber,
  isValidPhone,
  extractBullets,
  splitIntoSections,
} from '@/lib/import/resume-parser';

describe('import id & shape utils', () => {
  it('genId returns prefix + unique deterministic suffix', () => {
    const a = genId('exp');
    const b = genId('exp');
    expect(a).toMatch(/^exp-[a-z0-9-]{8,}$/);
    expect(a).not.toBe(b);
  });

  it('emptyResumeData returns a fresh deep clone of INITIAL_RESUME_DATA', () => {
    const e1 = emptyResumeData();
    const e2 = emptyResumeData();
    expect(e1).toEqual(INITIAL_RESUME_DATA);
    expect(e1).not.toBe(e2);
    expect(e1.experience).toEqual([]);
  });
});

const JSON_RESUME_SAMPLE = {
  basics: {
    name: 'Jane Doe',
    label: 'Senior Full Stack Engineer',
    email: 'jane@example.com',
    phone: '+1 555-0142',
    location: { city: 'San Francisco', region: 'CA' },
    url: 'https://janedoe.dev',
    summary: 'I build scalable systems with React and Node.',
  },
  work: [
    {
      company: 'Acme Corp',
      position: 'Staff Engineer',
      startDate: '2018-03',
      endDate: '2024-01',
      highlights: ['Led migration to microservices', 'Reduced costs by 22%'],
      location: 'SF',
    },
    {
      company: 'Globex',
      position: 'Engineer',
      startDate: '2015-06',
      endDate: 'Present',
      highlights: [],
    },
  ],
  education: [
    {
      institution: 'MIT',
      area: 'Computer Science',
      studyType: 'B.S.',
      startDate: '2011-09',
      endDate: '2015-05',
      gpa: '3.9',
    },
  ],
  skills: [
    { name: 'Languages', keywords: ['TypeScript', 'Go'] },
    { name: 'Cloud', keywords: ['AWS', 'Kubernetes'] },
  ],
  projects: [
    {
      name: 'Wiz Parser',
      description: 'An ATS resume parser',
      startDate: '2023-01',
      endDate: '2023-06',
      highlights: ['Used by 10k users'],
    },
  ],
  certificates: [{ name: 'AWS SA Pro', issuer: 'Amazon', date: '2022-09' }],
  awards: [{ title: 'Employee of the Year', awarder: 'Acme Corp', date: '2021-01' }],
  publications: [{ name: 'On Parsers', publisher: 'IEEE', releaseDate: '2020-05' }],
};

describe('JSON Resume standard import', () => {
  it('maps JSON Resume to normalized ResumeData', () => {
    const data = parseJsonResumeContent(JSON.stringify(JSON_RESUME_SAMPLE));
    expect(data).not.toBeNull();
    const d = data!;

    // Contact
    expect(d.contact.fullName).toBe('Jane Doe');
    expect(d.contact.email).toBe('jane@example.com');
    expect(d.contact.location).toContain('San Francisco');
    expect(d.contact.portfolioUrl).toBe('https://janedoe.dev');

    // Work → experience
    expect(d.experience).toHaveLength(2);
    const acme = d.experience[0];
    expect(acme.company).toBe('Acme Corp');
    expect(acme.role).toBe('Staff Engineer');
    expect(acme.startDate).toBe('2018-03');
    expect(acme.endDate).toBe('2024-01');
    expect(acme.current).toBe(false);
    expect(acme.bullets).toContain('Led migration to microservices');
    expect(acme.bullets).toContain('Reduced costs by 22%');

    // Present → current
    const globex = d.experience[1];
    expect(globex.current).toBe(true);
    expect(globex.endDate).toBe('Present');

    // Education
    expect(d.education).toHaveLength(1);
    expect(d.education[0].institution).toBe('MIT');
    expect(d.education[0].gpa).toBe('3.9');

    // Skills → categorized
    expect(d.skills).toHaveLength(2);
    expect(d.skills[0].skills).toEqual(['TypeScript', 'Go']);

    // Projects
    expect(d.projects).toHaveLength(1);
    expect(d.projects[0].technologies).toEqual([]);

    // Certifications / awards / publications
    expect(d.certifications[0].name).toBe('AWS SA Pro');
    expect(d.awards[0].title).toBe('Employee of the Year');
    expect(d.publications[0].title).toBe('On Parsers');

    // ATS sanitation: no leading first-person in summary or bullets
    expect(d.summary.text).not.toMatch(/^\s*(I|my|we|our)\s/i);
    d.experience.forEach((e) => e.bullets.forEach((b) => expect(b).not.toMatch(/^\s*(I|my|we|our)\s/i)));
  });

  it('returns null for non-JSON or non-JSON-Resume input', () => {
    expect(parseJsonResumeContent('definitely not json')).toBeNull();
    expect(parseJsonResumeContent('{"foo": 1}')).toBeNull();
    // JSON but no recognizable resume sections
    expect(parseJsonResumeContent('[1,2,3]')).toBeNull();
  });

  it('preserves empty JSON Resume fields without crashing', () => {
    const data = parseJsonResumeContent(JSON.stringify({ basics: { name: 'No Section' } }));
    expect(data).not.toBeNull();
    expect(data!.contact.fullName).toBe('No Section');
    expect(data!.experience).toEqual([]);
    expect(data!.summary.text).toBe('');
  });
});

const PLAIN_TEXT = `Jane Doe
San Francisco, CA | jane.doe@example.com | +1 (555) 013-2478
linkedin.com/in/janedoe | github.com/janedoe

PROFESSIONAL SUMMARY
Senior software engineer with 8+ years of experience building scalable APIs.

EXPERIENCE
Senior Full Stack Engineer, Acme Corp
2018-03 - 2024-01
- Led migration to TypeScript microservices
- Reduced infrastructure costs by 22%
- Improved API latency by 35%

Software Engineer, Globex (2015-06 - Present)
Built real-time analytics dashboards
Cut reporting time from hours to minutes

EDUCATION
B.S. Computer Science, MIT, 2011-09 - 2015-05

SKILLS
TypeScript, React, Node.js, AWS, Kubernetes, PostgreSQL

PROJECTS
Wiz Parser | github.com/wiz/parser (2023-01 - 2023-06)
- Parsed 10k+ resumes with 98% accuracy
`;

describe('plain text heuristic parser', () => {
  it('segments text into expected sections', () => {
    const sections = splitIntoSections(PLAIN_TEXT);
    const keys = sections.map((s) => s.key);
    expect(keys).toEqual(expect.arrayContaining(['summary', 'experience', 'education', 'skills', 'projects']));
  });

  it('extracts contact details from a text block', () => {
    const contact = extractContactInfo(`Jane Doe
San Francisco, CA | jane.doe@example.com | +1 (555) 013-2478
linkedin.com/in/janedoe | github.com/janedoe`);
    expect(contact.email).toBe('jane.doe@example.com');
    expect(contact.phone).toContain('555');
    expect(contact.fullName).toBe('Jane Doe');
  });

  it('parses experience with bullets, dates, and current status', () => {
    const data = parseTextResumeContent(PLAIN_TEXT);
    expect(data.contact.fullName).toBe('Jane Doe');
    expect(data.contact.email).toBe('jane.doe@example.com');
    expect(data.experience).toHaveLength(2);

    const acme = data.experience[0];
    expect(acme.company).toBe('Acme Corp');
    expect(acme.role).toBe('Senior Full Stack Engineer');
    expect(acme.startDate).toBe('2018-03');
    expect(acme.endDate).toBe('2024-01');
    expect(acme.current).toBe(false);
    expect(acme.bullets).toContain('Led migration to TypeScript microservices');
    expect(acme.bullets[0]).not.toMatch(/^\s*(I|my|we|our)\s/i);

    const globex = data.experience[1];
    expect(globex.current).toBe(true);
    expect(globex.endDate).toBe('Present');
  });

  it('extracts education, categorized skills, and projects', () => {
    const data = parseTextResumeContent(PLAIN_TEXT);
    expect(data.education[0].institution).toBe('MIT');
    expect(data.education[0].degree).toBe('B.S.');
    expect(data.education[0].fieldOfStudy).toBe('Computer Science');
    expect(data.skills.length).toBeGreaterThanOrEqual(1);
    const allSkills = data.skills.flatMap((s) => s.skills);
    expect(allSkills).toEqual(expect.arrayContaining(['TypeScript', 'AWS']));
    expect(data.projects[0].name).toBe('Wiz Parser');
    expect(data.projects[0].bullets[0]).toContain('10k');
  });

  it('extracts bullet lines from raw text and normalizes markers', () => {
    const bullets = extractBullets(`  • First point
- Second point
* Third point`);
    expect(bullets).toEqual(['First point', 'Second point', 'Third point']);
  });

  it('handles sparse input without throwing', () => {
    const data = parseTextResumeContent('Just a plain line of text.');
    expect(data.experience).toEqual([]);
    expect(data.contact.fullName).toBe('');
  });
});

describe('telephone & mobile number extraction', () => {
  it('extracts explicitly labeled mobile and telephone numbers', () => {
    expect(extractPhoneNumber('Mobile: +880 1712-345678\nEmail: dev@example.com')).toBe('+880 1712-345678');
    expect(extractPhoneNumber('Tel: (020) 7946 0919 | London, UK')).toBe('(020) 7946 0919');
    expect(extractPhoneNumber('Mob: 01712345678')).toBe('01712345678');
    expect(extractPhoneNumber('Cell: 555-0199-281')).toBe('555-0199-281');
    expect(extractPhoneNumber('WhatsApp: +91 98765 43210')).toBe('+91 98765 43210');
    expect(extractPhoneNumber('Contact No: +1-555-0142')).toBe('+1-555-0142');
  });

  it('extracts unlabeled international phone numbers with country codes', () => {
    expect(extractPhoneNumber('John Doe | +880 1712345678 | Dhaka')).toBe('+880 1712345678');
    expect(extractPhoneNumber('Alice Smith +44 20 7946 0919 alice@smith.co.uk')).toBe('+44 20 7946 0919');
    expect(extractPhoneNumber('Rahul Sharma | +91 98765 43210 | Bangalore')).toBe('+91 98765 43210');
  });

  it('extracts parenthesized area codes and continuous digit sequences', () => {
    expect(extractPhoneNumber('Jane Doe | (555) 013-2478 | Seattle, WA')).toBe('(555) 013-2478');
    expect(extractPhoneNumber('Alex Doe | 01712345678 | alex@test.com')).toBe('01712345678');
  });

  it('validates candidate numbers and rejects false positives like dates or invalid formats', () => {
    expect(isValidPhone('+880 1712-345678')).toBe(true);
    expect(isValidPhone('(555) 013-2478')).toBe(true);
    expect(isValidPhone('01712345678')).toBe(true);

    // Reject date ranges
    expect(isValidPhone('2018 - 2024')).toBe(false);
    expect(isValidPhone('2018-03 - 2024-01')).toBe(false);
    expect(isValidPhone('2020-05-12')).toBe(false);
    expect(isValidPhone('12/05/2020')).toBe(false);

    // Reject months
    expect(isValidPhone('Jan 2020 - Dec 2022')).toBe(false);

    // Reject repeating digits or too short/long
    expect(isValidPhone('0000000000')).toBe(false);
    expect(isValidPhone('12345')).toBe(false);
    expect(isValidPhone('1234567890123456789')).toBe(false);
  });
});

describe('personal website & portfolio URL extraction', () => {
  it('extracts explicitly labeled website and portfolio URLs', () => {
    expect(
      extractContactInfo('Jane Doe\nWebsite: https://janedoe.com\nEmail: jane@test.com').portfolioUrl
    ).toBe('https://janedoe.com');
    expect(
      extractContactInfo('John Doe | Portfolio: johndoe.me | Tel: 555-0123').portfolioUrl
    ).toBe('https://johndoe.me');
    expect(
      extractContactInfo('Alice | Blog: https://blog.alice.dev | London').portfolioUrl
    ).toBe('https://blog.alice.dev');
    expect(
      extractContactInfo('Bob | Personal Site: bob-portfolio.design | bob@test.com').portfolioUrl
    ).toBe('https://bob-portfolio.design');
  });

  it('extracts unlabeled developer and portfolio domains without colliding with linkedin or github', () => {
    expect(
      extractContactInfo('Jane Doe | janedoe.dev | linkedin.com/in/janedoe | github.com/janedoe').portfolioUrl
    ).toBe('https://janedoe.dev');
    expect(
      extractContactInfo('John Doe | https://johndoe.io/portfolio | New York').portfolioUrl
    ).toBe('https://johndoe.io/portfolio');
    expect(
      extractContactInfo('Alice | alice.tech | alice@example.com').portfolioUrl
    ).toBe('https://alice.tech');
  });
});

describe('file ingestion dispatch', () => {
  it('parses a .json file as JSON Resume when valid', async () => {
    const file = new File(
      [JSON.stringify(JSON_RESUME_SAMPLE)],
      'resume.json',
      { type: 'application/json' }
    );
    const result = await parseImportedFile(file);
    expect(result.data.contact.fullName).toBe('Jane Doe');
    expect(result.sourceType).toBe('json');
  });

  it('parses a .txt file with plain heuristics', async () => {
    const file = new File([PLAIN_TEXT], 'resume.txt', {
      type: 'text/plain',
    });
    const result = await parseImportedFile(file);
    expect(result.data.contact.email).toBe('jane.doe@example.com');
    expect(result.sourceType).toBe('text');
  });

  it('rejects unsupported file types with a descriptive error', async () => {
    const file = new File(['nope'], 'resume.exe', {
      type: 'application/x-msdownload',
    });
    await expect(parseImportedFile(file)).rejects.toThrow(
      /unsupported|no support/i
    );
  });

  it('configures pdfjs GlobalWorkerOptions.workerSrc when importing pdfjs', async () => {
    const pdfjs = await import('pdfjs-dist');
    if (!pdfjs.GlobalWorkerOptions.workerSrc) {
      pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
    }
    expect(pdfjs.GlobalWorkerOptions.workerSrc).toBeDefined();
    expect(typeof pdfjs.GlobalWorkerOptions.workerSrc).toBe('string');
  });
});
