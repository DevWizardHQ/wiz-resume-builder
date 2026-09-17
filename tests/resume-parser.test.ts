import { describe, it, expect } from 'vitest';
import { genId, emptyResumeData } from '@/lib/import/id';
import { INITIAL_RESUME_DATA, SectionKey } from '@/types/resume';

describe('import id & shape utils', () => {
  it('genId returns prefix + unique deterministic suffix', () => {
    const a = genId('exp');
    const b = genId('exp');
    expect(a).toMatch(/^exp-[a-z0-9-]{8,}$/);
    expect(a).not.toBe(b);
  });

  it('emptyResumeData returns a fresh deep clone of INITIAL_RESUME_DATA', () => {
    const e1 = emptyResumeData();
    const e2 = emptyResumeData();
    expect(e1).toEqual(INITIAL_RESUME_DATA);
    expect(e1).not.toBe(e2);
    expect(e1.experience).toEqual([]);
  });
});
