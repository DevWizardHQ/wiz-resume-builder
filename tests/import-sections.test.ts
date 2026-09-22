import { describe, it, expect } from 'vitest';
import { splitIntoSections, getSectionBlocks } from '@/lib/import/resume-parser';

describe('Stage 2 - Section Detection & Multi-Section Aggregation', () => {
  it('detects all standard and extended section headings correctly', () => {
    const text = `Iqbal Hasan
Software Engineer

PROFESSIONAL SUMMARY
Experienced full-stack engineer.

CORE COMPETENCIES
• Microservices • Node.js • React

PROFESSIONAL EXPERIENCE
Software Engineer at Google
2021 - Present

TECHNICAL SKILLS
Languages: TypeScript, JavaScript, Python

AI ENGINEERING HIGHLIGHTS
• Built LLM agent pipelines

SELECTED PROJECTS
HRIS Platform - Microservices architecture

EDUCATION
Bachelor of Science in Computer Science

LANGUAGES
English (Fluent), Bengali (Native)`;

    const sections = splitIntoSections(text);
    const keys = sections.map((s) => s.key);

    expect(keys).toContain('contact');
    expect(keys).toContain('summary');
    expect(keys).toContain('skills');
    expect(keys).toContain('experience');
    expect(keys).toContain('projects');
    expect(keys).toContain('education');
  });

  it('aggregates multiple blocks belonging to the same section key', () => {
    const text = `CORE COMPETENCIES
• Architecture • Node.js

PROFESSIONAL EXPERIENCE
Senior Dev at Acme
2020 - 2024

TECHNICAL SKILLS
Backend: NestJS, Express

AI ENGINEERING HIGHLIGHTS
• Prompt engineering`;

    const sections = splitIntoSections(text);
    const skillBlocks = getSectionBlocks(sections, 'skills');

    expect(skillBlocks.length).toBeGreaterThanOrEqual(2);
    expect(skillBlocks.join('\n')).toContain('Architecture');
    expect(skillBlocks.join('\n')).toContain('NestJS');
  });
});
