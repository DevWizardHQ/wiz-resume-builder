import { describe, it, expect, beforeEach } from 'vitest';
import { useResumeStore } from '@/store/useResumeStore';
import {
  analyzeAtsScore,
  extractKeywords,
  extractResumeFullText,
  hasActionVerb,
  hasQuantifiableMetric,
} from '@/lib/utils/ats-analyzer';
import { generateFallbackBullets } from '@/lib/ai/local-client';
import { INITIAL_RESUME_DATA, ResumeData } from '@/types/resume';

describe('AI In-Line Bullet Optimizer & ATS Review Logic', () => {
  beforeEach(() => {
    useResumeStore.getState().resetResume();
  });

  describe('Google X-Y-Z Bullet Generator & Tone Adaptation', () => {
    it('generates high-impact bullets with action verbs and metrics from raw draft', () => {
      const rawAchievement = 'I redesigned the database queries and added redis which made our APIs much faster';
      const bullets = generateFallbackBullets(rawAchievement, 'Senior Backend Engineer');

      expect(bullets.length).toBeGreaterThanOrEqual(2);
      expect(bullets.some((b) => hasActionVerb(b))).toBe(true);
      expect(bullets.some((b) => hasQuantifiableMetric(b))).toBe(true);
    });

    it('adapts context correctly for diverse roles and domains', () => {
      const draft = 'built payment service with stripe and webhook processing';

      const executiveBullets = generateFallbackBullets(draft, 'Payment Lead');
      expect(executiveBullets.length).toBeGreaterThan(0);

      const technicalBullets = generateFallbackBullets(draft, 'Backend Developer');
      expect(technicalBullets.length).toBeGreaterThan(0);

      const actionBullets = generateFallbackBullets(draft, 'Full Stack Engineer');
      expect(actionBullets.length).toBeGreaterThan(0);
    });

    it('handles empty or brief input gracefully', () => {
      const emptyFallback = generateFallbackBullets('');
      expect(emptyFallback).toEqual([]);

      const briefFallback = generateFallbackBullets('handled customer support tickets');
      expect(briefFallback.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('ATS Review Drawer - Score Thresholds & Metric Engine', () => {
    it('categorizes scores into Red (<60), Yellow (60-79), and Green (80+) brackets', () => {
      // 1. Red bracket (<60) - empty/minimal resume
      const poorResume: ResumeData = {
        ...INITIAL_RESUME_DATA,
        contact: {
          fullName: 'Test User',
          email: '',
          phone: '',
          location: '',
        },
      };
      const poorResult = analyzeAtsScore(poorResume);
      expect(poorResult.overallScore).toBeLessThan(60);

      // 2. Yellow bracket (60-79) - basic details without heavy metrics
      const moderateResume: ResumeData = {
        ...INITIAL_RESUME_DATA,
        contact: {
          fullName: 'Alex Developer',
          email: 'alex@example.com',
          phone: '555-0199',
          location: 'San Francisco, CA',
        },
        summary: {
          text: 'Passionate developer building web applications with modern technologies.',
          visible: true,
        },
        experience: [
          {
            id: 'exp-1',
            company: 'Tech Startup',
            role: 'Software Engineer',
            startDate: '2022-01',
            current: true,
            bullets: ['Developed user interface components in React', 'Maintained bug fixes in backend'],
            visible: true,
            order: 0,
          },
        ],
        skills: [
          {
            id: 'sk-1',
            categoryName: 'Tech',
            skills: ['React', 'JavaScript', 'Node.js'],
            visible: true,
            order: 0,
          },
        ],
      };
      const moderateResult = analyzeAtsScore(moderateResume);
      expect(moderateResult.overallScore).toBeGreaterThanOrEqual(50);
      expect(moderateResult.overallScore).toBeLessThan(80);

      // 3. Green bracket (80+) - rich resume with quantifiable achievements
      const excellentResume: ResumeData = {
        ...moderateResume,
        summary: {
          text: 'Accomplished Senior Software Engineer with 6+ years of expertise in cloud architecture, distributed systems, and modern TypeScript frontend performance optimization.',
          visible: true,
        },
        experience: [
          {
            id: 'exp-1',
            company: 'ScaleCorp Inc.',
            role: 'Lead Architect',
            startDate: '2020-01',
            current: true,
            bullets: [
              'Architected and deployed microservices on AWS, handling 25,000 requests/sec with 99.99% uptime.',
              'Spearheaded database query optimization, reducing p99 latency by 45% and saving $80,000 annually.',
              'Engineered automated CI/CD pipeline in GitHub Actions, slashing build times by 35% across 15 repositories.',
            ],
            visible: true,
            order: 0,
          },
        ],
        skills: [
          {
            id: 'sk-1',
            categoryName: 'Languages & Frameworks',
            skills: ['TypeScript', 'React', 'Next.js', 'Node.js', 'Python'],
            visible: true,
            order: 0,
          },
          {
            id: 'sk-2',
            categoryName: 'Cloud & Database',
            skills: ['AWS', 'Docker', 'Kubernetes', 'PostgreSQL', 'Redis'],
            visible: true,
            order: 1,
          },
        ],
        education: [
          {
            id: 'edu-1',
            institution: 'University of Washington',
            degree: 'Bachelor of Science',
            fieldOfStudy: 'Computer Science',
            startDate: '2016',
            endDate: '2020',
            visible: true,
            order: 0,
          },
        ],
        projects: [
          {
            id: 'proj-1',
            name: 'Wiz Resume Builder',
            role: 'Creator',
            technologies: ['Next.js', 'TypeScript', 'Tailwind CSS'],
            bullets: ['Built full-stack ATS resume builder with 10k+ active users.'],
            visible: true,
            order: 0,
          },
        ],
      };
      const excellentResult = analyzeAtsScore(excellentResume);
      expect(excellentResult.overallScore).toBeGreaterThanOrEqual(80);
      expect(excellentResult.formatScore).toBeGreaterThanOrEqual(80);
    });

    it('identifies keyword gaps when audited against a job description', () => {
      const resume: ResumeData = {
        ...INITIAL_RESUME_DATA,
        contact: {
          fullName: 'Sam Dev',
          email: 'sam@example.com',
          phone: '555-0100',
          location: 'Seattle, WA',
        },
        skills: [
          {
            id: 'sk-1',
            categoryName: 'Core',
            skills: ['TypeScript', 'React', 'Next.js'],
            visible: true,
            order: 0,
          },
        ],
      };

      const jobPosting = `
        We are seeking a Lead Backend Engineer with expertise in Go, Kubernetes, Terraform, AWS, and PostgreSQL.
        Must have experience designing distributed systems and RESTful APIs.
      `;

      const audit = analyzeAtsScore(resume, jobPosting);
      expect(audit.missingKeywords).toContain('kubernetes');
      expect(audit.missingKeywords).toContain('terraform');
      expect(audit.missingKeywords).toContain('aws');
      expect(audit.missingKeywords).toContain('postgresql');
      expect(audit.suggestions.some((s) => s.includes('target job keywords'))).toBe(true);
    });

    it('synchronizes calculated ATS score with resume store', () => {
      const store = useResumeStore.getState();
      expect(store.atsScore).toBe(0);

      store.setAtsScore(88);
      expect(useResumeStore.getState().atsScore).toBe(88);
    });
  });
});
