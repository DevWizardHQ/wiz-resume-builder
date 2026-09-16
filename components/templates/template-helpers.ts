import { BaseItem, ResumeData, SectionKey } from '@/types/resume';

export interface TemplateProps {
  data: ResumeData;
  sectionOrder?: SectionKey[];
  className?: string;
}

/**
 * Filter items that are visible (visible !== false) and sort them by order.
 */
export function filterVisibleItems<T extends Partial<BaseItem>>(items?: T[]): T[] {
  if (!items || !Array.isArray(items)) return [];
  return items
    .filter((item) => item && item.visible !== false)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

/**
 * Formats a date range cleanly.
 * e.g., "2021-01 – Present", "2019 – 2023", "May 2022"
 */
export function formatDateRange(
  startDate?: string,
  endDate?: string,
  current?: boolean
): string {
  const start = startDate?.trim() || '';
  const isCurrentlyActive = Boolean(current || (!endDate && current));
  const end = isCurrentlyActive ? 'Present' : (endDate?.trim() || '');

  if (start && end) {
    if (start.toLowerCase() === end.toLowerCase()) {
      return start;
    }
    return `${start} – ${end}`;
  }
  if (start) return start;
  if (end) return end;
  return '';
}

/**
 * Normalizes a URL for href attribute.
 */
export function formatHref(url?: string): string {
  if (!url) return '#';
  const trimmed = url.trim();
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('mailto:') ||
    trimmed.startsWith('tel:')
  ) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

/**
 * Clean URL representation for display (e.g., "linkedin.com/in/johndoe").
 */
export function formatDisplayUrl(url?: string): string {
  if (!url) return '';
  return url
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .replace(/\/$/, '');
}
