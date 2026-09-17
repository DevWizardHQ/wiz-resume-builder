import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ImportResumeModal } from '@/components/editor/ImportResumeModal';
import { useResumeStore } from '@/store/useResumeStore';
import { INITIAL_RESUME_DATA } from '@/types/resume';
import { parseJsonResumeContent, parseTextResumeContent } from '@/lib/import/resume-parser';

describe('ImportResumeModal Component & Store Flow', () => {
  beforeEach(() => {
    useResumeStore.setState({
      data: JSON.parse(JSON.stringify(INITIAL_RESUME_DATA)),
      past: [],
      future: [],
      isDirty: false,
      title: 'My Resume',
    });
  });

  it('renders default button trigger when open is false', () => {
    const html = renderToStaticMarkup(React.createElement(ImportResumeModal));
    expect(html).toContain('Import / Auto-Fill');
  });

  it('renders custom trigger when provided as prop', () => {
    const customTrigger = React.createElement('button', { id: 'custom-btn' }, 'Custom Import Trigger');
    const html = renderToStaticMarkup(
      React.createElement(ImportResumeModal, { trigger: customTrigger })
    );
    expect(html).toContain('Custom Import Trigger');
    expect(html).toContain('id="custom-btn"');
  });

  it('exports ImportResumeModal functional component correctly', () => {
    expect(typeof ImportResumeModal).toBe('function');
    expect(ImportResumeModal.name).toBe('ImportResumeModal');
  });

  it('parses pasted plain text and applies it to the store in merge mode', () => {
    const resumeText = `Jane Doe
jane.doe@example.com
+1 (555) 987-6543
Seattle, WA

SUMMARY
Experienced software engineer specialized in full-stack cloud systems.

EXPERIENCE
Staff Engineer | Acme Corp | 2021-01 - Present
- Built distributed payment gateway processing 10k ops/sec.
- Led migration of 12 microservices to Kubernetes.

EDUCATION
BS in Computer Science | University of Washington | 2016 - 2020`;

    const parsed = parseTextResumeContent(resumeText);
    expect(parsed.contact.fullName).toBe('Jane Doe');
    expect(parsed.contact.email).toBe('jane.doe@example.com');
    expect(parsed.experience.length).toBe(1);

    useResumeStore.getState().importResumeData(parsed, 'merge');

    const state = useResumeStore.getState();
    expect(state.data.contact.fullName).toBe('Jane Doe');
    expect(state.data.contact.email).toBe('jane.doe@example.com');
    expect(state.data.experience.length).toBeGreaterThan(0);
    expect(state.data.experience[0].company).toBe('Acme Corp');
    expect(state.past.length).toBe(1); // Undo snapshot saved
  });

  it('parses JSON Resume format and applies it in replace mode', () => {
    const jsonResume = JSON.stringify({
      basics: {
        name: 'Jordan Lee',
        email: 'jordan@cloud.org',
        summary: 'Cloud Systems Architect with extensive experience in AWS and Go.',
      },
      work: [
        {
          name: 'Cloudflare',
          position: 'Senior Infrastructure Engineer',
          startDate: '2020-05',
          endDate: '2023-11',
          highlights: ['Managed global edge worker routing engine.'],
        },
      ],
      skills: [
        {
          name: 'Core Skills',
          keywords: ['Go', 'Rust', 'Kubernetes'],
        },
      ],
    });

    const parsed = parseJsonResumeContent(jsonResume);
    expect(parsed).not.toBeNull();
    if (!parsed) return;

    useResumeStore.getState().importResumeData(parsed, 'replace');

    const state = useResumeStore.getState();
    expect(state.data.contact.fullName).toBe('Jordan Lee');
    expect(state.data.contact.email).toBe('jordan@cloud.org');
    expect(state.data.experience.length).toBe(1);
    expect(state.data.experience[0].company).toBe('Cloudflare');
    expect(state.data.skills.length).toBe(1);
    expect(state.data.skills[0].skills).toEqual(['Go', 'Rust', 'Kubernetes']);
  });
});
