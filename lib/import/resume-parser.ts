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
  ContactInfo,
  SectionKey,
} from '@/types/resume';
import { ImportedResume, ImportSourceType } from '@/types/import';
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

const SECTION_HEADERS: Array<{ key: SectionKey; patterns: RegExp[] }> = [
  { key: 'contact', patterns: [/^contact\b/i, /^personal\s+(info|details)/i, /^header\b/i] },
  {
    key: 'summary',
    patterns: [
      /^professional\s+summary/i,
      /^summary\b/i,
      /^profile\b/i,
      /^about\s+me/i,
      /^objective\b/i,
      /^career\s+objective/i,
    ],
  },
  {
    key: 'skills',
    patterns: [
      /^skills/i,
      /^technical\s+skills/i,
      /^core\s+competencies/i,
      /^competencies\b/i,
      /^technologies\b/i,
    ],
  },
  {
    key: 'experience',
    patterns: [
      /^experience\b/i,
      /^work\s+experience\b/i,
      /^employment\s+history/i,
      /^work\s+history/i,
      /^professional\s+experience/i,
    ],
  },
  {
    key: 'projects',
    patterns: [
      /^projects\b/i,
      /^personal\s+projects/i,
      /^side\s+projects/i,
      /^key\s+projects/i,
    ],
  },
  {
    key: 'education',
    patterns: [
      /^education\b/i,
      /^academic\s+background/i,
      /^academics?\b/i,
      /^degrees?\b/i,
    ],
  },
  {
    key: 'certifications',
    patterns: [
      /^certifications?\b/i,
      /^licenses?\b/i,
      /^credentials?\b/i,
      /^certificates?\b/i,
    ],
  },
  {
    key: 'involvement',
    patterns: [
      /^leadership\b/i,
      /^volunteer\b/i,
      /^involvement\b/i,
      /^community\b/i,
      /^extracurricular/i,
    ],
  },
  {
    key: 'awards',
    patterns: [
      /^awards?\b/i,
      /^honors?\b/i,
      /^achievements?\b/i,
      /^recognitions?\b/i,
    ],
  },
  {
    key: 'publications',
    patterns: [
      /^publications?\b/i,
      /^research\b/i,
      /^papers?\b/i,
      /^articles?\b/i,
    ],
  },
  { key: 'references', patterns: [/^references\b/i] },
];

/**
 * Splits raw resume text into named sections via header boundary detection.
 */
export function splitIntoSections(text: string): Array<{ key: SectionKey; raw: string }> {
  const lines = text.split(/\r?\n/);
  const segments: Array<{ key: SectionKey; raw: string }> = [];
  let currentKey: SectionKey = 'contact';
  let currentLines: string[] = [];

  const flush = () => {
    const body = currentLines.join('\n').trim();
    if (body) segments.push({ key: currentKey, raw: body });
    currentLines = [];
  };

  let headerFound = false;
  for (const line of lines) {
    const trimmed = line.trim();
    const match = SECTION_HEADERS.find((h) =>
      h.patterns.some((p) => p.test(trimmed))
    );
    if (match && (trimmed.length <= 60 || headerFound)) {
      flush();
      currentKey = match.key;
      headerFound = true;
      currentLines = [];
    } else {
      currentLines.push(line);
    }
  }
  flush();
  return segments;
}

/**
 * Extracts contact metadata (name, email, phone, URLs, location) from a text block.
 */
export function extractContactInfo(text: string): Partial<ContactInfo> {
  const contact: Partial<ContactInfo> = {};

  const email = text.match(/[\w.+-]+@[\w-]+\.[\w.]+/);
  if (email) contact.email = email[0];

  const phone = text.match(
    /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/
  );
  if (phone) contact.phone = phone[0];

  const linkedin = text.match(/linkedin\.com\/[^\s|,]+/i);
  if (linkedin) contact.linkedinUrl = `https://${linkedin[0].replace(/^https?:\/\//, '')}`;

  const github = text.match(/github\.com\/[^\s|,]+/i);
  if (github) contact.githubUrl = `https://${github[0].replace(/^https?:\/\//, '')}`;

  const portfolio = text.match(
    /(?:https?:\/\/)?(?:www\.)?[a-z0-9-]+\.(?:dev|io|me|tech|site|org|com|net)\b/i
  );
  if (
    portfolio &&
    !portfolio[0].toLowerCase().includes('linkedin') &&
    !portfolio[0].toLowerCase().includes('github')
  ) {
    contact.portfolioUrl = portfolio[0].startsWith('http')
      ? portfolio[0]
      : `https://${portfolio[0]}`;
  }

  const locationMatch = text.match(
    /(?:located\s+in\s+)?([A-Za-z][A-Za-z .'-]+,\s*[A-Za-z .'-]{2,})/
  );
  if (locationMatch) contact.location = locationMatch[1].trim();

  // Name: first non-empty line of the block (if it looks like a name, 2-4 words)
  const firstLine = text.split(/\r?\n/)[0]?.trim() || '';
  const nameTokens = firstLine.split(/\s+/).filter((t) => t && /^[A-Za-z]/.test(t));
  if (
    nameTokens.length >= 2 &&
    nameTokens.length <= 4 &&
    !/@/.test(firstLine) &&
    !/\d/.test(firstLine) &&
    !firstLine.includes('|')
  ) {
    contact.fullName = firstLine;
  }

  return contact;
}

/** Extracts clean bullet lines from raw text, normalizing markers. */
export function extractBullets(text: string): string[] {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const bulletLines = lines.filter((line) => /^[•\-\*▪◦–—]|\d+[\.\)]/.test(line));

  if (bulletLines.length > 0) {
    return bulletLines
      .map((line) => line.replace(/^[•\-\*▪◦–—]|\d+[\.\)]\s*/, '').trim())
      .map((line) => sanitizeAtsText(line))
      .filter((line) => line.length > 2);
  }

  return lines
    .filter(
      (l) =>
        !/^(?:19|20)\d{2}/.test(l) &&
        !/^(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i.test(l) &&
        l.length > 2
    )
    .map((l) => sanitizeAtsText(l));
}

/** Parses an experience section into ordered ExperienceItem entries. */
export function parseExperienceSection(text: string): ExperienceItem[] {
  // Split on role/company headings
  const blocks = text.split(/\r?\n(?=[A-Z][A-Za-z0-9 .&'-]+,\s*[A-Z][A-Za-z0-9 .&'-]+)/);
  const items: ExperienceItem[] = [];

  blocks.forEach((block, idx) => {
    const lines = block.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return;
    const header = lines[0];
    const body = lines.slice(1).join('\n');

    const dateMatch = (header + ' ' + body).match(
      /((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s.,]*\d{4}|(?:19|20)\d{2}(?:-\d{2})?)[\s.-]*(?:-|–|to|\sto|until|till)?[\s.]*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s.,]*\d{4}|(?:19|20)\d{2}(?:-\d{2})?|present|current|now|ongoing)/i
    );
    const startDate = normalizeDate(dateMatch?.[1]);
    const isCurrent = /present|current|now|ongoing/i.test(String(dateMatch?.[2] || ''));
    const endDate = isCurrent ? 'Present' : normalizeDate(dateMatch?.[2]);

    // Clean header of parenthetical date info if present
    const cleanHeader = header.replace(/\s*\([^)]+\)/g, '').trim();

    let role = cleanHeader;
    let company = '';
    const commaIdx = cleanHeader.lastIndexOf(',');
    if (commaIdx > -1) {
      role = cleanHeader.slice(0, commaIdx).trim();
      company = cleanHeader.slice(commaIdx + 1).trim();
    } else if (cleanHeader.includes('|')) {
      const parts = cleanHeader.split('|').map((p) => p.trim());
      role = parts[0];
      company = parts[1] || '';
    }

    items.push({
      id: genId('exp'),
      visible: true,
      order: idx,
      company: company || 'Unknown Company',
      role: role || 'Software Professional',
      startDate,
      endDate,
      current: isCurrent,
      bullets: extractBullets(body),
    });
  });

  return items;
}

/** Parses an education section into EducationItem entries. */
export function parseEducationSection(text: string): EducationItem[] {
  const paragraphs = text.split(/\r?\n\s*\r?\n/);
  const items: EducationItem[] = [];

  paragraphs.forEach((para, idx) => {
    const lines = para.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return;
    const header = lines[0];
    const body = lines.slice(1).join(' ');

    let degree = '';
    let fieldOfStudy = '';
    let institution = '';

    const degreeMatch = header.match(
      /(B\.?S\.?|B\.?A\.?|M\.?S\.?|M\.?B\.?A\.?|M\.?A\.?|P\.?h\.?D\.?|Bachelor(?: of [A-Za-z]+)?|Master(?: of [A-Za-z]+)?|Doctor|High School|Associate)(?=\s|$|,)/i
    );

    if (degreeMatch) {
      degree = degreeMatch[1];
      const rest = header.replace(degreeMatch[0], '').trim();
      const parts = rest.split(',').map((p) => p.trim()).filter(Boolean);
      if (parts.length >= 2) {
        fieldOfStudy = parts[0];
        institution = parts[1];
      } else if (parts.length === 1) {
        // e.g. "Computer Science, MIT" or "MIT"
        institution = parts[0];
      }
    } else {
      institution = header;
    }

    const fullContent = header + ' ' + body;
    const dateMatch = fullContent.match(
      /((?:19|20)\d{2}(?:-\d{2})?)[\s.-]*(?:-|–)?[\s.]*((?:19|20)\d{2}(?:-\d{2})?)/
    );
    const gpaMatch = fullContent.match(/GPA:?\s*([\d.]+)/i) || fullContent.match(/([\d]\.[\d]{1,2})/);
    const honorsMatch = fullContent.match(/([A-Z][a-z]+(?:s)?(?: of)?(?: the)? [A-Z][a-z]+(?:\s+List)?)/g);

    items.push({
      id: genId('edu'),
      visible: true,
      order: idx,
      institution: institution || 'Unknown Institution',
      degree,
      fieldOfStudy,
      startDate: normalizeDate(dateMatch?.[1]),
      endDate: normalizeDate(dateMatch?.[2]),
      gpa: gpaMatch?.[1],
      honors: honorsMatch || undefined,
    });
  });

  return items;
}

/** Parses a skills section into categorized SkillCategory entries. */
export function parseSkillsSection(text: string): SkillCategory[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const items: SkillCategory[] = [];
  let currentCategory: SkillCategory | null = null;
  let order = 0;

  lines.forEach((line) => {
    const separatorMatch = line.match(/^([A-Za-z][A-Za-z &'/-]{1,40}):\s*(.+)$/);
    if (separatorMatch) {
      if (currentCategory) items.push(currentCategory);
      currentCategory = {
        id: genId('skill'),
        visible: true,
        order: order++,
        categoryName: separatorMatch[1].trim(),
        skills: separatorMatch[2]
          .split(/,|;|\|/)
          .map((s) => s.trim())
          .filter(Boolean),
      };
    } else {
      const skillList = line
        .split(/,|;|\|/)
        .map((s) => s.trim())
        .filter(Boolean);
      if (skillList.length > 0) {
        if (!currentCategory) {
          currentCategory = {
            id: genId('skill'),
            visible: true,
            order: order++,
            categoryName: 'Skills',
            skills: [],
          };
        }
        currentCategory.skills.push(...skillList);
      }
    }
  });

  if (currentCategory) items.push(currentCategory);
  return items;
}

/** Parses a projects section into ProjectItem entries. */
export function parseProjectsSection(text: string): ProjectItem[] {
  const items: ProjectItem[] = [];
  let project = -1;

  text.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    if (/^[A-Z][A-Za-z0-9 .&'-]{2,50}(\s*\||:\s|\s*\()/.test(trimmed)) {
      project++;
      const [namePart, rest] = trimmed.split(/\s*\|\s*/);
      const dateMatch = trimmed.match(
        /((?:19|20)\d{2}(?:-\d{2})?[\s.-]*-[\s.]*(?:19|20)\d{2}(?:-\d{2})?|(?:19|20)\d{2})/
      );
      items.push({
        id: genId('proj'),
        visible: true,
        order: project,
        name: namePart.replace(/\s*\([^)]+\)/, '').trim(),
        link: rest && /^https?:\/\//i.test(rest) ? rest : undefined,
        startDate: dateMatch ? normalizeDate(dateMatch[1].split('-')[0]) : undefined,
        endDate: dateMatch ? normalizeDate(dateMatch[1].split('-')[1]) : undefined,
        technologies: [],
        bullets: [],
      });
    } else if (items[project]) {
      const extracted = extractBullets(trimmed);
      if (extracted.length > 0) {
        items[project].bullets.push(...extracted);
      }
    }
  });

  return items.filter((p) => p.name);
}

/** Parses certifications section. */
export function parseCertificationsSection(text: string): CertificationItem[] {
  const items: CertificationItem[] = [];
  text.split(/\r?\n/).forEach((line, idx) => {
    if (!line.trim()) return;
    const [name, issuerAndDate] = line.split(/\s*[-|]\s*/);
    const issuerMatch = issuerAndDate?.match(
      /([A-Z][A-Za-z .&'-]+)(?:\s*[,(]\s*)?((?:19|20)\d{2})?/
    );
    items.push({
      id: genId('cert'),
      visible: true,
      order: idx,
      name: (name || line).trim(),
      issuer: issuerMatch?.[1]?.trim() || '',
      issueDate: normalizeDate(issuerMatch?.[2]),
    });
  });
  return items.filter((c) => c.name);
}

/** Parses involvement/volunteer section. */
export function parseInvolvementSection(text: string): InvolvementItem[] {
  const items: InvolvementItem[] = [];
  text.split(/\r?\n(?=[A-Z][A-Za-z0-9 .&'-]+)/).forEach((block, idx) => {
    const lines = block.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (!lines.length) return;
    const header = lines[0];
    const parts = header.split(/\s*[,|]\s*/);
    const organization = parts[0] || '';
    const role = parts[1] || '';
    const dateMatch = block.match(
      /((?:19|20)\d{2})[\s.-]*(?:-|–)?[\s.]*((?:19|20)\d{2}|present|current)/i
    );
    items.push({
      id: genId('inv'),
      visible: true,
      order: idx,
      organization,
      role,
      startDate: normalizeDate(dateMatch?.[1]),
      endDate: normalizeDate(dateMatch?.[2]),
      bullets: extractBullets(block),
    });
  });
  return items.filter((i) => i.organization);
}

/** Parses awards section. */
export function parseAwardsSection(text: string): AwardItem[] {
  const items: AwardItem[] = [];
  text.split(/\r?\n/).forEach((line, idx) => {
    if (!line.trim()) return;
    const dateMatch = line.match(/((?:19|20)\d{2})/);
    const [title, issuer] = line
      .replace(/\s*[-|(]\s*(?:19|20)\d{2}\s*[)]?/, '')
      .split(/\s*[,|-]\s*/);
    items.push({
      id: genId('award'),
      visible: true,
      order: idx,
      title: (title || line).trim(),
      issuer: issuer || '',
      date: normalizeDate(dateMatch?.[1]),
    });
  });
  return items.filter((a) => a.title);
}

/**
 * Parses a plain-text or markdown resume into an ImportedResume using only
 * deterministic heuristics.
 */
export function parsePlainTextResume(text: string): ImportedResume {
  const sections = splitIntoSections(text);
  const allText = text;

  const contactBlock =
    sections.find((s) => s.key === 'contact')?.raw ||
    allText.split(/\r?\n/).slice(0, 6).join('\n');
  const contact = extractContactInfo(contactBlock);

  const summaryBlock = sections.find((s) => s.key === 'summary')?.raw || '';
  const summary = summaryBlock.trim()
    ? sanitizeAtsText(
        summaryBlock.replace(/^[0-9]+[\.\)]\s*/, '').replace(/\r?\n/g, ' ')
      )
    : '';

  const experience = parseExperienceSection(
    sections.find((s) => s.key === 'experience')?.raw || ''
  );
  const education = parseEducationSection(
    sections.find((s) => s.key === 'education')?.raw || ''
  );
  const skills = parseSkillsSection(
    sections.find((s) => s.key === 'skills')?.raw || ''
  );
  const projects = parseProjectsSection(
    sections.find((s) => s.key === 'projects')?.raw || ''
  );
  const certifications = parseCertificationsSection(
    sections.find((s) => s.key === 'certifications')?.raw || ''
  );
  const involvement = parseInvolvementSection(
    sections.find((s) => s.key === 'involvement')?.raw || ''
  );
  const awards = parseAwardsSection(
    sections.find((s) => s.key === 'awards')?.raw || ''
  );

  return {
    contact,
    summary,
    experience,
    education,
    skills,
    projects,
    certifications,
    involvement,
    awards,
    publications: [],
    references: [],
  };
}

/** Parses arbitrary pasted plain-text / markdown into a full ResumeData. */
export function parseTextResumeContent(content: string): ResumeData {
  const imported = parsePlainTextResume(content);
  return importedResumeToData(imported);
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

export interface ParsedFileResult {
  data: ResumeData;
  title: string;
  sourceType: ImportSourceType;
}

function fileNameTitle(name: string): string {
  const base = name.replace(/\.[^/.]+$/, '');
  return base
    .split(/[-_]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .filter(Boolean)
    .join(' ');
}

async function readAsText(file: File): Promise<string> {
  if (typeof file.text === 'function') {
    return file.text();
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

/** Extracts raw text from a supported file type using client-side readers. */
export async function extractTextFromFile(file: File): Promise<string> {
  const name = file.name.toLowerCase();

  if (
    name.endsWith('.json') ||
    name.endsWith('.txt') ||
    name.endsWith('.md') ||
    name.endsWith('.csv')
  ) {
    return readAsText(file);
  }

  if (
    name.endsWith('.docx') ||
    file.type ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    const mammoth = await import('mammoth');
    const buffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer: buffer });
    return result.value || '';
  }

  if (name.endsWith('.pdf') || file.type === 'application/pdf') {
    const pdfjs = await import('pdfjs-dist');
    const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() })
      .promise;
    const pages: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      pages.push(content.items.map((it: any) => it.str || '').join(' '));
    }
    return pages.join('\n\n');
  }

  throw new Error(
    `Unsupported file type "${file.name}". Please upload a JSON, PDF, DOCX, TXT, or Markdown resume.`
  );
}

/** Ingests an uploaded file, dispatching to JSON-Resume or plain-text parsing. */
export async function parseImportedFile(file: File): Promise<ParsedFileResult> {
  const rawText = await extractTextFromFile(file);
  const lower = file.name.toLowerCase();
  const sourceType: ImportSourceType = lower.endsWith('.json')
    ? 'json'
    : lower.endsWith('.pdf')
    ? 'pdf'
    : lower.endsWith('.docx')
    ? 'docx'
    : 'text';

  if (sourceType === 'json') {
    const data = parseJsonResumeContent(rawText);
    if (data) {
      return { data, title: fileNameTitle(file.name), sourceType };
    }
    // Not JSON Resume → fall through to heuristic text parse
  }

  return {
    data: parseTextResumeContent(rawText),
    title: fileNameTitle(file.name),
    sourceType,
  };
}
