import {
  AwardItem,
  CertificationItem,
  ContactInfo,
  EducationItem,
  ExperienceItem,
  InvolvementItem,
  ProjectItem,
  PublicationItem,
  ReferenceItem,
  ResumeData,
  SectionKey,
  SkillCategory,
} from '@/types/resume';

export type ImportMode = 'replace' | 'merge';
export type ImportSourceType = 'json' | 'text' | 'pdf' | 'docx';

/** Normalized import payload independent of source format. */
export interface ImportedResume {
  contact: Partial<ContactInfo>;
  summary?: string;
  experience: ExperienceItem[];
  projects: ProjectItem[];
  education: EducationItem[];
  skills: SkillCategory[];
  certifications: CertificationItem[];
  involvement: InvolvementItem[];
  awards: AwardItem[];
  publications: PublicationItem[];
  references: ReferenceItem[];
}

export interface ParseResumeRequest {
  content: string;
  sourceType?: ImportSourceType;
  fileName?: string;
  /** Raw extracted text from a document (pre-normalized by AI parse). */
  rawText?: string;
}

export type AiProviderResult = 'ai' | 'heuristic' | 'json' | 'fallback';

export interface ParseResumeResult {
  data: ResumeData;
  source: AiProviderResult;
  modelUsed?: string;
  sections: Array<{ key: SectionKey; count: number }>;
  warnings: string[];
}
