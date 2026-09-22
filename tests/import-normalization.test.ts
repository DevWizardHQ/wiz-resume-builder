import { describe, it, expect } from 'vitest';
import { normalizeDocumentText } from '@/lib/import/resume-parser';

describe('Stage 1 - Document Normalization Engine', () => {
  it('normalizes carriage returns and control characters', () => {
    const raw = 'John Doe\r\nSoftware Engineer\r​﻿\nSan Francisco, CA';
    const normalized = normalizeDocumentText(raw);
    expect(normalized).toBe('John Doe\nSoftware Engineer\nSan Francisco, CA');
  });

  it('normalizes diverse unicode bullet characters to standard bullets', () => {
    const raw = '• First item\n▪ Second item\n◦ Third item\n● Fourth item\n· Fifth item\n- Sixth item';
    const normalized = normalizeDocumentText(raw);
    expect(normalized).toBe('• First item\n• Second item\n• Third item\n• Fourth item\n• Fifth item\n• Sixth item');
  });

  it('normalizes diverse en-dash and em-dash separators', () => {
    const raw = '2020 – 2024\nProject — Microservices Platform\nRole ― Team Lead';
    const normalized = normalizeDocumentText(raw);
    expect(normalized).toContain('2020 - 2024');
    expect(normalized).toContain('Project - Microservices Platform');
  });

  it('repairs broken word hyphenation across line breaks', () => {
    const raw = 'Architected a scalable microservices ecosys-\ntem with high-throughput automa-\ntion pipelines.';
    const normalized = normalizeDocumentText(raw);
    expect(normalized).toContain('microservices ecosystem');
    expect(normalized).toContain('automation pipelines.');
  });

  it('collapses excessive empty newlines while preserving paragraph structure', () => {
    const raw = 'Section 1\n\n\n\n\nSection 2\n\nSection 3';
    const normalized = normalizeDocumentText(raw);
    expect(normalized).toBe('Section 1\n\nSection 2\n\nSection 3');
  });
});
