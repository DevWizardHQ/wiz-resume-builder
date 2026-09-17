import { describe, it, expect } from 'vitest';
import { genId, emptyResumeData } from '@/lib/import/id';
import { INITIAL_RESUME_DATA, SectionKey } from '@/types/resume';
import { parseJsonResumeContent } from '@/lib/import/resume-parser';

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
