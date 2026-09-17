import {
  ResumeData,
  ExperienceItem,
  EducationItem,
  SkillCategory,
  ProjectItem,
  CertificationItem,
  InvolvementItem,
  AwardItem,
  PublicationItem,
  ReferenceItem,
} from '@/types/resume';
import { ImportedResume } from '@/types/import';
import { genId, emptyResumeData } from '@/lib/import/id';

/** Strip leading first-person pronouns for ATS third-person voice. */
export function sanitizeAtsText(input: string): string {
  return input
    .trim()
    .replace(/^\s*(I|me|my|mine|we|us|our|ours)\s+/i, '')
    .trim();
}

/** Normalize a date string to YYYY-MM or YYYY. Returns '' if undetectable. */
export function normalizeDate(input?: string): string {
  if (!input) return '';
  const s = String(input).trim();
  const iso = s.match(/(\d{4})-?(\d{2})?/);
  if (!iso) return '';
  return iso[2] ? `${iso[1]}-${iso[2]}` : iso[1];
}

function toStringOrEmpty(v: unknown): string {
  return v === null || v === undefined ? '' : String(v);
}

/** Maps JSON Resume (https://jsonresume.org/schema) to normalized ImportedResume. */
export function jsonResumeToImported(raw: unknown): ImportedResume {
  const src = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;

  const basics =
    src.basics && typeof src.basics === 'object'
      ? (src.basics as Record<string, unknown>)
      : {};

  const location =
    basics.location && typeof basics.location === 'object'
      ? (basics.location as Record<string, unknown>)
      : {};

  const voicedSummary =
    typeof basics.summary === 'string' ? basics.summary.trim() : undefined;

  const experience: ExperienceItem[] = Array.isArray(src.work)
    ? (src.work as unknown[])
        .filter((w) => w && typeof w === 'object')
        .map((w, idx) => {
          const obj = w as Record<string, unknown>;
          const endRaw = toStringOrEmpty(obj.endDate);
          const highlights: string[] = Array.isArray(obj.highlights)
            ? (obj.highlights as unknown[])
                .map((h) => sanitizeAtsText(toStringOrEmpty(h)))
                .filter(Boolean)
            : [];

          return {
            id: genId('exp'),
            visible: true,
            order: idx,
            company: toStringOrEmpty(obj.company).trim() || 'Unknown Company',
            role: toStringOrEmpty(obj.position || obj.title).trim(),
            location:
              obj.location !== undefined
                ? toStringOrEmpty(obj.location).trim()
                : undefined,
            startDate: normalizeDate(toStringOrEmpty(obj.startDate)),
            endDate:
              normalizeDate(endRaw) || (endRaw ? 'Present' : ''),
            current: /present|current|now|ongoing/i.test(endRaw),
            bullets: highlights,
          };
        })
    : [];

  const education: EducationItem[] = Array.isArray(src.education)
    ? (src.education as unknown[])
        .filter((e) => e && typeof e === 'object')
        .map((e, idx) => {
          const obj = e as Record<string, unknown>;
          return {
            id: genId('edu'),
            visible: true,
            order: idx,
            institution: toStringOrEmpty(obj.institution).trim(),
            degree: toStringOrEmpty(obj.studyType).trim(),
            fieldOfStudy: toStringOrEmpty(obj.area).trim(),
            startDate: normalizeDate(toStringOrEmpty(obj.startDate)),
            endDate: normalizeDate(toStringOrEmpty(obj.endDate)),
            gpa:
              obj.gpa !== undefined && obj.gpa !== null
                ? toStringOrEmpty(obj.gpa).trim() || undefined
                : undefined,
          };
        })
    : [];

  const skills: SkillCategory[] = Array.isArray(src.skills)
    ? (src.skills as unknown[])
        .filter((s) => s && typeof s === 'object')
        .map((s, idx) => {
          const obj = s as Record<string, unknown>;
          const keywords = Array.isArray(obj.keywords)
            ? (obj.keywords as unknown[])
                .map((k) => toStringOrEmpty(k).trim())
                .filter(Boolean)
            : [];

          return {
            id: genId('skill'),
            visible: true,
            order: idx,
            categoryName: toStringOrEmpty(obj.name).trim() || 'Skills',
            skills: keywords,
          };
        })
    : [];

  const projects: ProjectItem[] = Array.isArray(src.projects)
    ? (src.projects as unknown[])
        .filter((p) => p && typeof p === 'object')
        .map((p, idx) => {
          const obj = p as Record<string, unknown>;
          const highlights: string[] = Array.isArray(obj.highlights)
            ? (obj.highlights as unknown[])
                .map((h) => sanitizeAtsText(toStringOrEmpty(h)))
                .filter(Boolean)
            : [];

          return {
            id: genId('proj'),
            visible: true,
            order: idx,
            name: toStringOrEmpty(obj.name).trim(),
            role: obj.role ? toStringOrEmpty(obj.role).trim() : undefined,
            link: obj.url ? toStringOrEmpty(obj.url).trim() : undefined,
            startDate: normalizeDate(toStringOrEmpty(obj.startDate)) || undefined,
            endDate: normalizeDate(toStringOrEmpty(obj.endDate)) || undefined,
            technologies: Array.isArray(obj.keywords)
              ? (obj.keywords as unknown[])
                  .map((k) => toStringOrEmpty(k).trim())
                  .filter(Boolean)
              : [],
            bullets: highlights,
          };
        })
    : [];

  const certifications: CertificationItem[] = Array.isArray(src.certificates)
    ? (src.certificates as unknown[])
        .filter((c) => c && typeof c === 'object')
        .map((c, idx) => {
          const obj = c as Record<string, unknown>;
          return {
            id: genId('cert'),
            visible: true,
            order: idx,
            name: toStringOrEmpty(obj.name || obj.title).trim(),
            issuer: toStringOrEmpty(obj.issuer).trim(),
            issueDate: normalizeDate(toStringOrEmpty(obj.date || obj.startDate)),
            credentialUrl: obj.url ? toStringOrEmpty(obj.url).trim() : undefined,
          };
        })
    : [];

  const involvement: InvolvementItem[] = Array.isArray(src.volunteer)
    ? (src.volunteer as unknown[])
        .filter((v) => v && typeof v === 'object')
        .map((v, idx) => {
          const obj = v as Record<string, unknown>;
          const bullets: string[] = Array.isArray(obj.highlights)
            ? (obj.highlights as unknown[])
                .map((h) => sanitizeAtsText(toStringOrEmpty(h)))
                .filter(Boolean)
            : [];

          return {
            id: genId('inv'),
            visible: true,
            order: idx,
            organization: toStringOrEmpty(obj.organization).trim(),
            role: toStringOrEmpty(obj.position).trim(),
            startDate: normalizeDate(toStringOrEmpty(obj.startDate)),
            endDate: normalizeDate(toStringOrEmpty(obj.endDate)) || '',
            bullets,
          };
        })
    : [];

  const awards: AwardItem[] = Array.isArray(src.awards)
    ? (src.awards as unknown[])
        .filter((a) => a && typeof a === 'object')
        .map((a, idx) => {
          const obj = a as Record<string, unknown>;
          return {
            id: genId('award'),
            visible: true,
            order: idx,
            title: toStringOrEmpty(obj.title).trim(),
            issuer: toStringOrEmpty(obj.awarder).trim(),
            date: normalizeDate(toStringOrEmpty(obj.date)),
            description:
              typeof obj.summary === 'string'
                ? sanitizeAtsText(obj.summary)
                : undefined,
          };
        })
    : [];

  const publications: PublicationItem[] = Array.isArray(src.publications)
    ? (src.publications as unknown[])
        .filter((p) => p && typeof p === 'object')
        .map((p, idx) => {
          const obj = p as Record<string, unknown>;
          return {
            id: genId('pub'),
            visible: true,
            order: idx,
            title: toStringOrEmpty(obj.name).trim(),
            publisher: toStringOrEmpty(obj.publisher).trim(),
            date: normalizeDate(toStringOrEmpty(obj.releaseDate || obj.date)),
            url: obj.url ? toStringOrEmpty(obj.url).trim() : undefined,
            authors: Array.isArray(obj.authors)
              ? (obj.authors as unknown[])
                  .map((a) => toStringOrEmpty(a).trim())
                  .filter(Boolean)
              : [],
          };
        })
    : [];

  const references: ReferenceItem[] = Array.isArray(src.references)
    ? (src.references as unknown[])
        .filter((r) => r && typeof r === 'object')
        .map((r, idx) => {
          const obj = r as Record<string, unknown>;
          return {
            id: genId('ref'),
            visible: true,
            order: idx,
            name: toStringOrEmpty(obj.name).trim(),
            company: toStringOrEmpty(obj.reference || obj.company).trim(),
            contact: '',
            relationship: toStringOrEmpty(obj.relationship).trim(),
          };
        })
    : [];

  const profiles = basics.profiles;
  const linkedinUrl =
    typeof profiles === 'object' && profiles && Array.isArray(profiles)
      ?
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (profiles as any[]).find((p) =>
            String(p?.network || '')
              .toLowerCase()
              .includes('linkedin')
          )?.url || ''
      : typeof basics.profiles === 'object' && basics.profiles && Array.isArray(basics.profiles)
        ? ''
        : '';

  const githubUrl =
    typeof profiles === 'object' && profiles && Array.isArray(profiles)
      ?
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (profiles as any[]).find((p) =>
            String(p?.network || '')
              .toLowerCase()
              .includes('github')
          )?.url || ''
      : '';

  const portfolioUrl =
    basics.url !== undefined && basics.url !== null
      ? toStringOrEmpty(basics.url).trim()
      : '';

  return {
    contact: {
      fullName: toStringOrEmpty(basics.name).trim(),
      email: toStringOrEmpty(basics.email).trim(),
      phone: toStringOrEmpty(basics.phone).trim(),
      location: [
        toStringOrEmpty(location.city),
        toStringOrEmpty(location.region),
        toStringOrEmpty(location.postalCode),
        toStringOrEmpty(location.countryCode),
      ]
        .filter(Boolean)
        .join(', '),
      linkedinUrl: String(linkedinUrl || ''),
      githubUrl: String(githubUrl || ''),
      portfolioUrl,
    },
    summary: voicedSummary,
    experience,
    projects,
    education,
    skills,
    certifications,
    involvement,
    awards,
    publications,
    references,
  };
}

/** Builds a full ResumeData from an ImportedResume (fills empty sections). */
export function importedResumeToData(imported: ImportedResume): ResumeData {
  const base = emptyResumeData();
  return {
    ...base,
    contact: {
      ...base.contact,
      ...imported.contact,
    },
    summary: {
      text: imported.summary ? sanitizeAtsText(imported.summary) : '',
      visible: true,
    },
    experience: imported.experience,
    projects: imported.projects,
    education: imported.education,
    skills: imported.skills,
    certifications: imported.certifications,
    involvement: imported.involvement,
    awards: imported.awards,
    publications: imported.publications,
    references: imported.references,
  };
}

/** Shared deterministic helper for later import tasks. */
export function normalizedResumeData(imported: ImportedResume): ResumeData {
  return importedResumeToData(imported);
}

/** Parses a JSON Resume string into ResumeData, or null if the input isn't JSON Resume. */
export function parseJsonResumeContent(content: string): ResumeData | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    return null;
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;

  const obj = parsed as Record<string, unknown>;

  const hasAnySection =
    obj.basics ||
    obj.work ||
    obj.education ||
    obj.skills ||
    obj.projects ||
    obj.certificates ||
    obj.awards ||
    obj.publications ||
    obj.volunteer ||
    obj.references;

  if (!hasAnySection) return null;

  const imported = jsonResumeToImported(parsed);
  const data = importedResumeToData(imported);

  const totalItems =
    Boolean(data.contact.fullName) ||
    data.experience.length > 0 ||
    data.skills.length > 0 ||
    data.education.length > 0 ||
    Boolean(data.summary.text);

  return totalItems ? data : null;
}
