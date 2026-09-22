import { describe, it, expect } from 'vitest';
import { parseSkillsSection, parseProjectsSection, extractContactInfo } from '@/lib/import/resume-parser';

describe('Stage 3 - Skills, Projects, and Contact Parsers', () => {
  it('parses both categorized skills and flat bullet competencies', () => {
    const blocks = [
      `• Microservice Architecture • Backend & API Design • Node.js / NestJS`,
      `Languages: JavaScript, TypeScript, PHP, Python
Backend: Node.js, NestJS, Laravel, REST APIs
Databases & Caching: MySQL, Redis`,
    ];

    const categories = parseSkillsSection(blocks);
    expect(categories.length).toBeGreaterThanOrEqual(3);

    const categoryNames = categories.map((c) => c.categoryName);
    expect(categoryNames).toContain('Languages');
    expect(categoryNames).toContain('Backend');
    expect(categoryNames).toContain('Databases & Caching');

    const backendCat = categories.find((c) => c.categoryName === 'Backend');
    expect(backendCat?.skills).toContain('NestJS');
  });

  it('parses multiline projects with live URLs, subtitles, and bullet points', () => {
    const text = `Shomvob HRIS - Human Resource Information System (Microservices) hr.shomvob.com
Microservice-based HR platform built with Node.js, NestJS, and Next.js.
• Automated onboarding workflows.
• Scaled to handle 10,000 active employees.

WCStudio - Managed Hosting SaaS Platform wcstudio.com
• Managed hosting covering server provisioning and SSL lifecycle.`;

    const projects = parseProjectsSection(text);
    expect(projects).toHaveLength(2);
    expect(projects[0].name).toBe('Shomvob HRIS');
    expect(projects[0].link).toBe('https://hr.shomvob.com');
    expect(projects[0].bullets.length).toBeGreaterThanOrEqual(2);

    expect(projects[1].name).toBe('WCStudio');
    expect(projects[1].link).toBe('https://wcstudio.com');
  });

  it('extracts contact info including portfolio and cleaned mobile numbers', () => {
    const text = `Iqbal Hasan
Software Development Engineer II (SDE II)
Dhaka, Bangladesh • +880 1712-345678 • iqbal@example.com
linkedin.com/in/iqbalhasan • github.com/iqbalhasan • iqbal.dev`;

    const contact = extractContactInfo(text);
    expect(contact.fullName).toBe('Iqbal Hasan');
    expect(contact.email).toBe('iqbal@example.com');
    expect(contact.phone).toBe('+880 1712-345678');
    expect(contact.linkedinUrl).toBe('https://linkedin.com/in/iqbalhasan');
    expect(contact.githubUrl).toBe('https://github.com/iqbalhasan');
    expect(contact.portfolioUrl).toBe('https://iqbal.dev');
  });
});
