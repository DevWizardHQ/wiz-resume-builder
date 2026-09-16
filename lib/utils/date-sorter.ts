import {
  AwardItem,
  CertificationItem,
  EducationItem,
  ExperienceItem,
  InvolvementItem,
  ProjectItem,
} from '@/types/resume';

/**
 * Parses a date string (e.g. "2023-05", "2023", "Present", "May 2023") into a timestamp for comparison.
 */
function parseDateScore(dateStr?: string, isCurrent?: boolean): number {
  if (isCurrent) return Number.MAX_SAFE_INTEGER;
  if (!dateStr || dateStr.trim() === '') return -Infinity;

  const normalized = dateStr.trim().toLowerCase();
  if (normalized === 'present' || normalized === 'current' || normalized === 'now') {
    return Number.MAX_SAFE_INTEGER;
  }

  // Handle YYYY-MM or YYYY
  const parsed = Date.parse(dateStr);
  if (!isNaN(parsed)) {
    return parsed;
  }

  // Fallback for 4-digit years
  const yearMatch = dateStr.match(/\b(19|20\d{2})\b/);
  if (yearMatch) {
    return new Date(parseInt(yearMatch[0], 10), 0, 1).getTime();
  }

  return 0;
}

export function sortExperiencesByDate(items: ExperienceItem[]): ExperienceItem[] {
  return [...items].sort((a, b) => {
    const scoreA = parseDateScore(a.endDate, a.current);
    const scoreB = parseDateScore(b.endDate, b.current);

    if (scoreB !== scoreA) {
      return scoreB - scoreA;
    }

    // Secondary sort on start date
    const startScoreA = parseDateScore(a.startDate);
    const startScoreB = parseDateScore(b.startDate);
    return startScoreB - startScoreA;
  }).map((item, index) => ({ ...item, order: index }));
}

export function sortProjectsByDate(items: ProjectItem[]): ProjectItem[] {
  return [...items].sort((a, b) => {
    const scoreA = parseDateScore(a.endDate);
    const scoreB = parseDateScore(b.endDate);

    if (scoreB !== scoreA) {
      return scoreB - scoreA;
    }

    const startScoreA = parseDateScore(a.startDate);
    const startScoreB = parseDateScore(b.startDate);
    return startScoreB - startScoreA;
  }).map((item, index) => ({ ...item, order: index }));
}

export function sortEducationByDate(items: EducationItem[]): EducationItem[] {
  return [...items].sort((a, b) => {
    const scoreA = parseDateScore(a.endDate);
    const scoreB = parseDateScore(b.endDate);

    if (scoreB !== scoreA) {
      return scoreB - scoreA;
    }

    const startScoreA = parseDateScore(a.startDate);
    const startScoreB = parseDateScore(b.startDate);
    return startScoreB - startScoreA;
  }).map((item, index) => ({ ...item, order: index }));
}

export function sortInvolvementsByDate(items: InvolvementItem[]): InvolvementItem[] {
  return [...items].sort((a, b) => {
    const scoreA = parseDateScore(a.endDate);
    const scoreB = parseDateScore(b.endDate);

    if (scoreB !== scoreA) {
      return scoreB - scoreA;
    }

    const startScoreA = parseDateScore(a.startDate);
    const startScoreB = parseDateScore(b.startDate);
    return startScoreB - startScoreA;
  }).map((item, index) => ({ ...item, order: index }));
}

export function sortCertificationsByDate(items: CertificationItem[]): CertificationItem[] {
  return [...items].sort((a, b) => {
    const scoreA = parseDateScore(a.issueDate);
    const scoreB = parseDateScore(b.issueDate);
    return scoreB - scoreA;
  }).map((item, index) => ({ ...item, order: index }));
}

export function sortAwardsByDate(items: AwardItem[]): AwardItem[] {
  return [...items].sort((a, b) => {
    const scoreA = parseDateScore(a.date);
    const scoreB = parseDateScore(b.date);
    return scoreB - scoreA;
  }).map((item, index) => ({ ...item, order: index }));
}
