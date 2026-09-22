import { describe, it, expect } from 'vitest';
import { parsePlainTextResume, parseTextResumeContent } from '@/lib/import/resume-parser';

const REAL_WORLD_CV = `Iqbal Hasan
Software Development Engineer II (SDE II) | SaaS Platforms | Laravel • MERN • AI Integrations
Dhaka, Bangladesh • +880 1712-345678 • iqbal@example.com • linkedin.com/in/iqbalhasan • github.com/iqbalhasan • iqbal.dev

PROFESSIONAL SUMMARY
Results-driven Software Development Engineer II with 4+ years of experience in architecting scalable SaaS platforms, high-throughput microservices, and AI workflow integrations.

CORE COMPETENCIES
• Microservice Architecture • Backend & API Design • Node.js / NestJS Services • Laravel Backend Architecture • Database Design & Optimization • AI / LLM Tool Integrations

PROFESSIONAL EXPERIENCE
Software Development Engineer II (SDE II) Jun 2026 - Present
Shomvob Ltd. Dhaka, Bangladesh (On-site)
• Develop a Human Resource Information System (HRIS) using Node.js, NestJS, Next.js, and Redis.
• Implemented automated resume parsing and candidate ranking workflows with OpenAI API.
Technologies: Node.js, NestJS, Next.js, MySQL, Redis, Docker, RabbitMQ

Full Stack Engineer Jan 2023 - May 2026
WizTech Innovations Dhaka, Bangladesh
• Designed modular multi-tenant architecture serving 50k+ daily active users.
• Built RESTful and WebSocket real-time APIs.

TECHNICAL SKILLS
Languages: JavaScript, TypeScript, PHP, Python, SQL, HTML5, CSS3
Backend: Node.js, NestJS, Laravel, REST APIs, Microservices, JWT, WebSockets, Redis
Frontend: React, Next.js, Tailwind CSS, Vue.js
DevOps & Tools: Git, GitHub Actions, Docker, CI/CD, Postman

SELECTED PROJECTS
Shomvob HRIS - Human Resource Information System (Microservices) hr.shomvob.com
Microservice-based HR platform built with Node.js, NestJS, and Next.js.
• Automated onboarding workflows, reducing administrative overhead by 40%.

WCStudio - Managed Hosting SaaS Platform wcstudio.com
Managed hosting platform covering server provisioning, SSL lifecycle, and billing.
• Implemented automated Nginx vhost generator and SSL auto-renewal daemon.

EDUCATION
Bachelor of Science in Computer Science & Engineering 2023 - Present
Northern University Bangladesh Dhaka, Bangladesh
Coursework in software architecture, data structures, algorithms, and system analysis.

Diploma in Computer Engineering 2017 - 2022
Rajshahi Polytechnic Institute Rajshahi, Bangladesh
Foundations in programming, networking, database management, and computer systems.`;

describe('Stage 3 - End-to-End Real-World CV Parser', () => {
  it('parses real-world CV into complete structured resume data with zero loss', () => {
    const resume = parsePlainTextResume(REAL_WORLD_CV);

    // 1. Contact
    expect(resume.contact.fullName).toBe('Iqbal Hasan');
    expect(resume.contact.email).toBe('iqbal@example.com');
    expect(resume.contact.phone).toBe('+880 1712-345678');
    expect(resume.contact.linkedinUrl).toBe('https://linkedin.com/in/iqbalhasan');
    expect(resume.contact.githubUrl).toBe('https://github.com/iqbalhasan');
    expect(resume.contact.portfolioUrl).toBe('https://iqbal.dev');

    // 2. Summary
    expect(resume.summary).toContain('Results-driven Software Development Engineer II');

    // 3. Experience
    expect(resume.experience).toHaveLength(2);
    expect(resume.experience[0].company).toBe('Shomvob Ltd.');
    expect(resume.experience[0].role).toBe('Software Development Engineer II (SDE II)');
    expect(resume.experience[0].startDate).toBe('2026-06');
    expect(resume.experience[0].endDate).toBe('Present');
    expect(resume.experience[0].current).toBe(true);
    expect(resume.experience[0].bullets.length).toBeGreaterThanOrEqual(2);

    expect(resume.experience[1].company).toBe('WizTech Innovations');
    expect(resume.experience[1].role).toBe('Full Stack Engineer');

    // 4. Skills
    expect(resume.skills.length).toBeGreaterThanOrEqual(3);
    const backendCategory = resume.skills.find((s) => s.categoryName === 'Backend');
    expect(backendCategory?.skills).toContain('NestJS');
    expect(backendCategory?.skills).toContain('Laravel');

    // 5. Projects
    expect(resume.projects).toHaveLength(2);
    expect(resume.projects[0].name).toBe('Shomvob HRIS');
    expect(resume.projects[0].link).toBe('https://hr.shomvob.com');
    expect(resume.projects[1].name).toBe('WCStudio');
    expect(resume.projects[1].link).toBe('https://wcstudio.com');

    // 6. Education
    expect(resume.education).toHaveLength(2);
    expect(resume.education[0].institution).toBe('Northern University Bangladesh');
    expect(resume.education[0].degree).toBe('Bachelor of Science');
    expect(resume.education[0].fieldOfStudy).toContain('Computer Science & Engineering');
    expect(resume.education[1].institution).toBe('Rajshahi Polytechnic Institute');
    expect(resume.education[1].degree).toBe('Diploma');
  });

  it('generates fully populated ResumeData record', () => {
    const resumeData = parseTextResumeContent(REAL_WORLD_CV);
    expect(resumeData.contact.fullName).toBe('Iqbal Hasan');
    expect(resumeData.experience.length).toBe(2);
    expect(resumeData.education.length).toBe(2);
    expect(resumeData.projects.length).toBe(2);
    expect(resumeData.skills.length).toBeGreaterThanOrEqual(3);
  });
});
