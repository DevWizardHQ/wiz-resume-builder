import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  TemplateRenderer,
  ClassicAts,
  ModernMinimal,
  Executive,
  filterVisibleItems,
  formatDateRange,
  formatHref,
  formatDisplayUrl,
} from '@/components/templates/TemplateRenderer';
import { ResumeData, SectionKey } from '@/types/resume';

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
      visible: false, // Hidden item
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
      visible: false,
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
      visible: false,
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
      visible: false,
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
      visible: false,
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
      visible: false,
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
      visible: false,
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
      visible: false,
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
      visible: false,
      order: 1,
      name: 'Hidden Reference',
      company: 'Secret Co',
      relationship: 'Manager',
      contact: 'secret@secret.com',
    },
  ],
};

describe('Template Helpers Unit Tests', () => {
  describe('filterVisibleItems', () => {
    it('filters out items where visible === false and preserves order', () => {
      const items = [
        { id: '1', visible: true, order: 2, name: 'B' },
        { id: '2', visible: false, order: 1, name: 'A' },
        { id: '3', visible: true, order: 0, name: 'C' },
      ];
      const result = filterVisibleItems(items);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('3');
      expect(result[1].id).toBe('1');
    });

    it('handles undefined and empty arrays safely', () => {
      expect(filterVisibleItems(undefined)).toEqual([]);
      expect(filterVisibleItems([])).toEqual([]);
    });
  });

  describe('formatDateRange', () => {
    it('formats start and end dates with en-dash', () => {
      expect(formatDateRange('2020-01', '2022-05')).toBe('2020-01 – 2022-05');
    });

    it('handles current: true by displaying Present', () => {
      expect(formatDateRange('2021-06', '', true)).toBe('2021-06 – Present');
      expect(formatDateRange('2021-06', 'Present')).toBe('2021-06 – Present');
    });

    it('handles single year or matching start and end', () => {
      expect(formatDateRange('2020', '2020')).toBe('2020');
      expect(formatDateRange('2020')).toBe('2020');
    });

    it('returns empty string when no dates provided', () => {
      expect(formatDateRange()).toBe('');
    });
  });

  describe('formatHref & formatDisplayUrl', () => {
    it('normalizes URLs for href', () => {
      expect(formatHref('https://example.com')).toBe('https://example.com');
      expect(formatHref('example.com/profile')).toBe('https://example.com/profile');
      expect(formatHref('mailto:test@example.com')).toBe('mailto:test@example.com');
      expect(formatHref('')).toBe('#');
    });

    it('strips protocols and www for display URL', () => {
      expect(formatDisplayUrl('https://www.linkedin.com/in/janedoe/')).toBe(
        'linkedin.com/in/janedoe'
      );
      expect(formatDisplayUrl('http://github.com/janedoe')).toBe('github.com/janedoe');
    });
  });
});

describe('TemplateRenderer Unit Tests', () => {
  it('renders Classic ATS template for templateId="classic-ats"', () => {
    const html = renderToStaticMarkup(
      React.createElement(TemplateRenderer, {
        data: MOCK_RESUME_DATA,
        templateId: 'classic-ats',
      })
    );
    expect(html).toContain('Jane Doe');
    expect(html).toContain('Work Experience');
    expect(html).toContain('TechCorp Solutions');
    expect(html).toContain('Professional Summary');
    expect(html).toContain('Skills');
  });

  it('renders Modern Minimal template for templateId="modern-minimal"', () => {
    const html = renderToStaticMarkup(
      React.createElement(TemplateRenderer, {
        data: MOCK_RESUME_DATA,
        templateId: 'modern-minimal',
      })
    );
    expect(html).toContain('Jane Doe');
    expect(html).toContain('Experience');
    expect(html).toContain('TechCorp Solutions');
    expect(html).toContain('Summary');
    expect(html).toContain('OpenATS Engine');
  });

  it('renders Executive template for templateId="executive"', () => {
    const html = renderToStaticMarkup(
      React.createElement(TemplateRenderer, {
        data: MOCK_RESUME_DATA,
        templateId: 'executive',
      })
    );
    expect(html).toContain('Jane Doe');
    expect(html).toContain('Executive Experience');
    expect(html).toContain('Executive Summary');
    expect(html).toContain('Core Competencies &amp; Skills');
  });

  it('handles template ID aliases cleanly', () => {
    const modernCleanHtml = renderToStaticMarkup(
      React.createElement(TemplateRenderer, {
        data: MOCK_RESUME_DATA,
        templateId: 'modern-clean',
      })
    );
    expect(modernCleanHtml).toContain('Experience');

    const technicalSplitHtml = renderToStaticMarkup(
      React.createElement(TemplateRenderer, {
        data: MOCK_RESUME_DATA,
        templateId: 'technical-split',
      })
    );
    expect(technicalSplitHtml).toContain('Experience');

    const executiveAccentHtml = renderToStaticMarkup(
      React.createElement(TemplateRenderer, {
        data: MOCK_RESUME_DATA,
        templateId: 'executive-accent',
      })
    );
    expect(executiveAccentHtml).toContain('Executive Experience');

    // Unknown defaults to ClassicAts
    const unknownHtml = renderToStaticMarkup(
      React.createElement(TemplateRenderer, {
        data: MOCK_RESUME_DATA,
        templateId: 'unknown-template',
      })
    );
    expect(unknownHtml).toContain('Work Experience');
  });

  it('renders sections in custom sequence given by sectionOrder', () => {
    const customOrder: SectionKey[] = [
      'skills',
      'experience',
      'education',
      'contact',
    ];

    const html = renderToStaticMarkup(
      React.createElement(TemplateRenderer, {
        data: MOCK_RESUME_DATA,
        templateId: 'classic-ats',
        sectionOrder: customOrder,
      })
    );

    const skillsIndex = html.indexOf('Skills');
    const expIndex = html.indexOf('Work Experience');
    const eduIndex = html.indexOf('Education');
    const contactIndex = html.indexOf('Jane Doe');

    expect(skillsIndex).toBeGreaterThan(-1);
    expect(expIndex).toBeGreaterThan(-1);
    expect(eduIndex).toBeGreaterThan(-1);
    expect(contactIndex).toBeGreaterThan(-1);

    // Skills should appear before Experience
    expect(skillsIndex).toBeLessThan(expIndex);
    // Experience should appear before Education
    expect(expIndex).toBeLessThan(eduIndex);
    // Education should appear before Contact
    expect(eduIndex).toBeLessThan(contactIndex);
  });

  it('excludes items with visible: false across all sections', () => {
    const html = renderToStaticMarkup(
      React.createElement(TemplateRenderer, {
        data: MOCK_RESUME_DATA,
        templateId: 'classic-ats',
      })
    );

    // Experience hidden item
    expect(html).not.toContain('Hidden Company Inc');
    expect(html).not.toContain('Secret Agent');
    expect(html).not.toContain('Confidential work that should not render');
    expect(html).toContain('TechCorp Solutions');

    // Project hidden item
    expect(html).not.toContain('Secret Project X');
    expect(html).not.toContain('Top secret project');
    expect(html).toContain('OpenATS Engine');

    // Education hidden item
    expect(html).not.toContain('Hidden University');
    expect(html).toContain('University of California, Berkeley');

    // Skills hidden item
    expect(html).not.toContain('Hidden Skills');
    expect(html).not.toContain('Fortran');
    expect(html).toContain('Languages');

    // Certification hidden item
    expect(html).not.toContain('Secret Certification');
    expect(html).toContain('AWS Certified Solutions Architect');

    // Involvement hidden item
    expect(html).not.toContain('Hidden Club');
    expect(html).toContain('Women Who Code SF');

    // Awards hidden item
    expect(html).not.toContain('Hidden Award');
    expect(html).toContain('Innovation Excellence Award');

    // Publications hidden item
    expect(html).not.toContain('Classified Paper');
    expect(html).toContain('Optimizing Microservice Latency');

    // References hidden item
    expect(html).not.toContain('Hidden Reference');
    expect(html).toContain('Alex Johnson');
  });

  it('excludes summary when summary.visible is false', () => {
    const hiddenSummaryData: ResumeData = {
      ...MOCK_RESUME_DATA,
      summary: {
        text: 'This summary text should not appear.',
        visible: false,
      },
    };

    const atsHtml = renderToStaticMarkup(
      React.createElement(TemplateRenderer, {
        data: hiddenSummaryData,
        templateId: 'classic-ats',
      })
    );
    expect(atsHtml).not.toContain('Professional Summary');
    expect(atsHtml).not.toContain('This summary text should not appear.');

    const modernHtml = renderToStaticMarkup(
      React.createElement(TemplateRenderer, {
        data: hiddenSummaryData,
        templateId: 'modern-minimal',
      })
    );
    expect(modernHtml).not.toContain('Summary');
    expect(modernHtml).not.toContain('This summary text should not appear.');

    const execHtml = renderToStaticMarkup(
      React.createElement(TemplateRenderer, {
        data: hiddenSummaryData,
        templateId: 'executive',
      })
    );
    expect(execHtml).not.toContain('Executive Summary');
    expect(execHtml).not.toContain('This summary text should not appear.');
  });

  it('renders all 11 sections in ClassicAts directly', () => {
    const html = renderToStaticMarkup(
      React.createElement(ClassicAts, { data: MOCK_RESUME_DATA })
    );
    expect(html).toContain('Jane Doe');
    expect(html).toContain('Professional Summary');
    expect(html).toContain('Work Experience');
    expect(html).toContain('Projects');
    expect(html).toContain('Education');
    expect(html).toContain('Skills');
    expect(html).toContain('Certifications');
    expect(html).toContain('Leadership &amp; Involvement');
    expect(html).toContain('Honors &amp; Awards');
    expect(html).toContain('Publications');
    expect(html).toContain('References');
  });

  it('renders all 11 sections in ModernMinimal directly', () => {
    const html = renderToStaticMarkup(
      React.createElement(ModernMinimal, { data: MOCK_RESUME_DATA })
    );
    expect(html).toContain('Jane Doe');
    expect(html).toContain('Summary');
    expect(html).toContain('Experience');
    expect(html).toContain('Projects');
    expect(html).toContain('Education');
    expect(html).toContain('Skills');
    expect(html).toContain('Certifications');
    expect(html).toContain('Leadership &amp; Involvement');
    expect(html).toContain('Honors &amp; Awards');
    expect(html).toContain('Publications');
    expect(html).toContain('References');
  });

  it('renders all 11 sections in Executive directly', () => {
    const html = renderToStaticMarkup(
      React.createElement(Executive, { data: MOCK_RESUME_DATA })
    );
    expect(html).toContain('Jane Doe');
    expect(html).toContain('Executive Summary');
    expect(html).toContain('Executive Experience');
    expect(html).toContain('Key Initiatives &amp; Projects');
    expect(html).toContain('Education &amp; Credentials');
    expect(html).toContain('Core Competencies &amp; Skills');
    expect(html).toContain('Board Certifications &amp; Licenses');
    expect(html).toContain('Board &amp; Advisory Roles');
    expect(html).toContain('Executive Honors &amp; Distinctions');
    expect(html).toContain('Thought Leadership &amp; Publications');
    expect(html).toContain('Professional References');
  });
});
