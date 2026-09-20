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
import {
  ResumeData,
  SectionKey,
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
import { ResumeAiSchema } from '@/lib/ai/resume-schema';

/** Builds the strict structured-JSON extraction prompt for an LLM. */
export function buildResumeParsePrompt(rawText: string): string {
  return `You are a senior ATS parsing engineer. Extract structured resume data from the raw text below into the standard JSON Resume schema (https://jsonresume.org/schema).

Rules:
1. Map fields to these JSON Resume keys:
   - basics: name, label, email, phone, url, summary, location: { address, city, region, postalCode, countryCode }, profiles: [{ network, username, url }]
   - work: [{ company, position, location, startDate, endDate, summary, highlights }]
   - education: [{ institution, area, studyType, startDate, endDate, score, gpa, courses, honors }]
   - skills: [{ name, keywords }]
   - projects: [{ name, description, highlights, keywords, technologies, startDate, endDate, url, role }]
   - certificates: [{ name, issuer, date, url }]
   - volunteer: [{ organization, position, startDate, endDate, summary, highlights }]
   - awards: [{ title, date, awarder, summary }]
   - publications: [{ name, publisher, releaseDate, date, url, summary, authors }]
   - references: [{ name, reference, company, relationship, contact }]
2. Normalize all dates to YYYY-MM or YYYY. Use null or omit for current positions/roles.
3. Keep every bullet point in third-person voice: rephrase leading "I", "my", "we" — do NOT use "I", "me", "my" — NEVER output them.
4. Preserve quantifiable metrics exactly (percentages, currency amounts, numerical scale figures).
5. Output ONLY a single valid JSON Resume object. Do NOT include markdown code fences, commentary, or explanatory text before or after the JSON.

Resume text:
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
  if (!rawJsonText || typeof rawJsonText !== 'string') {
    return fallback;
  }

  let rawParsed: any;
  try {
    let clean = rawJsonText.trim();
    // Strip markdown code fences if present
    const fenced = clean.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (fenced?.[1]) {
      clean = fenced[1].trim();
    } else {
      // If there is leading/trailing text, locate the outermost JSON object
      const firstBrace = clean.indexOf('{');
      const lastBrace = clean.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        clean = clean.slice(firstBrace, lastBrace + 1);
      }
    }
    rawParsed = JSON.parse(clean);
  } catch {
    return fallback;
  }

  if (!rawParsed || typeof rawParsed !== 'object' || Array.isArray(rawParsed)) {
    return fallback;
  }

  // Validate and parse via Zod schema
  const parseResult = ResumeAiSchema.safeParse(rawParsed);
  const parsed: any = parseResult.success ? parseResult.data : rawParsed;

  // 1. Basics & Contact Info
  const basics = parsed.basics && typeof parsed.basics === 'object' ? parsed.basics : {};
  let locStr = '';
  if (typeof basics.location === 'string') {
    locStr = basics.location.trim();
  } else if (basics.location && typeof basics.location === 'object') {
    const loc = basics.location;
    locStr = [loc.address, loc.city, loc.region, loc.postalCode, loc.countryCode]
      .map((x: any) => (x ? String(x).trim() : ''))
      .filter(Boolean)
      .join(', ');
  }

  let aiLinkedin = '';
  let aiGithub = '';
  let aiPortfolio = basics.url ? String(basics.url).trim() : '';

  if (Array.isArray(basics.profiles)) {
    for (const p of basics.profiles) {
      if (!p || typeof p !== 'object') continue;
      const net = String(p.network || '').toLowerCase();
      const pUrl = String(p.url || '').trim();
      if (net.includes('linkedin') || pUrl.toLowerCase().includes('linkedin.com')) {
        aiLinkedin = pUrl ? (pUrl.startsWith('http') ? pUrl : `https://${pUrl}`) : '';
      } else if (net.includes('github') || pUrl.toLowerCase().includes('github.com')) {
        aiGithub = pUrl ? (pUrl.startsWith('http') ? pUrl : `https://${pUrl}`) : '';
      } else if (!aiPortfolio && (net.includes('portfolio') || net.includes('website') || net.includes('blog') || pUrl)) {
        aiPortfolio = pUrl ? (pUrl.startsWith('http') ? pUrl : `https://${pUrl}`) : '';
      }
    }
  }

  const contact = {
    fullName: (basics.name ? String(basics.name).trim() : '') || fallback.contact.fullName || '',
    email: (basics.email ? String(basics.email).trim() : '') || fallback.contact.email || '',
    phone: (basics.phone ? String(basics.phone).trim() : '') || fallback.contact.phone || '',
    location: locStr || fallback.contact.location || '',
    linkedinUrl: aiLinkedin || fallback.contact.linkedinUrl || '',
    githubUrl: aiGithub || fallback.contact.githubUrl || '',
    portfolioUrl: aiPortfolio || fallback.contact.portfolioUrl || '',
  };

  // 2. Summary
  const summary = (basics.summary || parsed.summary || '').trim() || fallback.summary || '';

  // 3. Work / Experience
  const rawWork = Array.isArray(parsed.work) && parsed.work.length > 0
    ? parsed.work
    : Array.isArray(parsed.experience) && parsed.experience.length > 0
      ? parsed.experience
      : null;

  const experience: ExperienceItem[] = rawWork
    ? rawWork.map((w: any, idx: number) => {
        const highlights: string[] = [];
        if (Array.isArray(w.highlights)) {
          w.highlights.forEach((h: any) => {
            const sanitized = sanitizeAtsText(String(h || ''));
            if (sanitized) highlights.push(sanitized);
          });
        } else if (w.summary) {
          const sanitized = sanitizeAtsText(String(w.summary));
          if (sanitized) highlights.push(sanitized);
        }

        const endRaw = w.endDate ? String(w.endDate).trim() : '';
        const isCurrent = !endRaw || /present|current|now|ongoing/i.test(endRaw);

        return {
          id: genId('exp'),
          visible: true,
          order: idx,
          company: String(w.company || w.name || '').trim() || 'Unknown Company',
          role: String(w.position || w.role || '').trim() || 'Professional',
          location: w.location ? String(w.location).trim() : undefined,
          startDate: normalizeDate(w.startDate),
          endDate: isCurrent ? 'Present' : normalizeDate(endRaw),
          current: isCurrent,
          bullets: highlights,
        };
      })
    : fallback.experience;

  // 4. Education
  const rawEdu = Array.isArray(parsed.education) && parsed.education.length > 0 ? parsed.education : null;
  const education: EducationItem[] = rawEdu
    ? rawEdu.map((e: any, idx: number) => {
        const honors: string[] = Array.isArray(e.honors)
          ? e.honors.map((h: any) => String(h || '').trim()).filter(Boolean)
          : undefined;

        const gpaVal = e.gpa !== undefined && e.gpa !== null
          ? String(e.gpa).trim()
          : e.score !== undefined && e.score !== null
            ? String(e.score).trim()
            : undefined;

        return {
          id: genId('edu'),
          visible: true,
          order: idx,
          institution: String(e.institution || e.name || '').trim() || 'Unknown Institution',
          degree: String(e.degree || e.studyType || '').trim(),
          fieldOfStudy: String(e.fieldOfStudy || e.area || '').trim(),
          startDate: normalizeDate(e.startDate),
          endDate: normalizeDate(e.endDate),
          gpa: gpaVal || undefined,
          honors: honors && honors.length > 0 ? honors : undefined,
        };
      })
    : fallback.education;

  // 5. Skills
  const rawSkills = Array.isArray(parsed.skills) && parsed.skills.length > 0 ? parsed.skills : null;
  const skills: SkillCategory[] = rawSkills
    ? rawSkills.map((s: any, idx: number) => {
        let skillList: string[] = [];
        if (Array.isArray(s.keywords)) {
          skillList = s.keywords.map((k: any) => String(k || '').trim()).filter(Boolean);
        } else if (Array.isArray(s.skills)) {
          skillList = s.skills.map((k: any) => String(k || '').trim()).filter(Boolean);
        }

        return {
          id: genId('skill'),
          visible: true,
          order: idx,
          categoryName: String(s.name || s.categoryName || 'Skills').trim() || 'Skills',
          skills: skillList,
        };
      })
    : fallback.skills;

  // 6. Projects
  const rawProj = Array.isArray(parsed.projects) && parsed.projects.length > 0 ? parsed.projects : null;
  const projects: ProjectItem[] = rawProj
    ? rawProj.map((p: any, idx: number) => {
        const bullets: string[] = [];
        if (Array.isArray(p.highlights)) {
          p.highlights.forEach((h: any) => {
            const sanitized = sanitizeAtsText(String(h || ''));
            if (sanitized) bullets.push(sanitized);
          });
        } else if (Array.isArray(p.bullets)) {
          p.bullets.forEach((b: any) => {
            const sanitized = sanitizeAtsText(String(b || ''));
            if (sanitized) bullets.push(sanitized);
          });
        } else if (p.description) {
          const sanitized = sanitizeAtsText(String(p.description));
          if (sanitized) bullets.push(sanitized);
        }

        let techList: string[] = [];
        if (Array.isArray(p.technologies)) {
          techList = p.technologies.map((t: any) => String(t || '').trim()).filter(Boolean);
        } else if (Array.isArray(p.keywords)) {
          techList = p.keywords.map((k: any) => String(k || '').trim()).filter(Boolean);
        }

        const projectLink = p.url || p.link ? String(p.url || p.link).trim() : undefined;

        return {
          id: genId('proj'),
          visible: true,
          order: idx,
          name: String(p.name || p.title || '').trim(),
          role: p.role ? String(p.role).trim() : undefined,
          link: projectLink,
          startDate: normalizeDate(p.startDate) || undefined,
          endDate: normalizeDate(p.endDate) || undefined,
          technologies: techList,
          bullets,
        };
      })
    : fallback.projects;

  // 7. Certifications
  const rawCert = Array.isArray(parsed.certificates) && parsed.certificates.length > 0
    ? parsed.certificates
    : Array.isArray(parsed.certifications) && parsed.certifications.length > 0
      ? parsed.certifications
      : null;

  const certifications: CertificationItem[] = rawCert
    ? rawCert.map((c: any, idx: number) => {
        const certUrl = c.url || c.credentialUrl || c.link ? String(c.url || c.credentialUrl || c.link).trim() : undefined;
        return {
          id: genId('cert'),
          visible: true,
          order: idx,
          name: String(c.name || c.title || '').trim(),
          issuer: String(c.issuer || c.awarder || '').trim(),
          issueDate: normalizeDate(c.date || c.issueDate || c.startDate),
          credentialUrl: certUrl,
        };
      })
    : fallback.certifications;

  // 8. Involvement / Volunteer
  const rawInv = Array.isArray(parsed.volunteer) && parsed.volunteer.length > 0
    ? parsed.volunteer
    : Array.isArray(parsed.involvement) && parsed.involvement.length > 0
      ? parsed.involvement
      : null;

  const involvement: InvolvementItem[] = rawInv
    ? rawInv.map((v: any, idx: number) => {
        const bullets: string[] = [];
        if (Array.isArray(v.highlights)) {
          v.highlights.forEach((h: any) => {
            const sanitized = sanitizeAtsText(String(h || ''));
            if (sanitized) bullets.push(sanitized);
          });
        } else if (Array.isArray(v.bullets)) {
          v.bullets.forEach((b: any) => {
            const sanitized = sanitizeAtsText(String(b || ''));
            if (sanitized) bullets.push(sanitized);
          });
        } else if (v.summary) {
          const sanitized = sanitizeAtsText(String(v.summary));
          if (sanitized) bullets.push(sanitized);
        }

        return {
          id: genId('inv'),
          visible: true,
          order: idx,
          organization: String(v.organization || v.name || v.company || '').trim(),
          role: String(v.position || v.role || '').trim(),
          startDate: normalizeDate(v.startDate),
          endDate: normalizeDate(v.endDate) || (v.endDate ? 'Present' : ''),
          bullets,
        };
      })
    : fallback.involvement;

  // 9. Awards
  const rawAwards = Array.isArray(parsed.awards) && parsed.awards.length > 0 ? parsed.awards : null;
  const awards: AwardItem[] = rawAwards
    ? rawAwards.map((a: any, idx: number) => ({
        id: genId('award'),
        visible: true,
        order: idx,
        title: String(a.title || a.name || '').trim(),
        issuer: String(a.awarder || a.issuer || '').trim(),
        date: normalizeDate(a.date),
        description: a.summary || a.description ? sanitizeAtsText(String(a.summary || a.description)) : undefined,
      }))
    : fallback.awards;

  // 10. Publications
  const rawPubs = Array.isArray(parsed.publications) && parsed.publications.length > 0 ? parsed.publications : null;
  const publications: PublicationItem[] = rawPubs
    ? rawPubs.map((p: any, idx: number) => {
        const pubUrl = p.url || p.link ? String(p.url || p.link).trim() : undefined;
        const authors = Array.isArray(p.authors)
          ? p.authors.map((a: any) => String(a || '').trim()).filter(Boolean)
          : [];
        return {
          id: genId('pub'),
          visible: true,
          order: idx,
          title: String(p.name || p.title || '').trim(),
          publisher: String(p.publisher || '').trim(),
          date: normalizeDate(p.releaseDate || p.date),
          url: pubUrl,
          authors,
        };
      })
    : fallback.publications;

  // 11. References
  const rawRefs = Array.isArray(parsed.references) && parsed.references.length > 0 ? parsed.references : null;
  const references: ReferenceItem[] = rawRefs
    ? rawRefs.map((r: any, idx: number) => ({
        id: genId('ref'),
        visible: true,
        order: idx,
        name: String(r.name || '').trim(),
        company: String(r.company || r.reference || '').trim(),
        contact: String(r.contact || r.email || r.phone || '').trim(),
        relationship: String(r.relationship || (r.company ? r.reference : '') || '').trim(),
      }))
    : fallback.references;

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
    publications,
    references,
  };
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
