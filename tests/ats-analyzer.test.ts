import { describe, it, expect } from 'vitest';
import {
  analyzeAtsScore,
  extractResumeFullText,
  extractKeywords,
  hasActionVerb,
  hasQuantifiableMetric,
  ACTION_VERBS,
} from '@/lib/utils/ats-analyzer';
import { INITIAL_RESUME_DATA, ResumeData } from '@/types/resume';

describe('ATS Analyzer - Utility Functions', () => {
  it('identifies strong action verbs accurately', () => {
    expect(hasActionVerb('Spearheaded the migration of monolith to microservices')).toBe(true);
    expect(hasActionVerb('Engineered a high-throughput data processing pipeline')).toBe(true);
    expect(hasActionVerb('optimized database queries to decrease latency')).toBe(true);
    expect(hasActionVerb('Responsible for writing daily tickets')).toBe(false);
    expect(hasActionVerb('')).toBe(false);
  });

  it('identifies quantifiable metrics accurately', () => {
    expect(hasQuantifiableMetric('Increased revenue by 45% within 6 months')).toBe(true);
    expect(hasQuantifiableMetric('Saved $150,000 annually through infrastructure optimization')).toBe(true);
    expect(hasQuantifiableMetric('Scaled architecture to support 500k active users')).toBe(true);
    expect(hasQuantifiableMetric('Reduced response latency from 450ms to 45ms (10x improvement)')).toBe(true);
    expect(hasQuantifiableMetric('Collaborated with cross-functional product teams')).toBe(false);
    expect(hasQuantifiableMetric('')).toBe(false);
  });

  it('extracts technical and domain keywords from text', () => {
    const jobDescription = `
      We are looking for a Senior Full Stack Engineer proficient in TypeScript, React, Next.js, and Node.js.
      Experience with PostgreSQL, Redis, Docker, and AWS is required. Knowledge of CI/CD and GraphQL is a plus.
    `;
    const keywords = extractKeywords(jobDescription);
    expect(keywords).toContain('typescript');
    expect(keywords).toContain('react');
    expect(keywords).toContain('next.js');
    expect(keywords).toContain('node.js');
    expect(keywords).toContain('postgresql');
    expect(keywords).toContain('redis');
    expect(keywords).toContain('docker');
    expect(keywords).toContain('aws');
    expect(keywords).toContain('ci/cd');
    expect(keywords).toContain('graphql');
  });

  it('extracts full resume text correctly while respecting visibility flags', () => {
    const sampleResume: ResumeData = {
      ...INITIAL_RESUME_DATA,
      contact: {
        fullName: 'Alex Morgan',
        email: 'alex@example.com',
        phone: '555-0199',
        location: 'San Francisco, CA',
      },
      summary: {
        text: 'Senior Software Engineer with 8 years of experience.',
        visible: true,
      },
      experience: [
        {
          id: 'exp-1',
          visible: true,
          order: 0,
          company: 'Acme Corp',
          role: 'Lead Architect',
          startDate: '2021-01',
          current: true,
          bullets: ['Architected cloud infrastructure on AWS', 'Managed 10 engineers'],
        },
        {
          id: 'exp-2',
          visible: false, // Hidden item
          order: 1,
          company: 'Hidden Co',
          role: 'Hidden Role',
          startDate: '2019-01',
          current: false,
          bullets: ['Hidden secret bullet'],
        },
      ],
      skills: [
        {
          id: 'sk-1',
          visible: true,
          order: 0,
          categoryName: 'Languages',
          skills: ['TypeScript', 'Python', 'Go'],
        },
      ],
    };

    const text = extractResumeFullText(sampleResume);
    expect(text).toContain('Alex Morgan');
    expect(text).toContain('Lead Architect');
    expect(text).toContain('AWS');
    expect(text).toContain('TypeScript');
    expect(text).not.toContain('Hidden secret bullet');
  });
});

describe('ATS Analyzer - Scoring Engine', () => {
  it('penalizes empty resumes with low overall and format scores', () => {
    const result = analyzeAtsScore(INITIAL_RESUME_DATA);
    expect(result.overallScore).toBeLessThan(40);
    expect(result.formatScore).toBeLessThan(40);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.suggestions.length).toBeGreaterThan(0);
    expect(result.metricsCount).toBe(0);
    expect(result.actionVerbCount).toBe(0);
  });

  it('awards high score for complete, well-structured resumes with action verbs and metrics', () => {
    const comprehensiveResume: ResumeData = {
      contact: {
        fullName: 'Jane Doe',
        email: 'jane.doe@example.com',
        phone: '123-456-7890',
        location: 'New York, NY',
        linkedinUrl: 'https://linkedin.com/in/janedoe',
        githubUrl: 'https://github.com/janedoe',
      },
      summary: {
        text: 'Results-driven Senior Full Stack Software Engineer with 7+ years of experience specializing in high-performance distributed web applications, cloud architecture, and modern TypeScript ecosystems.',
        visible: true,
      },
      experience: [
        {
          id: 'exp-1',
          visible: true,
          order: 0,
          company: 'TechCorp Solutions',
          role: 'Senior Staff Engineer',
          location: 'New York, NY',
          startDate: '2021-03',
          endDate: 'Present',
          current: true,
          bullets: [
            'Architected and deployed microservices on AWS EKS, scaling platform to 500k daily active users with 99.99% uptime.',
            'Spearheaded performance optimization of Next.js frontend, reducing core web vitals LCP by 45% and boosting SEO rank.',
            'Streamlined CI/CD deployment pipelines using GitHub Actions, decreasing build times by 35% across 12 services.',
          ],
        },
        {
          id: 'exp-2',
          visible: true,
          order: 1,
          company: 'DataFlow Systems',
          role: 'Full Stack Engineer',
          location: 'Boston, MA',
          startDate: '2018-06',
          endDate: '2021-02',
          current: false,
          bullets: [
            'Engineered real-time analytics dashboard with React, TypeScript, and WebSockets handling $2.5M in monthly transactions.',
            'Optimized PostgreSQL queries and Redis caching, cutting average database response times from 350ms to 25ms.',
          ],
        },
      ],
      projects: [
        {
          id: 'proj-1',
          visible: true,
          order: 0,
          name: 'CloudScale AI Engine',
          role: 'Creator & Maintainer',
          startDate: '2023-01',
          technologies: ['TypeScript', 'Next.js', 'PostgreSQL', 'Docker'],
          bullets: ['Built an open-source AI resume analyzer with 1,500+ GitHub stars.'],
        },
      ],
      education: [
        {
          id: 'edu-1',
          visible: true,
          order: 0,
          institution: 'Massachusetts Institute of Technology (MIT)',
          degree: 'Bachelor of Science',
          fieldOfStudy: 'Computer Science',
          startDate: '2014',
          endDate: '2018',
          gpa: '3.9',
        },
      ],
      skills: [
        {
          id: 'sk-1',
          visible: true,
          order: 0,
          categoryName: 'Languages & Frameworks',
          skills: ['TypeScript', 'JavaScript', 'Python', 'React', 'Next.js', 'Node.js'],
        },
        {
          id: 'sk-2',
          visible: true,
          order: 1,
          categoryName: 'Databases & Cloud',
          skills: ['PostgreSQL', 'Redis', 'AWS', 'Docker', 'Kubernetes', 'CI/CD'],
        },
      ],
      certifications: [
        {
          id: 'cert-1',
          visible: true,
          order: 0,
          name: 'AWS Certified Solutions Architect - Professional',
          issuer: 'Amazon Web Services',
          issueDate: '2023-05',
        },
      ],
      involvement: [],
      awards: [],
      publications: [],
      references: [],
    };

    const result = analyzeAtsScore(comprehensiveResume);

    expect(result.formatScore).toBeGreaterThanOrEqual(85);
    expect(result.overallScore).toBeGreaterThanOrEqual(85);
    expect(result.actionVerbCount).toBeGreaterThanOrEqual(5);
    expect(result.metricsCount).toBeGreaterThanOrEqual(5);
    expect(result.warnings.length).toBe(0);
  });

  it('matches keywords from job description and computes match statistics', () => {
    const resume: ResumeData = {
      ...INITIAL_RESUME_DATA,
      contact: {
        fullName: 'Jordan Dev',
        email: 'jordan@example.com',
        phone: '123-456-7890',
        location: 'Austin, TX',
      },
      summary: {
        text: 'Senior Developer with strong expertise in TypeScript, React, Next.js, and Node.js.',
        visible: true,
      },
      skills: [
        {
          id: 'sk-1',
          visible: true,
          order: 0,
          categoryName: 'Languages',
          skills: ['TypeScript', 'React', 'Next.js', 'PostgreSQL'],
        },
      ],
    };

    const jobDesc = 'Seeking an engineer with expertise in TypeScript, Next.js, PostgreSQL, Docker, Kubernetes, and Golang.';
    const result = analyzeAtsScore(resume, jobDesc);

    expect(result.matchedKeywords).toContain('typescript');
    expect(result.matchedKeywords).toContain('next.js');
    expect(result.matchedKeywords).toContain('postgresql');
    expect(result.missingKeywords).toContain('docker');
    expect(result.missingKeywords).toContain('kubernetes');
    expect(result.missingKeywords).toContain('golang');

    expect(result.keywordScore).toBeGreaterThan(0);
    expect(result.keywordScore).toBeLessThan(100);
    expect(result.suggestions.some(s => s.includes('target job keywords'))).toBe(true);
  });

  it('handles null/undefined input safely without throwing exceptions', () => {
    // @ts-expect-error testing runtime robustness
    const result = analyzeAtsScore(null);
    expect(result).toBeDefined();
    expect(result.overallScore).toBeLessThan(40);
    expect(Array.isArray(result.suggestions)).toBe(true);
    expect(Array.isArray(result.warnings)).toBe(true);
  });
});
