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

  const headerMatch = (trimmed: string): { key: SectionKey; prefixLen: number } | null => {
    for (const h of SECTION_HEADERS) {
      for (const p of h.patterns) {
        const m = trimmed.match(p);
        if (m?.[0]) return { key: h.key, prefixLen: m[0].length };
      }
    }
    return null;
  };

  for (const line of lines) {
    const trimmed = line.trim();
    const match = headerMatch(trimmed);

    if (match) {
      flush();
      currentKey = match.key;
      currentLines = [];

      const remainder = trimmed
        .slice(match.prefixLen)
        .replace(/^[:\-–—]\s*/, '')
        .trim();

      if (remainder) currentLines.push(remainder);
      continue;
    }

    currentLines.push(line);
  }

  flush();
  return segments;
}

/** Validates whether a candidate string is a plausible telephone / mobile number. */
export function isValidPhone(candidate: string): boolean {
  if (!candidate || typeof candidate !== 'string') return false;
  // Strip leading non-digit/plus and trailing non-digit/closing-parenthesis
  const stripped = candidate.trim().replace(/^[^\d+]+|[^\d)]+$/g, '');
  const digits = (stripped.match(/\d/g) || []).join('');

  // Phone numbers usually have between 7 and 16 digits (E.164 max is 15 + leading 0/prefix)
  if (digits.length < 7 || digits.length > 16) return false;

  // Check for repeating identical digits like "000000000" or "111111111"
  if (/^(\d)\1+$/.test(digits)) return false;

  // Exclude date ranges like "2018 - 2024", "2018-03 - 2024-01"
  if (
    /^(?:19|20)\d{2}(?:[-/.](?:0?[1-9]|1[0-2]))?\s*[-–—/]\s*(?:19|20)\d{2}(?:[-/.](?:0?[1-9]|1[0-2]))?$/.test(
      stripped
    )
  )
    return false;

  // Exclude single ISO / date patterns like "2020-05-12" or "12/05/2020"
  if (/^(?:19|20)\d{2}[-/.](?:0?[1-9]|1[0-2])[-/.](?:0?[1-9]|[12]\d|3[01])$/.test(stripped)) return false;
  if (/^(?:0?[1-9]|[12]\d|3[01])[-/.](?:0?[1-9]|1[0-2])[-/.](?:19|20)\d{2}$/.test(stripped)) return false;

  // Exclude strings containing month names
  if (/\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\b/i.test(candidate)) return false;

  return true;
}

/** Extracts a phone or mobile number from raw resume text using multi-pattern heuristics. */
export function extractPhoneNumber(text: string): string | undefined {
  if (!text || typeof text !== 'string') return undefined;

  // 1. Explicitly labeled phone / mobile prefixes: "Phone:", "Mobile:", "Mob:", "Tel:", "Cell:", "WhatsApp:", "Contact No:"
  const labeledRegex = /(?:(?:mobile|phone|tel(?:ephone)?|cell(?:ular)?|mob|contact|ph|whatsapp)(?:\s*(?:no|num|number|#))?)\s*[:：\-–—]?\s*([+\d\s()./-]{7,30})/gi;
  let labeledMatch: RegExpExecArray | null;
  while ((labeledMatch = labeledRegex.exec(text)) !== null) {
    const rawCandidate = labeledMatch[1];
    const trimmed = rawCandidate.split(/[\r\n|,;]|(?:\s{2,})|(?=[a-zA-Z])/)[0]?.trim();
    if (trimmed && isValidPhone(trimmed)) {
      const sanitized = trimmed.replace(/^[^\d+(]+|[^\d)]+$/g, '').trim();
      if (sanitized && isValidPhone(sanitized)) return sanitized;
    }
  }

  // 2. International phone numbers starting with + or 00 (e.g. +880 1712-345678, +1 (555) 013-2478, +44 20 7946 0919, +91 98765 43210)
  const intlRegex = /(?:\+|00)\d{1,4}[-.\s]?(?:\(?\d{1,5}\)?[-.\s]?){1,5}\d{2,6}/g;
  let intlMatch: RegExpExecArray | null;
  while ((intlMatch = intlRegex.exec(text)) !== null) {
    const candidate = intlMatch[0].trim();
    if (isValidPhone(candidate)) {
      return candidate.replace(/^[^\d+(]+|[^\d)]+$/g, '').trim();
    }
  }

  // 3. Parenthesized area code (e.g. (555) 013-2478, (020) 7946-0919)
  const parenRegex = /\(\d{2,5}\)[-.\s]?\d{2,5}[-.\s]?\d{3,5}/g;
  let parenMatch: RegExpExecArray | null;
  while ((parenMatch = parenRegex.exec(text)) !== null) {
    const candidate = parenMatch[0].trim();
    if (isValidPhone(candidate)) return candidate;
  }

  // 4. Standard grouped national numbers (e.g. 555-013-2478, 0171-234-5678)
  const groupedRegex = /\b\d{2,5}[-.\s]\d{3,4}[-.\s]\d{3,5}\b/g;
  let groupedMatch: RegExpExecArray | null;
  while ((groupedMatch = groupedRegex.exec(text)) !== null) {
    const candidate = groupedMatch[0].trim();
    if (isValidPhone(candidate)) return candidate;
  }

  // 5. Continuous 10-11 digit sequence (e.g. 01712345678, 07911123456, 9876543210)
  const continuousRegex = /\b(?:0\d{9,10}|[6-9]\d{9})\b/g;
  let contMatch: RegExpExecArray | null;
  while ((contMatch = continuousRegex.exec(text)) !== null) {
    const candidate = contMatch[0].trim();
    if (isValidPhone(candidate)) return candidate;
  }

  return undefined;
}

/**
 * Extracts contact metadata (name, email, phone, URLs, location) from a text block.
 */
export function extractContactInfo(text: string): Partial<ContactInfo> {
  const contact: Partial<ContactInfo> = {};

  const email = text.match(/[\w.+-]+@[\w-]+\.[\w.]+/);
  if (email) contact.email = email[0];

  const phone = extractPhoneNumber(text);
  if (phone) contact.phone = phone;

  const linkedin = text.match(/linkedin\.com\/[^\s|,]+/i);
  if (linkedin) contact.linkedinUrl = `https://${linkedin[0].replace(/^https?:\/\//, '')}`;

  const github = text.match(/github\.com\/[^\s|,]+/i);
  if (github) contact.githubUrl = `https://${github[0].replace(/^https?:\/\//, '')}`;

  const labeledUrlMatch = text.match(
    /(?:\b(?:website|portfolio|blog|personal\s+site|homepage)\b|\blink\b|\bsite\b|\bweb\b)\s*[:：\-–—]?\s*(https?:\/\/[^\s|,]+|[a-z0-9-]+\.[a-z]{2,}(?:\/[^\s|,]*)?)/i
  );
  if (labeledUrlMatch) {
    const urlCand = labeledUrlMatch[1].trim();
    if (!/linkedin\.com|github\.com/i.test(urlCand) && !urlCand.includes('@')) {
      contact.portfolioUrl = urlCand.startsWith('http') ? urlCand : `https://${urlCand}`;
    }
  }

  if (!contact.portfolioUrl) {
    const sanitizedForPortfolio = text
      .replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, '')
      .replace(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/[^\s|,]+/gi, '')
      .replace(/(?:https?:\/\/)?(?:www\.)?github\.com\/[^\s|,]+/gi, '');

    const portfolioMatches = sanitizedForPortfolio.match(
      /(?:https?:\/\/)?(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:dev|io|me|tech|site|org|com|net|app|co|design|info|online)\b(?:\/[^\s|,]*)?/gi
    );
    if (portfolioMatches) {
      for (const candidate of portfolioMatches) {
        const lower = candidate.toLowerCase();
        if (
          !lower.includes('linkedin') &&
          !lower.includes('github') &&
          !lower.includes('@')
        ) {
          contact.portfolioUrl = candidate.startsWith('http')
            ? candidate
            : `https://${candidate}`;
          break;
        }
      }
    }
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

const DEGREE_REGEX =
  /(?:B\.?S\.?c?\.?|B\.?A\.?|B\.?Tech\.?|B\.?E\.?|B\.?Eng\.?|B\.?Com\.?|B\.?B\.?A\.?|BBA|BCA|B\.?Ed\.?|Bachelor(?:'s)?(?: of [A-Za-z &]+)?|M\.?S\.?c?\.?|M\.?A\.?|M\.?B\.?A\.?|M\.?Tech\.?|M\.?E\.?|M\.?Eng\.?|M\.?Phil\.?|MCA|M\.?Ed\.?|Master(?:'s)?(?: of [A-Za-z &]+)?|P\.?h\.?D\.?|Doctor(?: of Philosophy)?|Doctorate|Associate(?:'s)?(?: of [A-Za-z &]+)?|Associate Degree|A\.?A\.?|A\.?S\.?|Postgraduate Diploma|PG Diploma|Advanced Diploma|Diploma|High School Diploma|Higher Secondary|Secondary School Certificate|SSC|HSC|A-Levels|O-Levels|International Baccalaureate|IB Diploma|Matriculation|GED)(?=\s|$|,|:|\))/i;

const INSTITUTION_KEYWORD_REGEX =
  /(?:University|College|Institute|School|Academy|Polytechnic|Conservatory|Faculty|Campus|MIT|Stanford|Harvard|Oxford|Cambridge|Berkeley|UCLA|NIT|IIT)\b/i;

function extractHonorsFromText(text: string): string[] | undefined {
  const honorsList: string[] = [];
  const honorsRegex =
    /(?:Dean'?s\s+(?:List|Honor\s+Roll)|President'?s\s+List|Chancellor'?s\s+List|(?:Summa\s+|Magna\s+)?Cum\s+Laude|Distinction(?:\s+in\s+[A-Za-z &]+)?|Honors(?:\s+in\s+[A-Za-z &]+)?|First\s+Class(?:\s+with\s+Distinction|\s+Honours)?|Valedictorian|Salutatorian|Academic\s+Excellence)/gi;

  const matches = text.match(honorsRegex);
  if (matches) {
    matches.forEach((m) => {
      const trimmed = m.trim();
      if (trimmed && !honorsList.includes(trimmed)) {
        honorsList.push(trimmed);
      }
    });
  }
  return honorsList.length > 0 ? honorsList : undefined;
}

function extractDegreeAndMajor(str: string): { degree: string; fieldOfStudy: string } {
  const cleaned = str.trim();

  const majorPatterns = [
    /\s+(?:in|major(?:\s+in|:)?|concentration(?:\s+in)?)\s+(.+)$/i,
    /\s*[-–—|]\s*(.+)$/,
  ];

  for (const pat of majorPatterns) {
    const match = cleaned.match(pat);
    if (match && match.index !== undefined) {
      const majorPart = match[1].trim();
      const degPart = cleaned.slice(0, match.index).trim();
      if (degPart) {
        const degMatch = degPart.match(DEGREE_REGEX);
        if (degMatch) {
          return {
            degree: degMatch[0].trim(),
            fieldOfStudy: majorPart.replace(/^(?:in|major(?:\s+in|:)?|concentration(?:\s+in)?)\s+/i, '').trim(),
          };
        }
      }
    }
  }

  const degMatch = cleaned.match(DEGREE_REGEX);
  if (degMatch) {
    const deg = degMatch[0].trim();
    let rest = cleaned.replace(degMatch[0], '').trim();
    rest = rest.replace(/^(?:in\s+|,|-|–|—|:)\s*/i, '').trim();
    return {
      degree: deg,
      fieldOfStudy: rest,
    };
  }

  return { degree: '', fieldOfStudy: '' };
}

function chunkEducationLines(text: string): string[][] {
  const rawLines = text.split(/\r?\n/);
  const chunks: string[][] = [];
  let currentChunk: string[] = [];

  for (const rawLine of rawLines) {
    const line = rawLine.trim();
    if (!line) {
      if (currentChunk.length > 0) {
        chunks.push(currentChunk);
        currentChunk = [];
      }
      continue;
    }

    if (currentChunk.length > 0) {
      const currentChunkText = currentChunk.join(' ');
      const currentHasDegree = DEGREE_REGEX.test(currentChunkText);
      const currentHasInstitution =
        INSTITUTION_KEYWORD_REGEX.test(currentChunkText) || currentChunk.length >= 2;
      const currentHasDate = /(?:19|20)\d{2}/.test(currentChunkText);

      const lineHasDegree = DEGREE_REGEX.test(line);
      const lineHasInstitution = INSTITUTION_KEYWORD_REGEX.test(line);

      const startsWithNewDegree = lineHasDegree && currentHasDegree;
      const currentIsComplete = currentHasDegree && (currentHasInstitution || currentHasDate);

      if (startsWithNewDegree || (currentIsComplete && (lineHasDegree || lineHasInstitution))) {
        chunks.push(currentChunk);
        currentChunk = [];
      }
    }

    currentChunk.push(line);
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }

  return chunks;
}

/** Parses an education section into EducationItem entries. */
export function parseEducationSection(text: string): EducationItem[] {
  const chunks = chunkEducationLines(text);
  const items: EducationItem[] = [];

  chunks.forEach((chunk, idx) => {
    if (chunk.length === 0) return;

    const fullChunk = chunk.join(' ');

    const dateRangeMatch = fullChunk.match(
      /((?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*[\s,]+)?(?:19|20)\d{2}(?:-\d{2})?)\s*(?:-|–|—|to)\s*((?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*[\s,]+)?(?:19|20)\d{2}(?:-\d{2})?|Present|Current|Now)/i
    );
    let startDate = '';
    let endDate = '';
    if (dateRangeMatch) {
      startDate = normalizeDate(dateRangeMatch[1]);
      endDate = /present|current|now/i.test(dateRangeMatch[2]) ? 'Present' : normalizeDate(dateRangeMatch[2]);
    } else {
      const singleDateMatch = fullChunk.match(/\b((?:19|20)\d{2}(?:-\d{2})?)\b/);
      if (singleDateMatch) {
        startDate = normalizeDate(singleDateMatch[1]);
      }
    }

    const gpaMatch =
      fullChunk.match(/(?:(?:Cumulative\s+)?(?:C?GPA|Grade|Score)[\s:]+)([0-9]\.[0-9]{1,2}(?:\s*\/\s*[0-9]\.[0-9]{1,2})?)/i) ||
      fullChunk.match(/\b([0-4]\.[0-9]{1,2}\s*\/\s*[0-4]\.[0-9]{1,2})\b/) ||
      fullChunk.match(/(?:GPA|CGPA)[:\s]+([\d.]+)/i);
    const gpa = gpaMatch ? gpaMatch[1].replace(/\s+/g, '') : undefined;

    const honors = extractHonorsFromText(fullChunk);

    let degree = '';
    let fieldOfStudy = '';
    let institution = '';

    if (chunk.length === 1) {
      const parts = chunk[0].split(/,|\|/).map((p) => p.trim()).filter(Boolean);
      for (const part of parts) {
        const isDatePart = /^(?:(?:19|20)\d{2}|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i.test(part);
        const isGpaPart = /^(?:GPA|CGPA|Grade|Score)/i.test(part);
        if (isDatePart || isGpaPart) continue;

        if (!degree && DEGREE_REGEX.test(part)) {
          const extracted = extractDegreeAndMajor(part);
          degree = extracted.degree;
          if (extracted.fieldOfStudy) fieldOfStudy = extracted.fieldOfStudy;
        } else if (!institution) {
          institution = part
            .replace(/(?:(?:19|20)\d{2}.*)/, '')
            .replace(/(?:GPA|CGPA|Grade).*$/i, '')
            .trim();
        } else if (!fieldOfStudy) {
          fieldOfStudy = part;
        }
      }
    } else {
      for (const line of chunk) {
        const isPureDate = /^(?:(?:19|20)\d{2}(?:-\d{2})?[\s.-]*(?:-|–|—|to)?[\s.]*(?:(?:19|20)\d{2}(?:-\d{2})?|Present|Current)?)$/i.test(line);
        const isGpaLine = /^(?:GPA|CGPA|Grade|Score)/i.test(line);
        const isHonorsLine = /^(?:Dean'?s|President'?s|Chancellor'?s|Cum Laude|Magna|Summa|Distinction|Honors|First Class)/i.test(line);
        if (isPureDate || isGpaLine || isHonorsLine) continue;

        if (!degree && DEGREE_REGEX.test(line)) {
          const extracted = extractDegreeAndMajor(line);
          degree = extracted.degree;
          if (extracted.fieldOfStudy) fieldOfStudy = extracted.fieldOfStudy;
        } else if (!institution) {
          const instCandidate = line
            .replace(/(?:(?:19|20)\d{2}.*)/, '')
            .replace(/(?:GPA|CGPA|Grade).*$/i, '')
            .replace(/\|.*$/, '')
            .trim();
          if (instCandidate) institution = instCandidate;
        } else if (!fieldOfStudy) {
          fieldOfStudy = line.trim();
        }
      }
    }

    items.push({
      id: genId('edu'),
      visible: true,
      order: idx,
      institution: institution || 'Unknown Institution',
      degree,
      fieldOfStudy,
      startDate,
      endDate,
      gpa,
      honors,
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
            company: toStringOrEmpty(obj.company || obj.name).trim() || 'Unknown Company',
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
          const institution =
            toStringOrEmpty(obj.institution).trim() ||
            toStringOrEmpty(obj.school).trim() ||
            toStringOrEmpty(obj.university).trim() ||
            toStringOrEmpty(obj.college).trim() ||
            toStringOrEmpty(obj.academy).trim() ||
            toStringOrEmpty(obj.name).trim();

          const degree =
            toStringOrEmpty(obj.studyType).trim() ||
            toStringOrEmpty(obj.degree).trim() ||
            toStringOrEmpty(obj.qualification).trim() ||
            toStringOrEmpty(obj.diploma).trim() ||
            toStringOrEmpty(obj.certificate).trim();

          const fieldOfStudy =
            toStringOrEmpty(obj.area).trim() ||
            toStringOrEmpty(obj.fieldOfStudy).trim() ||
            toStringOrEmpty(obj.major).trim() ||
            toStringOrEmpty(obj.discipline).trim() ||
            toStringOrEmpty(obj.subject).trim() ||
            toStringOrEmpty(obj.branch).trim();

          const rawGpa =
            obj.gpa !== undefined && obj.gpa !== null
              ? toStringOrEmpty(obj.gpa).trim()
              : obj.score !== undefined && obj.score !== null
                ? toStringOrEmpty(obj.score).trim()
                : obj.cgpa !== undefined && obj.cgpa !== null
                  ? toStringOrEmpty(obj.cgpa).trim()
                  : obj.grade !== undefined && obj.grade !== null
                    ? toStringOrEmpty(obj.grade).trim()
                    : undefined;

          let honorsList: string[] | undefined = undefined;
          if (Array.isArray(obj.honors)) {
            honorsList = (obj.honors as unknown[])
              .map((h) => toStringOrEmpty(h).trim())
              .filter(Boolean);
          } else if (typeof obj.honors === 'string' && obj.honors.trim()) {
            honorsList = [obj.honors.trim()];
          }

          return {
            id: genId('edu'),
            visible: true,
            order: idx,
            institution: institution || 'Unknown Institution',
            degree,
            fieldOfStudy,
            startDate: normalizeDate(toStringOrEmpty(obj.startDate)),
            endDate: normalizeDate(toStringOrEmpty(obj.endDate)),
            gpa: rawGpa || undefined,
            honors: honorsList && honorsList.length > 0 ? honorsList : undefined,
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

export function fileNameTitle(name: string): string {
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

export interface ExtractedFileResult {
  text: string;
  sourceType: 'json' | 'pdf' | 'docx' | 'text';
  fileName: string;
}

/** Extracts text from DOCX ArrayBuffer via mammoth. */
export async function extractDocxText(buffer: ArrayBuffer): Promise<string> {
  const mammoth = await import('mammoth');
  const result = await mammoth.extractRawText({ arrayBuffer: buffer });
  return result.value || '';
}

/** Extracts text from PDF ArrayBuffer preserving coordinates and line layout via pdfjs-dist. */
export async function extractPdfText(buffer: ArrayBuffer): Promise<string> {
  const pdfjs = await import('pdfjs-dist');
  if (typeof window !== 'undefined') {
    pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
  }

  const pdf = await pdfjs.getDocument({ data: buffer }).promise;

  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const items: any[] = Array.isArray((content as any)?.items)
      ? ((content as any).items as any[])
      : [];

    // pdfjs textContent loses layout when joined raw. Rebuild per-line
    // ordering using transform coordinates: e=x (index 4), f=y (index 5).
    const lineMap = new Map<number, Array<{ x: number; str: string }>>();

    for (const it of items) {
      const str = typeof it?.str === 'string' ? it.str : '';
      if (!str.trim()) continue;

      const transform = it?.transform;
      if (!Array.isArray(transform) || transform.length < 6) continue;

      const x = transform[4];
      const y = transform[5];
      if (typeof x !== 'number' || typeof y !== 'number') continue;

      const key = Math.round(y);
      const bucket = lineMap.get(key) || [];
      bucket.push({ x, str: str.trim() });
      lineMap.set(key, bucket);
    }

    if (lineMap.size > 0) {
      const yKeys = Array.from(lineMap.keys()).sort((a, b) => b - a);
      const lines = yKeys
        .map((key) => {
          const bucket = lineMap.get(key) || [];
          bucket.sort((a, b) => a.x - b.x);
          return bucket
            .map((b) => b.str)
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();
        })
        .filter((l) => l.length > 0);

      pages.push(lines.join('\n'));
    } else {
      pages.push(
        items
          .map((it: any) => (typeof it?.str === 'string' ? it.str : ''))
          .filter(Boolean)
          .join(' ')
      );
    }
  }

  return pages.join('\n\n');
}

/** Extracts raw text from a supported file type using client-side readers. */
export async function extractTextFromFile(
  file: File
): Promise<{ text: string; sourceType: 'json' | 'pdf' | 'docx' | 'text'; fileName: string }> {
  const fileName = file.name || 'resume';
  const lower = fileName.toLowerCase();

  if (lower.endsWith('.json') || file.type === 'application/json') {
    const text = await readAsText(file);
    return { text, sourceType: 'json', fileName };
  }

  if (
    lower.endsWith('.docx') ||
    file.type ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    file.type.includes('wordprocessingml')
  ) {
    const buffer = await file.arrayBuffer();
    const text = await extractDocxText(buffer);
    return { text, sourceType: 'docx', fileName };
  }

  if (lower.endsWith('.pdf') || file.type === 'application/pdf') {
    const buffer = await file.arrayBuffer();
    const text = await extractPdfText(buffer);
    return { text, sourceType: 'pdf', fileName };
  }

  if (
    lower.endsWith('.txt') ||
    lower.endsWith('.md') ||
    lower.endsWith('.csv') ||
    file.type.startsWith('text/') ||
    !file.type
  ) {
    const text = await readAsText(file);
    return { text, sourceType: 'text', fileName };
  }

  if (
    lower.endsWith('.exe') ||
    lower.endsWith('.bin') ||
    file.type.startsWith('application/x-msdownload') ||
    file.type.startsWith('application/x-')
  ) {
    throw new Error(
      `Unsupported file type "${fileName}". Please upload a JSON, PDF, DOCX, TXT, or Markdown resume.`
    );
  }

  const text = await readAsText(file);
  return { text, sourceType: 'text', fileName };
}

/** Ingests an uploaded file, dispatching to JSON-Resume or plain-text parsing. */
export async function parseImportedFile(file: File): Promise<ParsedFileResult> {
  const { text: rawText, sourceType } = await extractTextFromFile(file);

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
