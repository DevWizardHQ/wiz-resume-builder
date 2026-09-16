import { describe, it, expect } from 'vitest';
import { generateResumePdfBuffer } from '@/lib/export/pdf-generator';
import { generateResumeDocxBuffer } from '@/lib/export/docx-generator';
import {
  DEFAULT_SECTION_ORDER,
  INITIAL_RESUME_DATA,
  ResumeData,
  SectionKey,
  TemplateId,
} from '@/types/resume';

const MOCK_RESUME_DATA: ResumeData = {
  contact: {
    fullName: 'Jane Doe',
    email: 'jane.doe@example.com',
    phone: '+1 (555) 123-4567',
    location: 'San Francisco, CA',
    linkedinUrl: 'https://linkedin.com/in/janedoe',
    githubUrl: 'https://github.com/janedoe',
    portfolioUrl: 'https://janedoe.dev',
  },
  summary: {
    text: 'Senior Software Engineer with 8+ years of experience in distributed systems and cloud architecture.',
    visible: true,
  },
  experience: [
    {
      id: 'exp-1',
      visible: true,
      order: 0,
      company: 'TechCorp Solutions',
      role: 'Staff Engineer',
      location: 'San Francisco, CA',
      startDate: '2021-06',
      endDate: '',
      current: true,
      bullets: [
        'Architected high-throughput event processing pipeline processing 50M events/day.',
        'Reduced p99 API latency by 45% using Redis caching and connection pooling.',
      ],
    },
    {
      id: 'exp-2',
      visible: false, // Hidden item - should NOT appear in output
      order: 1,
      company: 'Hidden Company Inc',
      role: 'Secret Agent',
      location: 'Nowhere',
      startDate: '2019-01',
      endDate: '2021-05',
      current: false,
      bullets: ['Confidential work that should not render.'],
    },
    {
      id: 'exp-3',
      visible: true,
      order: 2,
      company: 'DataFlow Inc',
      role: 'Senior Backend Developer',
      location: 'Austin, TX',
      startDate: '2017-08',
      endDate: '2021-05',
      current: false,
      bullets: ['Led migration from monolithic architecture to microservices.'],
    },
  ],
  projects: [
    {
      id: 'proj-1',
      visible: true,
      order: 0,
      name: 'OpenATS Engine',
      role: 'Lead Creator',
      link: 'https://github.com/janedoe/open-ats',
      startDate: '2023-01',
      endDate: '2023-06',
      technologies: ['TypeScript', 'Next.js', 'PostgreSQL'],
      bullets: ['Open-source resume scanning engine with over 2k GitHub stars.'],
    },
    {
      id: 'proj-2',
      visible: false, // Hidden project
      order: 1,
      name: 'Secret Project X',
      technologies: ['Python'],
      bullets: ['Top secret project.'],
    },
  ],
  education: [
    {
      id: 'edu-1',
      visible: true,
      order: 0,
      institution: 'University of California, Berkeley',
      degree: 'Bachelor of Science',
      fieldOfStudy: 'Computer Science',
      startDate: '2013',
      endDate: '2017',
      gpa: '3.92/4.0',
      honors: ['Summa Cum Laude', "Dean's Honor List"],
    },
    {
      id: 'edu-2',
      visible: false, // Hidden education
      order: 1,
      institution: 'Hidden University',
      degree: 'High School Diploma',
      fieldOfStudy: 'General',
      startDate: '2009',
      endDate: '2013',
    },
  ],
  skills: [
    {
      id: 'skill-1',
      visible: true,
      order: 0,
      categoryName: 'Languages',
      skills: ['TypeScript', 'JavaScript', 'Go', 'Python', 'SQL'],
    },
    {
      id: 'skill-2',
      visible: true,
      order: 1,
      categoryName: 'Frameworks & Tools',
      skills: ['React', 'Next.js', 'Node.js', 'PostgreSQL', 'Docker', 'Kubernetes'],
    },
    {
      id: 'skill-3',
      visible: false, // Hidden skills
      order: 2,
      categoryName: 'Hidden Skills',
      skills: ['Fortran', 'COBOL'],
    },
  ],
  certifications: [
    {
      id: 'cert-1',
      visible: true,
      order: 0,
      name: 'AWS Certified Solutions Architect – Professional',
      issuer: 'Amazon Web Services',
      issueDate: '2023-04',
      expirationDate: '2026-04',
      credentialUrl: 'https://aws.amazon.com/verify/cert123',
    },
    {
      id: 'cert-2',
      visible: false, // Hidden cert
      order: 1,
      name: 'Secret Certification',
      issuer: 'Secret Org',
      issueDate: '2020-01',
    },
  ],
  involvement: [
    {
      id: 'inv-1',
      visible: true,
      order: 0,
      organization: 'Women Who Code SF',
      role: 'Technical Mentor & Speaker',
      startDate: '2020-01',
      endDate: 'Present',
      bullets: ['Mentored 30+ aspiring software engineers across 4 cohorts.'],
    },
    {
      id: 'inv-2',
      visible: false, // Hidden involvement
      order: 1,
      organization: 'Hidden Club',
      role: 'Member',
      startDate: '2018',
      bullets: ['Hidden involvement.'],
    },
  ],
  awards: [
    {
      id: 'award-1',
      visible: true,
      order: 0,
      title: 'Innovation Excellence Award',
      issuer: 'TechCorp Solutions',
      date: '2022-12',
      description: 'Recognized for inventing low-latency caching architecture.',
    },
    {
      id: 'award-2',
      visible: false, // Hidden award
      order: 1,
      title: 'Hidden Award',
      issuer: 'Secret Group',
      date: '2019',
    },
  ],
  publications: [
    {
      id: 'pub-1',
      visible: true,
      order: 0,
      title: 'Optimizing Microservice Latency in Cloud Native Architectures',
      publisher: 'IEEE Software',
      date: '2023-03',
      url: 'https://doi.org/10.1109/software.2023',
      authors: ['Jane Doe', 'John Smith'],
    },
    {
      id: 'pub-2',
      visible: false, // Hidden publication
      order: 1,
      title: 'Classified Paper',
      publisher: 'Confidential',
      date: '2021',
      authors: ['Jane Doe'],
    },
  ],
  references: [
    {
      id: 'ref-1',
      visible: true,
      order: 0,
      name: 'Alex Johnson',
      company: 'TechCorp Solutions',
      relationship: 'VP of Engineering',
      contact: 'alex.j@techcorp.example.com',
    },
    {
      id: 'ref-2',
      visible: false, // Hidden reference
      order: 1,
      name: 'Hidden Reference',
      company: 'Secret Co',
      relationship: 'Manager',
      contact: 'secret@secret.com',
    },
  ],
};

describe('Vector PDF Generator (lib/export/pdf-generator)', () => {
  it('generates a valid, non-empty PDF buffer for classic-ats template', async () => {
    const buffer = await generateResumePdfBuffer(MOCK_RESUME_DATA, 'classic-ats');
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(1000);

    // Verify PDF header magic bytes "%PDF-"
    const pdfHeader = buffer.subarray(0, 5).toString('ascii');
    expect(pdfHeader).toBe('%PDF-');
  });

  it('generates valid PDF buffers across all supported template IDs', async () => {
    const templates: (TemplateId | string)[] = [
      'classic-ats',
      'modern-minimal',
      'executive',
      'modern-clean',
      'technical-split',
      'executive-accent',
    ];

    for (const tmpl of templates) {
      const buffer = await generateResumePdfBuffer(MOCK_RESUME_DATA, tmpl);
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(1000);
      expect(buffer.subarray(0, 5).toString('ascii')).toBe('%PDF-');
    }
  });

  it('handles empty / initial resume data gracefully', async () => {
    const buffer = await generateResumePdfBuffer(INITIAL_RESUME_DATA);
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(500);
    expect(buffer.subarray(0, 5).toString('ascii')).toBe('%PDF-');
  });

  it('respects custom section order in PDF generation', async () => {
    const customOrder: SectionKey[] = [
      'skills',
      'education',
      'experience',
      'contact',
    ];
    const buffer = await generateResumePdfBuffer(
      MOCK_RESUME_DATA,
      'classic-ats',
      customOrder
    );
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(1000);
    expect(buffer.subarray(0, 5).toString('ascii')).toBe('%PDF-');
  });

  it('handles hidden summary (visible: false) in PDF generation', async () => {
    const hiddenSummaryData: ResumeData = {
      ...MOCK_RESUME_DATA,
      summary: {
        text: 'This summary should not be included',
        visible: false,
      },
    };
    const buffer = await generateResumePdfBuffer(hiddenSummaryData, 'classic-ats');
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(1000);
  });
});

describe('Native DOCX Generator (lib/export/docx-generator)', () => {
  it('generates a valid, non-empty DOCX buffer', async () => {
    const buffer = await generateResumeDocxBuffer(MOCK_RESUME_DATA);
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(1000);

    // Verify DOCX / ZIP magic bytes "PK\x03\x04"
    expect(buffer[0]).toBe(0x50); // 'P'
    expect(buffer[1]).toBe(0x4b); // 'K'
  });

  it('handles empty / initial resume data gracefully in DOCX', async () => {
    const buffer = await generateResumeDocxBuffer(INITIAL_RESUME_DATA);
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(500);
    expect(buffer[0]).toBe(0x50);
    expect(buffer[1]).toBe(0x4b);
  });

  it('respects custom section order in DOCX generation', async () => {
    const customOrder: SectionKey[] = [
      'certifications',
      'skills',
      'experience',
      'education',
      'contact',
    ];
    const buffer = await generateResumeDocxBuffer(MOCK_RESUME_DATA, customOrder);
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(1000);
    expect(buffer[0]).toBe(0x50);
    expect(buffer[1]).toBe(0x4b);
  });

  it('handles hidden summary (visible: false) in DOCX generation', async () => {
    const hiddenSummaryData: ResumeData = {
      ...MOCK_RESUME_DATA,
      summary: {
        text: 'Secret summary text',
        visible: false,
      },
    };
    const buffer = await generateResumeDocxBuffer(hiddenSummaryData);
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(1000);
    expect(buffer[0]).toBe(0x50);
    expect(buffer[1]).toBe(0x4b);
  });
});

describe('Export Parity & Data Edge Cases', () => {
  it('handles resume with items having missing optional fields without throwing', async () => {
    const minimalData: ResumeData = {
      contact: {
        fullName: 'Alex Test',
        email: 'alex@example.com',
        phone: '',
        location: '',
      },
      summary: {
        text: '',
        visible: true,
      },
      experience: [
        {
          id: 'min-exp',
          visible: true,
          order: 0,
          company: 'Minimal Co',
          role: 'Junior Dev',
          startDate: '2022',
          current: false,
          bullets: [],
        },
      ],
      projects: [
        {
          id: 'min-proj',
          visible: true,
          order: 0,
          name: 'Minimal Proj',
          technologies: [],
          bullets: [],
        },
      ],
      education: [
        {
          id: 'min-edu',
          visible: true,
          order: 0,
          institution: 'State College',
          degree: 'Associate',
          fieldOfStudy: '',
          startDate: '2020',
          endDate: '2022',
        },
      ],
      skills: [
        {
          id: 'min-skill',
          visible: true,
          order: 0,
          categoryName: 'Tech',
          skills: ['Git'],
        },
      ],
      certifications: [
        {
          id: 'min-cert',
          visible: true,
          order: 0,
          name: 'Cert 1',
          issuer: '',
          issueDate: '2023',
        },
      ],
      involvement: [
        {
          id: 'min-inv',
          visible: true,
          order: 0,
          organization: 'Community Org',
          role: 'Volunteer',
          startDate: '2021',
          bullets: [],
        },
      ],
      awards: [
        {
          id: 'min-award',
          visible: true,
          order: 0,
          title: 'Award 1',
          issuer: '',
          date: '2022',
        },
      ],
      publications: [
        {
          id: 'min-pub',
          visible: true,
          order: 0,
          title: 'Paper 1',
          publisher: '',
          date: '2023',
          authors: [],
        },
      ],
      references: [
        {
          id: 'min-ref',
          visible: true,
          order: 0,
          name: 'Ref Person',
          company: 'Ref Co',
          relationship: 'Peer',
          contact: '',
        },
      ],
    };

    const pdfBuffer = await generateResumePdfBuffer(minimalData, 'classic-ats');
    const docxBuffer = await generateResumeDocxBuffer(minimalData);

    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(500);
    expect(docxBuffer).toBeInstanceOf(Buffer);
    expect(docxBuffer.length).toBeGreaterThan(500);
  });
});
