import { ResumeData } from '@/types/resume';

export interface AtsAnalysisResult {
  overallScore: number;
  formatScore: number;
  keywordScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  suggestions: string[];
  warnings: string[];
  metricsCount: number;
  actionVerbCount: number;
  // Convenience aliases for backward/alternate consumers
  score?: number;
  issues?: string[];
}

export const ACTION_VERBS = new Set([
  'accelerated', 'achieved', 'administered', 'advised', 'allocated', 'amplified',
  'analyzed', 'architected', 'assembled', 'audited', 'authored', 'automated',
  'boosted', 'budgeted', 'built', 'championed', 'clarified', 'coached',
  'collaborated', 'composed', 'conceptualized', 'consolidated', 'constructed',
  'converted', 'coordinated', 'crafted', 'created', 'customized', 'debugged',
  'decreased', 'delegated', 'delivered', 'deployed', 'designed', 'developed',
  'devised', 'directed', 'distributed', 'documented', 'doubled', 'drafted',
  'drove', 'engineered', 'enhanced', 'established', 'evaluated', 'examined',
  'executed', 'expanded', 'expedited', 'facilitated', 'focused', 'forecasted',
  'formulated', 'fostered', 'founded', 'generated', 'guided', 'headed',
  'identified', 'implemented', 'improved', 'increased', 'initiated', 'inspected',
  'instituted', 'instructed', 'integrated', 'introduced', 'invented', 'launched',
  'lead', 'led', 'maintained', 'managed', 'mapped', 'maximized', 'measured',
  'mentored', 'migrated', 'minimized', 'modernized', 'monitored', 'motivated',
  'navigated', 'negotiated', 'operated', 'optimized', 'orchestrated', 'organized',
  'originated', 'overhauled', 'oversaw', 'partnered', 'performed', 'persuaded',
  'piloted', 'pioneered', 'planned', 'prepared', 'presented', 'prioritized',
  'produced', 'programmed', 'projected', 'promoted', 'proposed', 'provided',
  'published', 'raised', 'rebuilt', 'recruited', 'redesigned', 'reduced',
  'refactored', 'reformed', 'regulated', 'remodeled', 'reorganized', 'repaired',
  'replaced', 'represented', 'researched', 'resolved', 'restructured', 'revamped',
  'reviewed', 'revitalized', 'saved', 'scaled', 'scheduled', 'secured', 'selected',
  'served', 'settled', 'shaped', 'simplified', 'slashed', 'solved', 'spearheaded',
  'standardized', 'steered', 'strategized', 'streamlined', 'strengthened',
  'structured', 'supervised', 'surpassed', 'systematized', 'tabulated', 'targeted',
  'taught', 'tested', 'trained', 'transformed', 'transitioned', 'translated',
  'tripled', 'uncovered', 'unified', 'upgraded', 'utilized', 'validated',
  'visualized', 'won', 'yielded'
]);

// Common technical and industry keywords dictionary for high-precision extraction
export const KNOWN_TECH_KEYWORDS = [
  'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'golang', 'go',
  'rust', 'ruby', 'php', 'swift', 'kotlin', 'scala', 'r', 'dart', 'elixir',
  'react', 'react.js', 'react native', 'next.js', 'vue', 'vue.js', 'angular',
  'svelte', 'node', 'node.js', 'express', 'express.js', 'nest.js', 'nestjs',
  'fastapi', 'django', 'flask', 'spring', 'spring boot', 'rails', 'ruby on rails',
  'graphql', 'rest', 'restful', 'rest api', 'grpc', 'soap', 'trpc',
  'html', 'html5', 'css', 'css3', 'tailwind', 'tailwind css', 'sass', 'scss',
  'sql', 'postgresql', 'postgres', 'mysql', 'sqlite', 'mongodb', 'redis',
  'cassandra', 'dynamodb', 'elasticsearch', 'supabase', 'firebase', 'prisma',
  'aws', 'amazon web services', 'azure', 'gcp', 'google cloud', 'docker',
  'kubernetes', 'k8s', 'terraform', 'ansible', 'helm', 'ci/cd', 'github actions',
  'jenkins', 'gitlab', 'circleci', 'argo', 'argocd', 'linux', 'unix', 'git',
  'microservices', 'serverless', 'system design', 'distributed systems',
  'machine learning', 'deep learning', 'artificial intelligence', 'ai', 'llm',
  'nlp', 'computer vision', 'pytorch', 'tensorflow', 'scikit-learn', 'pandas',
  'numpy', 'langchain', 'ollama', 'hugging face', 'transformers',
  'agile', 'scrum', 'kanban', 'jira', 'confluence', 'tdd', 'unit testing',
  'integration testing', 'jest', 'vitest', 'cypress', 'playwright', 'selenium',
  'webpack', 'vite', 'turbopack', 'rollup', 'babel', 'zustand', 'redux', 'mobx',
  'oauth', 'jwt', 'saml', 'iam', 'sso', 'rbac', 'security', 'penetration testing',
  'kafka', 'rabbitmq', 'sqs', 'sns', 'event-driven', 'websockets', 'socket.io',
  'data structures', 'algorithms', 'object-oriented programming', 'oop',
  'functional programming', 'design patterns', 'solid principles', 'clean code'
];

const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and',
  'any', 'are', 'aren\'t', 'as', 'at', 'be', 'because', 'been', 'before', 'being',
  'below', 'between', 'both', 'but', 'by', 'can', 'can\'t', 'cannot', 'could',
  'couldn\'t', 'did', 'didn\'t', 'do', 'does', 'doesn\'t', 'doing', 'don\'t',
  'down', 'during', 'each', 'few', 'for', 'from', 'further', 'had', 'hadn\'t',
  'has', 'hasn\'t', 'have', 'haven\'t', 'having', 'he', 'he\'d', 'he\'ll', 'he\'s',
  'her', 'here', 'here\'s', 'hers', 'herself', 'him', 'himself', 'his', 'how',
  'how\'s', 'i', 'i\'d', 'i\'ll', 'i\'m', 'i\'ve', 'if', 'in', 'into', 'is',
  'isn\'t', 'it', 'it\'s', 'its', 'itself', 'let\'s', 'me', 'more', 'most',
  'mustn\'t', 'my', 'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once',
  'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over',
  'own', 'same', 'shan\'t', 'she', 'she\'d', 'she\'ll', 'she\'s', 'should',
  'shouldn\'t', 'so', 'some', 'such', 'than', 'that', 'that\'s', 'the', 'their',
  'theirs', 'them', 'themselves', 'then', 'there', 'there\'s', 'these', 'they',
  'they\'d', 'they\'ll', 'they\'re', 'they\'ve', 'this', 'those', 'through', 'to',
  'too', 'under', 'until', 'up', 'very', 'was', 'wasn\'t', 'we', 'we\'d', 'we\'ll',
  'we\'re', 'we\'ve', 'were', 'weren\'t', 'what', 'what\'s', 'when', 'when\'s',
  'where', 'where\'s', 'which', 'while', 'who', 'who\'s', 'whom', 'why', 'why\'s',
  'with', 'won\'t', 'would', 'wouldn\'t', 'you', 'you\'d', 'you\'ll', 'you\'re',
  'you\'ve', 'your', 'yours', 'yourself', 'yourselves',
  // Common generic job posting words
  'candidate', 'candidates', 'qualifications', 'requirements', 'responsibilities',
  'role', 'position', 'job', 'company', 'team', 'work', 'working', 'experience',
  'years', 'year', 'skill', 'skills', 'strong', 'excellent', 'proficient',
  'ability', 'familiar', 'knowledge', 'plus', 'preferred', 'required', 'ideal',
  'demonstrated', 'proven', 'understanding', 'opportunity', 'seeking', 'look',
  'looking', 'join', 'successful', 'degree', 'field', 'related', 'environment',
  'must', 'will', 'have', 'help', 'across', 'within', 'including', 'responsible',
  'duties', 'daily', 'tasks', 'needs', 'needed', 'applicant', 'applicants'
]);

// Metric detection pattern (percentages, currencies, multipliers, counts with units, etc.)
const METRICS_REGEX = /(?:\b\d+(?:\.\d+)?%|\$\s*\d+(?:,\d{3})*(?:\.\d+)?(?:\s*(?:k|m|b|million|billion|thousand))?\b|\b\d+(?:\.\d+)?x\b|\b\d+(?:,\d{3})*(?:\.\d+)?\s*(?:k|m|b|million|billion|thousand|users|customers|clients|subscribers|transactions|requests|qps|tps|ms|sec|seconds|minutes|mins|hours|hrs|days|weeks|months|years|members|teams|projects|engineers|developers|repos|services|endpoints|features|bugs|tickets|stars|downloads|views|visits|impressions|sales|revenue|leads|roi|cost|costs|savings|budget|pts|points|percent)\b|\b\d{2,}(?:,\d{3})*\b|\b\d+\+\b)/i;

/**
 * Extracts and aggregates all visible text content from a resume.
 */
export function extractResumeFullText(resume: ResumeData): string {
  const parts: string[] = [];

  if (resume.contact) {
    parts.push(resume.contact.fullName || '');
    parts.push(resume.contact.location || '');
    parts.push(resume.contact.email || '');
  }

  if (resume.summary?.visible && resume.summary?.text) {
    parts.push(resume.summary.text);
  }

  if (Array.isArray(resume.experience)) {
    for (const exp of resume.experience) {
      if (exp.visible !== false) {
        parts.push(exp.role || '');
        parts.push(exp.company || '');
        parts.push(exp.location || '');
        if (Array.isArray(exp.bullets)) {
          parts.push(...exp.bullets);
        }
      }
    }
  }

  if (Array.isArray(resume.projects)) {
    for (const proj of resume.projects) {
      if (proj.visible !== false) {
        parts.push(proj.name || '');
        parts.push(proj.role || '');
        if (Array.isArray(proj.technologies)) {
          parts.push(...proj.technologies);
        }
        if (Array.isArray(proj.bullets)) {
          parts.push(...proj.bullets);
        }
      }
    }
  }

  if (Array.isArray(resume.education)) {
    for (const edu of resume.education) {
      if (edu.visible !== false) {
        parts.push(edu.institution || '');
        parts.push(edu.degree || '');
        parts.push(edu.fieldOfStudy || '');
        if (Array.isArray(edu.honors)) {
          parts.push(...edu.honors);
        }
      }
    }
  }

  if (Array.isArray(resume.skills)) {
    for (const cat of resume.skills) {
      if (cat.visible !== false) {
        parts.push(cat.categoryName || '');
        if (Array.isArray(cat.skills)) {
          parts.push(...cat.skills);
        }
      }
    }
  }

  if (Array.isArray(resume.certifications)) {
    for (const cert of resume.certifications) {
      if (cert.visible !== false) {
        parts.push(cert.name || '');
        parts.push(cert.issuer || '');
      }
    }
  }

  if (Array.isArray(resume.involvement)) {
    for (const inv of resume.involvement) {
      if (inv.visible !== false) {
        parts.push(inv.organization || '');
        parts.push(inv.role || '');
        if (Array.isArray(inv.bullets)) {
          parts.push(...inv.bullets);
        }
      }
    }
  }

  if (Array.isArray(resume.awards)) {
    for (const award of resume.awards) {
      if (award.visible !== false) {
        parts.push(award.title || '');
        parts.push(award.issuer || '');
        parts.push(award.description || '');
      }
    }
  }

  if (Array.isArray(resume.publications)) {
    for (const pub of resume.publications) {
      if (pub.visible !== false) {
        parts.push(pub.title || '');
        parts.push(pub.publisher || '');
        if (Array.isArray(pub.authors)) {
          parts.push(...pub.authors);
        }
      }
    }
  }

  if (Array.isArray(resume.references)) {
    for (const ref of resume.references) {
      if (ref.visible !== false) {
        parts.push(ref.name || '');
        parts.push(ref.company || '');
        parts.push(ref.relationship || '');
      }
    }
  }

  return parts.filter(Boolean).join(' ');
}

/**
 * Extracts salient technical and domain keywords from text.
 */
export function extractKeywords(text: string): string[] {
  if (!text || text.trim().length === 0) return [];

  const lowerText = text.toLowerCase();
  const foundKeywords = new Set<string>();

  // 1. Match against known tech/domain keywords (including multi-word terms)
  for (const kw of KNOWN_TECH_KEYWORDS) {
    const kwPattern = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (kwPattern.test(lowerText)) {
      foundKeywords.add(kw);
    }
  }

  // 2. Extract potential words/tokens
  const words = lowerText.match(/[a-z0-9+#.-]{2,}/g) || [];
  for (const word of words) {
    const cleaned = word.replace(/^[.-]+|[.-]+$/g, '');
    if (cleaned.length >= 3 && !STOP_WORDS.has(cleaned) && !/^\d+$/.test(cleaned)) {
      foundKeywords.add(cleaned);
    }
  }

  return Array.from(foundKeywords);
}

/**
 * Collects all bullet points from experience, projects, and involvement.
 */
export function collectAllBullets(resume: ResumeData): string[] {
  const bullets: string[] = [];

  if (Array.isArray(resume.experience)) {
    for (const exp of resume.experience) {
      if (exp.visible !== false && Array.isArray(exp.bullets)) {
        bullets.push(...exp.bullets.filter(b => typeof b === 'string' && b.trim().length > 0));
      }
    }
  }

  if (Array.isArray(resume.projects)) {
    for (const proj of resume.projects) {
      if (proj.visible !== false && Array.isArray(proj.bullets)) {
        bullets.push(...proj.bullets.filter(b => typeof b === 'string' && b.trim().length > 0));
      }
    }
  }

  if (Array.isArray(resume.involvement)) {
    for (const inv of resume.involvement) {
      if (inv.visible !== false && Array.isArray(inv.bullets)) {
        bullets.push(...inv.bullets.filter(b => typeof b === 'string' && b.trim().length > 0));
      }
    }
  }

  return bullets;
}

/**
 * Checks whether a given bullet string starts with or contains an action verb.
 */
export function hasActionVerb(bulletText: string): boolean {
  if (!bulletText || typeof bulletText !== 'string') return false;
  const words = bulletText.toLowerCase().replace(/[^a-z\s]/g, ' ').split(/\s+/).filter(Boolean);
  if (words.length === 0) return false;

  // Check the first 3 words of the bullet for leading action verb
  for (let i = 0; i < Math.min(3, words.length); i++) {
    if (ACTION_VERBS.has(words[i])) return true;
  }

  // Check entire bullet if not found in first 3 words
  return words.some(w => ACTION_VERBS.has(w));
}

/**
 * Checks whether a given bullet string contains quantifiable metrics.
 */
export function hasQuantifiableMetric(bulletText: string): boolean {
  if (!bulletText || typeof bulletText !== 'string') return false;
  return METRICS_REGEX.test(bulletText);
}

/**
 * Evaluates format score (0-100), warnings, suggestions, metrics count, and action verb count.
 */
function evaluateFormatScore(resume: ResumeData): {
  formatScore: number;
  warnings: string[];
  suggestions: string[];
  actionVerbCount: number;
  metricsCount: number;
} {
  let score = 0;
  const warnings: string[] = [];
  const suggestions: string[] = [];

  // --- 1. Contact Info (20 points max) ---
  const contact = resume.contact || {};
  let contactPoints = 0;

  if (contact.fullName && contact.fullName.trim().length > 0) {
    contactPoints += 5;
  } else {
    warnings.push('Add your full name to the contact section.');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (contact.email && contact.email.trim().length > 0 && emailRegex.test(contact.email.trim())) {
    contactPoints += 5;
  } else {
    warnings.push('Add a valid email address so recruiters and ATS parsers can reach you.');
  }

  if (contact.phone && contact.phone.trim().length >= 7) {
    contactPoints += 5;
  } else {
    warnings.push('Add a valid phone number for recruiter contact.');
  }

  if (contact.location && contact.location.trim().length > 0) {
    contactPoints += 5;
  } else {
    suggestions.push('Include your location (City, State/Country, or "Remote") to satisfy ATS geographic filters.');
  }

  score += contactPoints;

  // --- 2. Professional Summary (15 points max) ---
  const summary = resume.summary;
  if (summary && summary.visible && summary.text && summary.text.trim().length > 0) {
    const charCount = summary.text.trim().length;
    score += 5; // Base presence
    if (charCount >= 50 && charCount <= 600) {
      score += 10; // Optimal length
    } else if (charCount < 50) {
      score += 4;
      suggestions.push('Expand your professional summary to at least 2-3 sentences (50-300 words) summarizing key value.');
    } else {
      score += 6;
      suggestions.push('Consider trimming your summary to under 600 characters for optimal ATS readability.');
    }
  } else {
    suggestions.push('Add a professional summary highlighting your career focus, top competencies, and career value.');
  }

  // --- 3. Work Experience & Bullets (30 points max) ---
  const visibleExp = (resume.experience || []).filter(e => e.visible !== false);
  const allBullets = collectAllBullets(resume);

  let actionVerbCount = 0;
  let metricsCount = 0;

  for (const bullet of allBullets) {
    if (hasActionVerb(bullet)) actionVerbCount++;
    if (hasQuantifiableMetric(bullet)) metricsCount++;
  }

  if (visibleExp.length > 0) {
    score += 10; // Has experience items

    const hasValidRoles = visibleExp.every(e => e.company?.trim() && e.role?.trim());
    if (hasValidRoles) {
      score += 5;
    } else {
      warnings.push('Ensure all experience entries include both a job role/title and company name.');
    }

    // Action verbs points (up to 8 points)
    if (actionVerbCount >= 4) {
      score += 8;
    } else if (actionVerbCount >= 2) {
      score += 5;
      suggestions.push('Start more bullet points with strong action verbs (e.g., "Spearheaded", "Optimized", "Architected").');
    } else if (actionVerbCount >= 1) {
      score += 2;
      suggestions.push('Use active verbs at the beginning of each bullet point to enhance ATS impact.');
    } else {
      suggestions.push('Enhance your bullet points by leading with strong action verbs.');
    }

    // Metrics points (up to 7 points)
    if (metricsCount >= 3) {
      score += 7;
    } else if (metricsCount >= 1) {
      score += 4;
      suggestions.push('Incorporate additional quantifiable metrics (%, $, scale, numbers) using Google\'s X-Y-Z formula.');
    } else {
      suggestions.push('Add quantifiable achievements (e.g., "reduced latency by 35%", "scaled to 50k users") in your experience bullets.');
    }
  } else {
    warnings.push('Add at least one work experience or internship entry to establish your professional track record.');
  }

  // --- 4. Skills Section (15 points max) ---
  const visibleSkills = (resume.skills || []).filter(s => s.visible !== false);
  const totalSkillCount = visibleSkills.reduce((acc, cat) => acc + (cat.skills?.length || 0), 0);

  if (totalSkillCount >= 5) {
    score += 10;
    if (visibleSkills.length >= 2) {
      score += 5; // Good categorization
    } else {
      score += 3;
      suggestions.push('Organize skills into distinct categories (e.g., "Languages", "Frameworks & Tools", "Cloud & DevOps").');
    }
  } else if (totalSkillCount > 0) {
    score += 5;
    suggestions.push('Add more relevant technical and professional skills (aim for at least 6-12 skills).');
  } else {
    warnings.push('Add key skills to your resume to match ATS keyword search requirements.');
  }

  // --- 5. Education Section (10 points max) ---
  const visibleEdu = (resume.education || []).filter(e => e.visible !== false);
  if (visibleEdu.length > 0 && visibleEdu.some(e => e.institution?.trim() && e.degree?.trim())) {
    score += 10;
  } else if (visibleEdu.length > 0) {
    score += 5;
    suggestions.push('Ensure your education items include institution, degree, and field of study.');
  } else {
    suggestions.push('Include your educational background, degree, or relevant certifications.');
  }

  // --- 6. Additional Sections & Balance (10 points max) ---
  const hasProjects = (resume.projects || []).some(p => p.visible !== false && p.name?.trim());
  const hasCerts = (resume.certifications || []).some(c => c.visible !== false && c.name?.trim());
  const hasAwards = (resume.awards || []).some(a => a.visible !== false && a.title?.trim());
  const hasInvolvement = (resume.involvement || []).some(i => i.visible !== false && i.organization?.trim());
  const hasPubs = (resume.publications || []).some(p => p.visible !== false && p.title?.trim());

  const extraSectionCount = [hasProjects, hasCerts, hasAwards, hasInvolvement, hasPubs].filter(Boolean).length;
  if (extraSectionCount >= 2) {
    score += 10;
  } else if (extraSectionCount === 1) {
    score += 6;
  } else {
    suggestions.push('Consider adding Projects, Certifications, or Involvement sections to showcase well-rounded expertise.');
  }

  const formatScore = Math.min(100, Math.max(0, Math.round(score)));

  return {
    formatScore,
    warnings,
    suggestions,
    actionVerbCount,
    metricsCount
  };
}

/**
 * Main ATS scoring and audit function.
 * Evaluates format completeness, action verbs, quantified metrics, and keyword match against target job description.
 */
export function analyzeAtsScore(
  resume: ResumeData,
  jobDescription?: string
): AtsAnalysisResult {
  const safeResume: ResumeData = resume || {
    contact: { fullName: '', email: '', phone: '', location: '' },
    summary: { text: '', visible: false },
    experience: [],
    projects: [],
    education: [],
    skills: [],
    certifications: [],
    involvement: [],
    awards: [],
    publications: [],
    references: []
  };

  const { formatScore, warnings, suggestions, actionVerbCount, metricsCount } = evaluateFormatScore(safeResume);
  const resumeFullText = extractResumeFullText(safeResume).toLowerCase();

  let matchedKeywords: string[] = [];
  let missingKeywords: string[] = [];
  let keywordScore = 100;

  if (jobDescription && jobDescription.trim().length > 0) {
    const jobKeywords = extractKeywords(jobDescription);

    if (jobKeywords.length > 0) {
      for (const kw of jobKeywords) {
        // Match keyword in resume full text using word boundary or clean substring check
        const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const pattern = new RegExp(`(?:^|[^a-z0-9])${escaped}(?:$|[^a-z0-9])`, 'i');
        if (pattern.test(resumeFullText)) {
          matchedKeywords.push(kw);
        } else {
          missingKeywords.push(kw);
        }
      }

      keywordScore = Math.min(
        100,
        Math.max(0, Math.round((matchedKeywords.length / jobKeywords.length) * 100))
      );

      if (missingKeywords.length > 0) {
        const topMissing = missingKeywords.slice(0, 6);
        suggestions.push(`Consider incorporating target job keywords: ${topMissing.join(', ')}.`);
      }
    } else {
      keywordScore = formatScore;
    }
  } else {
    // If no job description is provided, extract resume's own keywords as matched
    matchedKeywords = extractKeywords(resumeFullText).slice(0, 15);
    missingKeywords = [];
    keywordScore = formatScore;
  }

  // Calculate overall composite score
  const overallScore = jobDescription && jobDescription.trim().length > 0
    ? Math.min(100, Math.max(0, Math.round(formatScore * 0.5 + keywordScore * 0.5)))
    : formatScore;

  return {
    overallScore,
    formatScore,
    keywordScore,
    matchedKeywords,
    missingKeywords,
    suggestions,
    warnings,
    metricsCount,
    actionVerbCount,
    score: overallScore,
    issues: [...warnings, ...suggestions]
  };
}
