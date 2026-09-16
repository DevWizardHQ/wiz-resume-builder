import {
  AwardItem,
  CertificationItem,
  EducationItem,
  ExperienceItem,
  InvolvementItem,
  ProjectItem,
  PublicationItem,
} from '@/types/resume';

const MONTH_MAP: Record<string, number> = {
  jan: 0,
  january: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  sept: 8,
  september: 8,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  dec: 11,
  december: 11,
  spring: 2,
  summer: 5,
  fall: 8,
  autumn: 8,
  winter: 11,
  q1: 0,
  q2: 3,
  q3: 6,
  q4: 9,
};

/**
 * Parses a date string into a numerical UTC timestamp score for reverse-chronological sorting.
 *
 * Supports:
 * - isCurrent: true -> Number.MAX_SAFE_INTEGER
 * - "Present", "Current", "Now", "Ongoing", "In Progress", "Active" -> Number.MAX_SAFE_INTEGER
 * - ISO formats: "YYYY-MM", "YYYY-MM-DD", "YYYY"
 * - Slash/dash formats: "MM/YYYY", "M/YYYY", "YYYY/MM"
 * - Month names: "May 2023", "Jan 2022", "Expected May 2026", "September 2021"
 * - Year only: "2024", "1998"
 * - Empty, undefined, null, invalid strings -> -Infinity
 */
export function parseDateScore(dateStr?: string | null, isCurrent?: boolean): number {
  if (isCurrent) {
    return Number.MAX_SAFE_INTEGER;
  }

  if (!dateStr || typeof dateStr !== 'string') {
    return -Infinity;
  }

  const trimmed = dateStr.trim();
  if (trimmed === '') {
    return -Infinity;
  }

  const lower = trimmed.toLowerCase();
  if (
    lower === 'present' ||
    lower === 'current' ||
    lower === 'now' ||
    lower === 'ongoing' ||
    lower === 'in progress' ||
    lower === 'active' ||
    lower.startsWith('present') ||
    lower.startsWith('current') ||
    lower.startsWith('ongoing')
  ) {
    return Number.MAX_SAFE_INTEGER;
  }

  // 1. Full ISO format with day: YYYY-MM-DD
  const isoDayMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoDayMatch) {
    const year = parseInt(isoDayMatch[1], 10);
    const month = parseInt(isoDayMatch[2], 10);
    const day = parseInt(isoDayMatch[3], 10);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return Date.UTC(year, month - 1, day);
    }
  }

  // 2. Check for 4-digit year anywhere in string (e.g. 2024, "May 2023", "Expected May 2026", "05/2023")
  const yearMatch = trimmed.match(/\b(19\d{2}|20\d{2}|\d{4})\b/);
  if (yearMatch) {
    const year = parseInt(yearMatch[0], 10);

    // 2a. Check if there is a named month (e.g. "May", "January", "Sept")
    const monthNameMatch = trimmed.match(
      /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?|spring|summer|fall|autumn|winter|q[1-4])\b/i
    );
    if (monthNameMatch) {
      const cleanMonth = monthNameMatch[1].toLowerCase().replace(/[.,]/g, '');
      const monthIndex = MONTH_MAP[cleanMonth] ?? 0;
      return Date.UTC(year, monthIndex, 1);
    }

    // 2b. Check if there is a numeric month attached (e.g. "2024-03", "05/2023", "2023/05")
    const numMonthMatch =
      trimmed.match(/\b(\d{1,2})[\/\-](\d{4})\b/) ||
      trimmed.match(/\b(\d{4})[\/\-](\d{1,2})\b/);
    if (numMonthMatch) {
      const isYearFirst = numMonthMatch[1].length === 4;
      const m = parseInt(isYearFirst ? numMonthMatch[2] : numMonthMatch[1], 10);
      if (m >= 1 && m <= 12) {
        return Date.UTC(year, m - 1, 1);
      }
    }

    // 2c. Year-only match
    return Date.UTC(year, 0, 1);
  }

  // 3. Fallback to native Date.parse
  const parsed = Date.parse(trimmed);
  if (!isNaN(parsed)) {
    return parsed;
  }

  return -Infinity;
}

/**
 * Compares two date scores in descending order (higher/newer timestamp comes first).
 */
export function compareDateScores(scoreA: number, scoreB: number): number {
  if (scoreA === scoreB) return 0;
  if (scoreA > scoreB) return -1; // A is newer, comes before B
  if (scoreA < scoreB) return 1;  // B is newer, comes before A
  return 0;
}

/**
 * Sorts experience items in reverse-chronological order.
 * Primary: End date (or current: true / Present) descending.
 * Secondary: Start date descending.
 * Re-indexes `order: 0, 1, 2...` without mutating input array.
 */
export function sortExperiencesByDate(items: ExperienceItem[]): ExperienceItem[] {
  return [...items]
    .sort((a, b) => {
      const scoreA = parseDateScore(a.endDate, a.current);
      const scoreB = parseDateScore(b.endDate, b.current);
      const endComp = compareDateScores(scoreA, scoreB);
      if (endComp !== 0) return endComp;

      const startScoreA = parseDateScore(a.startDate);
      const startScoreB = parseDateScore(b.startDate);
      const startComp = compareDateScores(startScoreA, startScoreB);
      if (startComp !== 0) return startComp;

      return (a.order ?? 0) - (b.order ?? 0);
    })
    .map((item, index) => ({ ...item, order: index }));
}

/**
 * Sorts project items in reverse-chronological order.
 * Primary: End date descending.
 * Secondary: Start date descending.
 * Re-indexes `order: 0, 1, 2...` without mutating input array.
 */
export function sortProjectsByDate(items: ProjectItem[]): ProjectItem[] {
  return [...items]
    .sort((a, b) => {
      const scoreA = parseDateScore(a.endDate);
      const scoreB = parseDateScore(b.endDate);
      const endComp = compareDateScores(scoreA, scoreB);
      if (endComp !== 0) return endComp;

      const startScoreA = parseDateScore(a.startDate);
      const startScoreB = parseDateScore(b.startDate);
      const startComp = compareDateScores(startScoreA, startScoreB);
      if (startComp !== 0) return startComp;

      return (a.order ?? 0) - (b.order ?? 0);
    })
    .map((item, index) => ({ ...item, order: index }));
}

/**
 * Sorts education items in reverse-chronological order.
 * Primary: End date / graduation date descending.
 * Secondary: Start date descending.
 * Re-indexes `order: 0, 1, 2...` without mutating input array.
 */
export function sortEducationByDate(items: EducationItem[]): EducationItem[] {
  return [...items]
    .sort((a, b) => {
      const scoreA = parseDateScore(a.endDate);
      const scoreB = parseDateScore(b.endDate);
      const endComp = compareDateScores(scoreA, scoreB);
      if (endComp !== 0) return endComp;

      const startScoreA = parseDateScore(a.startDate);
      const startScoreB = parseDateScore(b.startDate);
      const startComp = compareDateScores(startScoreA, startScoreB);
      if (startComp !== 0) return startComp;

      return (a.order ?? 0) - (b.order ?? 0);
    })
    .map((item, index) => ({ ...item, order: index }));
}

/**
 * Sorts involvement items in reverse-chronological order.
 * Primary: End date descending.
 * Secondary: Start date descending.
 * Re-indexes `order: 0, 1, 2...` without mutating input array.
 */
export function sortInvolvementsByDate(items: InvolvementItem[]): InvolvementItem[] {
  return [...items]
    .sort((a, b) => {
      const scoreA = parseDateScore(a.endDate);
      const scoreB = parseDateScore(b.endDate);
      const endComp = compareDateScores(scoreA, scoreB);
      if (endComp !== 0) return endComp;

      const startScoreA = parseDateScore(a.startDate);
      const startScoreB = parseDateScore(b.startDate);
      const startComp = compareDateScores(startScoreA, startScoreB);
      if (startComp !== 0) return startComp;

      return (a.order ?? 0) - (b.order ?? 0);
    })
    .map((item, index) => ({ ...item, order: index }));
}

/**
 * Sorts certification items in reverse-chronological order.
 * Primary: Issue date descending.
 * Secondary: Expiration date descending.
 * Re-indexes `order: 0, 1, 2...` without mutating input array.
 */
export function sortCertificationsByDate(items: CertificationItem[]): CertificationItem[] {
  return [...items]
    .sort((a, b) => {
      const scoreA = parseDateScore(a.issueDate);
      const scoreB = parseDateScore(b.issueDate);
      const issueComp = compareDateScores(scoreA, scoreB);
      if (issueComp !== 0) return issueComp;

      const expScoreA = parseDateScore(a.expirationDate);
      const expScoreB = parseDateScore(b.expirationDate);
      const expComp = compareDateScores(expScoreA, expScoreB);
      if (expComp !== 0) return expComp;

      return (a.order ?? 0) - (b.order ?? 0);
    })
    .map((item, index) => ({ ...item, order: index }));
}

/**
 * Sorts award items in reverse-chronological order.
 * Primary: Date descending.
 * Re-indexes `order: 0, 1, 2...` without mutating input array.
 */
export function sortAwardsByDate(items: AwardItem[]): AwardItem[] {
  return [...items]
    .sort((a, b) => {
      const scoreA = parseDateScore(a.date);
      const scoreB = parseDateScore(b.date);
      const dateComp = compareDateScores(scoreA, scoreB);
      if (dateComp !== 0) return dateComp;

      return (a.order ?? 0) - (b.order ?? 0);
    })
    .map((item, index) => ({ ...item, order: index }));
}

/**
 * Sorts publication items in reverse-chronological order.
 * Primary: Date descending.
 * Re-indexes `order: 0, 1, 2...` without mutating input array.
 */
export function sortPublicationsByDate(items: PublicationItem[]): PublicationItem[] {
  return [...items]
    .sort((a, b) => {
      const scoreA = parseDateScore(a.date);
      const scoreB = parseDateScore(b.date);
      const dateComp = compareDateScores(scoreA, scoreB);
      if (dateComp !== 0) return dateComp;

      return (a.order ?? 0) - (b.order ?? 0);
    })
    .map((item, index) => ({ ...item, order: index }));
}
