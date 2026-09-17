import { INITIAL_RESUME_DATA, ResumeData } from '@/types/resume';

/**
 * Deterministic, collision-resistant id generator for imported items.
 * Prefix e.g. 'exp', 'edu', 'skill'. Suffix is counter + wall-clock ms.
 */
let counter = 0;

export function genId(prefix: string): string {
  counter = (counter + 1) % 1_000_000;
  // Deterministic within a single test/process run; stable format.
  const stamp = Date.now().toString(36);
  return `${prefix}-${stamp}-${counter.toString(36)}`;
}

/** Fresh deep clone of the initial empty resume shape. */
export function emptyResumeData(): ResumeData {
  if (typeof (globalThis as any).structuredClone === 'function') {
    return (globalThis as any).structuredClone(INITIAL_RESUME_DATA) as ResumeData;
  }

  // Fallback clone (avoids JSON serialization to prevent unwanted type coercion).
  return {
    contact: { ...INITIAL_RESUME_DATA.contact },
    summary: { ...INITIAL_RESUME_DATA.summary },
    experience: [...INITIAL_RESUME_DATA.experience],
    projects: [...INITIAL_RESUME_DATA.projects],
    education: [...INITIAL_RESUME_DATA.education],
    skills: [...INITIAL_RESUME_DATA.skills],
    certifications: [...INITIAL_RESUME_DATA.certifications],
    involvement: [...INITIAL_RESUME_DATA.involvement],
    awards: [...INITIAL_RESUME_DATA.awards],
    publications: [...INITIAL_RESUME_DATA.publications],
    references: [...INITIAL_RESUME_DATA.references],
  };
}
