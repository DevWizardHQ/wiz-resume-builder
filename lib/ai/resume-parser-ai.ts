import {
  AiClientOptions,
  callOllamaGenerateApi,
  callOpenAiCompatibleApi,
  resolveAiProviderConfig,
} from '@/lib/ai/local-client';
import {
  ImportedResume,
  ParseResumeResult,
} from '@/types/import';
import { genId } from '@/lib/import/id';
import {
  importedResumeToData,
  parsePlainTextResume,
  normalizeDate,
  sanitizeAtsText,
} from '@/lib/import/resume-parser';
import { ResumeData, SectionKey } from '@/types/resume';

/** Builds the strict structured-JSON extraction prompt for an LLM. */
export function buildResumeParsePrompt(rawText: string): string {
  return `You are a senior ATS parsing engineer. Extract structured resume data from the raw text below into the JSON Resume schema (https://jsonresume.org/schema).

Rules:
1. Map fields to these JSON Resume keys: basics.name, basics.email, basics.phone, basics.location.city, basics.location.region, basics.summary, work[].company, work[].position, work[].startDate, work[].endDate, work[].highlights, education[].institution, education[].area, education[].studyType, education[].startDate, education[].endDate, skills[].name, skills[].keywords, projects[].name, projects[].url, certificates[].name, certificates[].issuer, awards[].title, awards[].awarder, volunteer[].organization, volunteer[].position, publications[].name, publications[].publisher.
2. Normalize all dates to YYYY-MM or YYYY. Use endDate null for current roles.
3. Keep every bullet in third-person voice: rephrase leading "I", "my", "we" — do NOT use "I", "me", "my" — NEVER output them.
4. Preserve quantifiable metrics exactly (percentages, USD amounts, scale numbers).
5. Output ONLY the valid JSON Resume object. Do NOT include markdown code fences, commentary, or explanatory text.

${rawText}
`;
}

/**
 * Merges an LLM's structured JSON output over the heuristic fallback.
 * For each section, the LLM's entries win when present; otherwise the
 * deterministic heuristic result is retained, so nothing is ever lost.
 */
export function extractStructuredResume(
  rawJsonText: string,
  fallback: ImportedResume
): ImportedResume {
  let parsed: any;
  try {
    let clean = rawJsonText.trim();
    const fenced = clean.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (fenced?.[1]) clean = fenced[1].trim();
    parsed = JSON.parse(clean);
  } catch {
    return fallback;
  }
  if (!parsed || typeof parsed !== 'object') return fallback;

  const basics = parsed.basics && typeof parsed.basics === 'object' ? parsed.basics : {};
  const loc = basics.location && typeof basics.location === 'object' ? basics.location : {};

  const result: ImportedResume = {
    contact: {
      fullName: basics.name || fallback.contact.fullName || '',
      email: basics.email || fallback.contact.email || '',
      phone: basics.phone || fallback.contact.phone || '',
      location:
        [loc.city, loc.region, loc.postalCode, loc.countryCode].filter(Boolean).join(', ') ||
        fallback.contact.location ||
        '',
      linkedinUrl: fallback.contact.linkedinUrl,
      githubUrl: fallback.contact.githubUrl,
      portfolioUrl: basics.url || fallback.contact.portfolioUrl || '',
    },
    summary: basics.summary || fallback.summary || '',
    experience: Array.isArray(parsed.work) && parsed.work.length > 0
      ? parsed.work.map((w: any, idx: number) => ({
          id: genId('exp'),
          visible: true,
          order: idx,
          company: String(w.company || '').trim(),
          role: String(w.position || '').trim(),
          startDate: normalizeDate(w.startDate),
          endDate: normalizeDate(w.endDate) || (w.endDate ? 'Present' : ''),
          current: !w.endDate || /present|current/i.test(String(w.endDate)),
          bullets: Array.isArray(w.highlights)
            ? w.highlights.map((h: any) => sanitizeAtsText(String(h || ''))).filter(Boolean)
            : [],
        }))
      : fallback.experience,
    education: Array.isArray(parsed.education) && parsed.education.length > 0
      ? parsed.education.map((e: any, idx: number) => ({
          id: genId('edu'),
          visible: true,
          order: idx,
          institution: String(e.institution || '').trim(),
          degree: String(e.studyType || '').trim(),
          fieldOfStudy: String(e.area || '').trim(),
          startDate: normalizeDate(e.startDate),
          endDate: normalizeDate(e.endDate),
          gpa: e.gpa ? String(e.gpa).trim() : undefined,
        }))
      : fallback.education,
    skills: Array.isArray(parsed.skills) && parsed.skills.length > 0
      ? parsed.skills.map((s: any, idx: number) => ({
          id: genId('skill'),
          visible: true,
          order: idx,
          categoryName: String(s.name || 'Skills').trim(),
          skills: Array.isArray(s.keywords)
            ? s.keywords.map((k: any) => String(k).trim()).filter(Boolean)
            : [],
        }))
      : fallback.skills,
    projects: Array.isArray(parsed.projects) && parsed.projects.length > 0
      ? parsed.projects.map((p: any, idx: number) => ({
          id: genId('proj'),
          visible: true,
          order: idx,
          name: String(p.name || '').trim(),
          role: undefined,
          link: p.url ? String(p.url).trim() : undefined,
          startDate: normalizeDate(p.startDate) || undefined,
          endDate: normalizeDate(p.endDate) || undefined,
          technologies: Array.isArray(p.keywords) ? p.keywords.map((k: any) => String(k)) : [],
          bullets: Array.isArray(p.highlights)
            ? p.highlights.map((h: any) => sanitizeAtsText(String(h || ''))).filter(Boolean)
            : [],
        }))
      : fallback.projects,
    certifications: Array.isArray(parsed.certificates) && parsed.certificates.length > 0
      ? parsed.certificates.map((c: any, idx: number) => ({
          id: genId('cert'),
          visible: true,
          order: idx,
          name: String(c.name || c.title || '').trim(),
          issuer: String(c.issuer || '').trim(),
          issueDate: normalizeDate(c.date || c.startDate),
          credentialUrl: c.url ? String(c.url).trim() : undefined,
        }))
      : fallback.certifications,
    involvement: Array.isArray(parsed.volunteer) && parsed.volunteer.length > 0
      ? parsed.volunteer.map((v: any, idx: number) => ({
          id: genId('inv'),
          visible: true,
          order: idx,
          organization: String(v.organization || '').trim(),
          role: String(v.position || '').trim(),
          startDate: normalizeDate(v.startDate),
          endDate: normalizeDate(v.endDate) || '',
          bullets: Array.isArray(v.highlights)
            ? v.highlights.map((h: any) => sanitizeAtsText(String(h || ''))).filter(Boolean)
            : [],
        }))
      : fallback.involvement,
    awards: Array.isArray(parsed.awards) && parsed.awards.length > 0
      ? parsed.awards.map((a: any, idx: number) => ({
          id: genId('award'),
          visible: true,
          order: idx,
          title: String(a.title || '').trim(),
          issuer: String(a.awarder || '').trim(),
          date: normalizeDate(a.date),
          description: a.summary ? sanitizeAtsText(String(a.summary)) : undefined,
        }))
      : fallback.awards,
    publications: Array.isArray(parsed.publications) && parsed.publications.length > 0
      ? parsed.publications.map((p: any, idx: number) => ({
          id: genId('pub'),
          visible: true,
          order: idx,
          title: String(p.name || '').trim(),
          publisher: String(p.publisher || '').trim(),
          date: normalizeDate(p.releaseDate || p.date),
          url: p.url ? String(p.url).trim() : undefined,
          authors: Array.isArray(p.authors) ? p.authors.map((a: any) => String(a)) : [],
        }))
      : fallback.publications,
    references: fallback.references,
  };

  return result;
}

/** Computes section presence/count metadata for the result payload. */
function describeSections(data: ResumeData): Array<{ key: SectionKey; count: number }> {
  return ([
    'experience',
    'projects',
    'education',
    'skills',
    'certifications',
    'involvement',
    'awards',
    'publications',
    'references',
  ] as SectionKey[]).map((key) => ({
    key,
    count: (data[key] as unknown as any[]).length,
  }));
}

/**
 * Orchestrates AI-assisted resume parsing:
 *   OmniRoute → OpenAI → Ollama → deterministic heuristic fallback.
 * Returns a full ResumeData plus source metadata.
 */
export async function parseResumeWithAi(
  content: string,
  options: AiClientOptions = {}
): Promise<ParseResumeResult> {
  const warnings: string[] = [];
  const heuristic = parsePlainTextResume(content);

  const config = resolveAiProviderConfig(options);
  const prompt = buildResumeParsePrompt(content);

  // 1. OmniRoute
  if (config.provider === 'omniroute' && config.apiKey) {
    const rawOutput = await callOpenAiCompatibleApi(
      config.baseUrl,
      config.apiKey,
      config.model,
      [
        {
          role: 'system',
          content: 'You are an expert ATS resume parser. Output valid JSON Resume objects only.',
        },
        { role: 'user', content: prompt },
      ],
      config.timeoutMs
    );
    if (rawOutput) {
      const enriched = extractStructuredResume(rawOutput, heuristic);
      const data = importedResumeToData(enriched);
      return {
        data,
        source: 'ai',
        modelUsed: config.model,
        sections: describeSections(data),
        warnings,
      };
    }
    warnings.push('OmniRoute parsing failed; falling back to heuristics.');
  }

  // 2. OpenAI
  if (config.provider === 'openai' && config.apiKey) {
    const rawOutput = await callOpenAiCompatibleApi(
      config.baseUrl,
      config.apiKey,
      config.model,
      [
        {
          role: 'system',
          content: 'You are an expert ATS resume parser. Output valid JSON Resume objects only.',
        },
        { role: 'user', content: prompt },
      ],
      config.timeoutMs
    );
    if (rawOutput) {
      const enriched = extractStructuredResume(rawOutput, heuristic);
      const data = importedResumeToData(enriched);
      return {
        data,
        source: 'ai',
        modelUsed: config.model,
        sections: describeSections(data),
        warnings,
      };
    }
    warnings.push('OpenAI parsing failed; falling back to heuristics.');
  }

  // 3. Local Ollama
  if (config.provider === 'ollama') {
    const rawOutput = await callOllamaGenerateApi(
      config.baseUrl,
      config.model,
      prompt,
      config.timeoutMs
    );
    if (rawOutput) {
      const enriched = extractStructuredResume(rawOutput, heuristic);
      const data = importedResumeToData(enriched);
      if (data.contact.fullName || data.experience.length > 0 || data.skills.length > 0) {
        return {
          data,
          source: 'ai',
          modelUsed: config.model,
          sections: describeSections(data),
          warnings,
        };
      }
    }
    warnings.push('Ollama parsing produced no usable structured output; using heuristics.');
  }

  // 4. Deterministic fallback
  const fallbackData = importedResumeToData(heuristic);
  return {
    data: fallbackData,
    source: 'heuristic',
    modelUsed: 'heuristic-engine',
    sections: describeSections(fallbackData),
    warnings,
  };
}
