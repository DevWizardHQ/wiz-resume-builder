import { describe, it, expect } from 'vitest';
import { parseExperienceSection } from '@/lib/import/resume-parser';

describe('Stage 3 - Experience Parser', () => {
  it('parses 2-line header format with role on line 1 and company on line 2', () => {
    const text = `Software Development Engineer II (SDE II) Jun 2026 - Present
Shomvob Ltd. Dhaka, Bangladesh (On-site)
• Develop a Human Resource Information System (HRIS) microservices ecosystem.
• Automated onboarding workflows, reducing manual operations by 40%.
Technologies: Node.js, NestJS, Next.js, MySQL, Redis, Docker`;

    const items = parseExperienceSection(text);
    expect(items).toHaveLength(1);
    expect(items[0].role).toBe('Software Development Engineer II (SDE II)');
    expect(items[0].company).toBe('Shomvob Ltd.');
    expect(items[0].location).toContain('Dhaka, Bangladesh');
    expect(items[0].startDate).toBe('2026-06');
    expect(items[0].endDate).toBe('Present');
    expect(items[0].current).toBe(true);
    expect(items[0].bullets.length).toBeGreaterThanOrEqual(2);
  });

  it('parses multiple consecutive jobs separated by single or double newlines', () => {
    const text = `Software Development Engineer II Jun 2026 - Present
Shomvob Ltd. Dhaka, Bangladesh
• Built core microservices.

Full Stack Engineer Jan 2024 - May 2026
WizTech Corp San Francisco, CA
• Designed user-facing dashboards.`;

    const items = parseExperienceSection(text);
    expect(items).toHaveLength(2);
    expect(items[0].company).toBe('Shomvob Ltd.');
    expect(items[0].role).toBe('Software Development Engineer II');
    expect(items[1].company).toBe('WizTech Corp');
    expect(items[1].role).toBe('Full Stack Engineer');
  });

  it('parses single-line pipe and comma delimited headers', () => {
    const text = `Senior Backend Engineer | Stripe | Remote | 2022-01 - 2024-03
• Led payments infrastructure team.`;

    const items = parseExperienceSection(text);
    expect(items).toHaveLength(1);
    expect(items[0].role).toBe('Senior Backend Engineer');
    expect(items[0].company).toBe('Stripe');
    expect(items[0].startDate).toBe('2022-01');
    expect(items[0].endDate).toBe('2024-03');
  });

  it('stitches wrapped multiline bullet points into single bullets without fragmenting jobs', () => {
    const text = `Software Engineer Jan 2024 - Present
Devzar Dhaka, Bangladesh
• Engineered a distributed task processing pipeline using Redis and Node.js
  that handled over 2 million background jobs daily with 99.99% uptime.
• Architected real-time WebSocket communication layer
  reducing connection latency by 35%.
Technologies: Node.js, Redis, TypeScript, Docker`;

    const items = parseExperienceSection(text);
    expect(items).toHaveLength(1);
    expect(items[0].role).toBe('Software Engineer');
    expect(items[0].company).toBe('Devzar');
    expect(items[0].location).toBe('Dhaka, Bangladesh');
    expect(items[0].bullets).toHaveLength(2);
    expect(items[0].bullets[0]).toContain('2 million background jobs daily');
    expect(items[0].bullets[1]).toContain('reducing connection latency by 35%');
  });

  it('correctly separates suffix-less company names from trailing city, country locations', () => {
    const text = `Full Stack Developer 2022 - 2024
Devzar Dhaka, Bangladesh (On-site)
• Developed responsive web applications using Next.js and Tailwind CSS.`;

    const items = parseExperienceSection(text);
    expect(items).toHaveLength(1);
    expect(items[0].company).toBe('Devzar');
    expect(items[0].location).toContain('Dhaka, Bangladesh');
  });
});
