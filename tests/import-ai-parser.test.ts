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

  it('maps full 11-section AI payload without dropping nested attributes', () => {
    const fallback = parsePlainTextResume(RAW_TEXT);
    const fullJson = JSON.stringify({
      basics: {
        name: 'Alice Developer',
        label: 'Staff Software Engineer',
        email: 'alice@example.com',
        phone: '+1-555-0199',
        url: 'https://alicedev.io',
        summary: 'Experienced cloud architect and distributed systems engineer.',
        location: {
          address: '100 Main St',
          city: 'San Francisco',
          region: 'CA',
          postalCode: '94105',
          countryCode: 'US',
        },
        profiles: [
          { network: 'LinkedIn', url: 'https://linkedin.com/in/alicedev' },
          { network: 'GitHub', url: 'https://github.com/alicedev' },
        ],
      },
      work: [
        {
          company: 'Tech Giant Inc',
          position: 'Lead Architect',
          location: 'San Francisco, CA',
          startDate: '2020-01',
          endDate: 'Present',
          highlights: [
            'Architected event-driven microservices processing 50M events daily',
            'Reduced p99 latency by 45%',
          ],
        },
      ],
      education: [
        {
          institution: 'Stanford University',
          studyType: 'M.S.',
          area: 'Computer Science',
          startDate: '2016-09',
          endDate: '2018-06',
          gpa: '3.95',
          honors: ['Dean\'s List', 'Distinction in CS'],
        },
      ],
      skills: [
        {
          name: 'Cloud & DevOps',
          keywords: ['AWS', 'Kubernetes', 'Terraform', 'Docker'],
        },
      ],
      projects: [
        {
          name: 'CloudScale CLI',
          role: 'Maintainer',
          description: 'Open-source infrastructure deployment tool',
          technologies: ['TypeScript', 'Go', 'Rust'],
          highlights: ['Over 10k GitHub stars', 'Used by 500+ engineering teams'],
          startDate: '2021-03',
          endDate: '2023-12',
          url: 'https://github.com/example/cloudscale',
        },
      ],
      certificates: [
        {
          name: 'AWS Certified Solutions Architect - Professional',
          issuer: 'Amazon Web Services',
          date: '2022-05',
          url: 'https://aws.amazon.com/verify/12345',
        },
      ],
      volunteer: [
        {
          organization: 'Code for Good',
          position: 'Technical Mentor',
          startDate: '2019-01',
          endDate: '2021-01',
          highlights: ['Mentored 30+ underrepresented junior developers'],
        },
      ],
      awards: [
        {
          title: 'Innovator of the Year',
          awarder: 'Tech Industry Forum',
          date: '2023-11',
          summary: 'Recognized for pioneering contributions to cloud cost optimization',
        },
      ],
      publications: [
        {
          name: 'Scaling Reactive Microservices at Scale',
          publisher: 'ACM Queue',
          releaseDate: '2022-08',
          url: 'https://acm.org/papers/scaling-reactive',
          authors: ['Alice Developer', 'Bob Colleague'],
        },
      ],
      references: [
        {
          name: 'Dr. Sarah Connor',
          company: 'Tech Giant Inc',
          contact: 'sarah.connor@example.com',
          relationship: 'VP of Engineering / Former Manager',
        },
      ],
    });

    const result = extractStructuredResume(fullJson, fallback);

    // 1. Basics & contact
    expect(result.contact.fullName).toBe('Alice Developer');
    expect(result.contact.email).toBe('alice@example.com');
    expect(result.contact.phone).toBe('+1-555-0199');
    expect(result.contact.location).toContain('San Francisco');
    expect(result.contact.linkedinUrl).toBe('https://linkedin.com/in/alicedev');
    expect(result.contact.githubUrl).toBe('https://github.com/alicedev');
    expect(result.contact.portfolioUrl).toBe('https://alicedev.io');
    expect(result.summary).toBe('Experienced cloud architect and distributed systems engineer.');

    // 2. Work / Experience
    expect(result.experience).toHaveLength(1);
    expect(result.experience[0].company).toBe('Tech Giant Inc');
    expect(result.experience[0].role).toBe('Lead Architect');
    expect(result.experience[0].location).toBe('San Francisco, CA');
    expect(result.experience[0].current).toBe(true);
    expect(result.experience[0].bullets).toHaveLength(2);

    // 3. Education
    expect(result.education).toHaveLength(1);
    expect(result.education[0].institution).toBe('Stanford University');
    expect(result.education[0].degree).toBe('M.S.');
    expect(result.education[0].fieldOfStudy).toBe('Computer Science');
    expect(result.education[0].gpa).toBe('3.95');
    expect(result.education[0].honors).toEqual(["Dean's List", 'Distinction in CS']);

    // 4. Skills
    expect(result.skills).toHaveLength(1);
    expect(result.skills[0].categoryName).toBe('Cloud & DevOps');
    expect(result.skills[0].skills).toEqual(['AWS', 'Kubernetes', 'Terraform', 'Docker']);

    // 5. Projects
    expect(result.projects).toHaveLength(1);
    expect(result.projects[0].name).toBe('CloudScale CLI');
    expect(result.projects[0].role).toBe('Maintainer');
    expect(result.projects[0].link).toBe('https://github.com/example/cloudscale');
    expect(result.projects[0].technologies).toEqual(['TypeScript', 'Go', 'Rust']);
    expect(result.projects[0].bullets).toContain('Over 10k GitHub stars');

    // 6. Certifications
    expect(result.certifications).toHaveLength(1);
    expect(result.certifications[0].name).toBe('AWS Certified Solutions Architect - Professional');
    expect(result.certifications[0].issuer).toBe('Amazon Web Services');
    expect(result.certifications[0].credentialUrl).toBe('https://aws.amazon.com/verify/12345');

    // 7. Involvement
    expect(result.involvement).toHaveLength(1);
    expect(result.involvement[0].organization).toBe('Code for Good');
    expect(result.involvement[0].role).toBe('Technical Mentor');
    expect(result.involvement[0].bullets[0]).toContain('Mentored 30+');

    // 8. Awards
    expect(result.awards).toHaveLength(1);
    expect(result.awards[0].title).toBe('Innovator of the Year');
    expect(result.awards[0].issuer).toBe('Tech Industry Forum');
    expect(result.awards[0].description).toContain('Recognized for pioneering');

    // 9. Publications
    expect(result.publications).toHaveLength(1);
    expect(result.publications[0].title).toBe('Scaling Reactive Microservices at Scale');
    expect(result.publications[0].publisher).toBe('ACM Queue');
    expect(result.publications[0].url).toBe('https://acm.org/papers/scaling-reactive');
    expect(result.publications[0].authors).toEqual(['Alice Developer', 'Bob Colleague']);

    // 10. References
    expect(result.references).toHaveLength(1);
    expect(result.references[0].name).toBe('Dr. Sarah Connor');
    expect(result.references[0].company).toBe('Tech Giant Inc');
    expect(result.references[0].contact).toBe('sarah.connor@example.com');
    expect(result.references[0].relationship).toBe('VP of Engineering / Former Manager');
  });

  it('handles markdown fences and conversational wrapper text around JSON', () => {
    const fallback = parsePlainTextResume(RAW_TEXT);
    const wrappedJson = `Here is the parsed resume in JSON format:
\`\`\`json
{
  "basics": {
    "name": "Fence Tester",
    "email": "fence@test.com"
  },
  "work": [
    {
      "company": "Fenced Corp",
      "position": "Software Engineer"
    }
  ]
}
\`\`\`
Hope this helps!`;

    const result = extractStructuredResume(wrappedJson, fallback);
    expect(result.contact.fullName).toBe('Fence Tester');
    expect(result.contact.email).toBe('fence@test.com');
    expect(result.experience[0].company).toBe('Fenced Corp');
  });

  it('preserves fallback items for empty or omitted sections in partial AI output', () => {
    const fallback = parsePlainTextResume(RAW_TEXT);
    // Add fallback data for other sections to verify non-destructive behavior
    fallback.awards = [
      {
        id: 'fallback-award',
        visible: true,
        order: 0,
        title: 'Heuristic Award',
        issuer: 'Heuristic Org',
        date: '2020-01',
      },
    ];
    fallback.certifications = [
      {
        id: 'fallback-cert',
        visible: true,
        order: 0,
        name: 'Heuristic Cert',
        issuer: 'Heuristic Issuer',
        issueDate: '2019-01',
      },
    ];

    const partialAiJson = JSON.stringify({
      basics: {
        name: 'Partial AI User',
      },
      work: [], // Empty array in AI output should retain fallback
    });

    const result = extractStructuredResume(partialAiJson, fallback);
    expect(result.contact.fullName).toBe('Partial AI User');
    // Contact fields omitted by AI retain fallback
    expect(result.contact.email).toBe('jane.doe@example.com');
    // Empty work array retains heuristic fallback experience
    expect(result.experience).toHaveLength(1);
    expect(result.experience[0].company).toBe('Acme Corp');
    // Sections omitted by AI retain fallback
    expect(result.education).toHaveLength(1);
    expect(result.awards).toHaveLength(1);
    expect(result.awards[0].title).toBe('Heuristic Award');
    expect(result.certifications).toHaveLength(1);
    expect(result.certifications[0].name).toBe('Heuristic Cert');
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

