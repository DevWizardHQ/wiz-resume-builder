import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ImportResumeDialog } from '@/components/dashboard/ImportResumeDialog';
import { parseJsonResumeContent, parseTextResumeContent } from '@/lib/import/resume-parser';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

describe('ImportResumeDialog Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders default button trigger when open is false', () => {
    const html = renderToStaticMarkup(React.createElement(ImportResumeDialog));
    expect(html).toContain('Import Resume');
  });

  it('renders custom trigger when provided as prop', () => {
    const customTrigger = React.createElement('button', { id: 'dash-custom-btn' }, 'Upload and Create Resume');
    const html = renderToStaticMarkup(
      React.createElement(ImportResumeDialog, { trigger: customTrigger })
    );
    expect(html).toContain('Upload and Create Resume');
    expect(html).toContain('id="dash-custom-btn"');
  });

  it('exports ImportResumeDialog functional component correctly', () => {
    expect(typeof ImportResumeDialog).toBe('function');
    expect(ImportResumeDialog.name).toBe('ImportResumeDialog');
  });

  it('extracts structured resume payload ready for POST /api/resumes', () => {
    const sampleText = `Alex Mercer
alex.mercer@dev.io
(555) 123-4567
Austin, TX

SUMMARY
Senior DevOps Engineer specialized in Kubernetes, Terraform, and distributed CI/CD pipelines.

EXPERIENCE
Lead DevOps Engineer | Austin Tech Corp | 2022-01 - Present
- Architected zero-downtime multi-region Kubernetes deployments on AWS.
- Automated infrastructure provisioning with Terraform and GitOps.

EDUCATION
BS in Computer Engineering | University of Texas at Austin | 2017 - 2021`;

    const parsed = parseTextResumeContent(sampleText);
    expect(parsed.contact.fullName).toBe('Alex Mercer');
    expect(parsed.contact.email).toBe('alex.mercer@dev.io');
    expect(parsed.contact.location).toBe('Austin, TX');
    expect(parsed.experience.length).toBe(1);
    expect(parsed.experience[0].company).toBe('Austin Tech Corp');
    expect(parsed.education.length).toBe(1);

    const postPayload = {
      title: 'Imported Resume',
      template_id: 'classic-ats',
      use_sample_data: false,
      content: parsed,
    };

    expect(postPayload.content.contact.fullName).toBe('Alex Mercer');
    expect(postPayload.content.experience[0].bullets.length).toBe(2);
  });
});
