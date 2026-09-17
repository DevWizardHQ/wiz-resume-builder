import { describe, it, expect } from 'vitest';
import { genId, emptyResumeData } from '@/lib/import/id';
import { INITIAL_RESUME_DATA, SectionKey } from '@/types/resume';
import {
  parseJsonResumeContent,
  parseTextResumeContent,
  parseImportedFile,
  extractContactInfo,
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
});
