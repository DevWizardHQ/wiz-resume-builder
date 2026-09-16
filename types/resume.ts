export interface BaseItem {
  id: string;
  visible: boolean;
  order: number;
}

export interface ContactInfo {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
}

export interface ExperienceItem extends BaseItem {
  company: string;
  role: string;
  location?: string;
  startDate: string; // Format: YYYY-MM or YYYY
  endDate?: string;  // Format: YYYY-MM or 'Present'
  current: boolean;
  bullets: string[];
}

export interface ProjectItem extends BaseItem {
  name: string;
  role?: string;
  link?: string;
  startDate?: string;
  endDate?: string;
  technologies: string[];
  bullets: string[];
}

export interface EducationItem extends BaseItem {
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
  gpa?: string;
  honors?: string[];
}

export interface SkillCategory extends BaseItem {
  categoryName: string; // e.g., "Languages", "Frameworks & Libraries", "Tools & Platforms"
  skills: string[];
}

export interface CertificationItem extends BaseItem {
  name: string;
  issuer: string;
  issueDate: string;
  expirationDate?: string;
  credentialUrl?: string;
}

export interface InvolvementItem extends BaseItem {
  organization: string;
  role: string;
  startDate: string;
  endDate?: string;
  bullets: string[];
}

export interface AwardItem extends BaseItem {
  title: string;
  issuer: string;
  date: string;
  description?: string;
}

export interface PublicationItem extends BaseItem {
  title: string;
  publisher: string;
  date: string;
  url?: string;
  authors: string[];
}

export interface ReferenceItem extends BaseItem {
  name: string;
  company: string;
  contact: string;
  relationship: string;
}

export type SectionKey =
  | 'contact'
  | 'summary'
  | 'experience'
  | 'projects'
  | 'education'
  | 'skills'
  | 'certifications'
  | 'involvement'
  | 'awards'
  | 'publications'
  | 'references';

export type TemplateId = 'classic-ats' | 'modern-minimal' | 'executive';

export interface SectionMetadata {
  key: SectionKey;
  label: string;
  visible: boolean;
}

export interface ResumeData {
  contact: ContactInfo;
  summary: { text: string; visible: boolean };
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

export interface ResumeRecord {
  id: string;
  user_id: string;
  title: string;
  slug: string;
  template_id: TemplateId;
  section_order: SectionKey[];
  content: ResumeData;
  ats_score: number;
  created_at: string;
  updated_at: string;
}

export interface CoverLetterRecord {
  id: string;
  user_id: string;
  resume_id?: string | null;
  job_title: string;
  company_name: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export const DEFAULT_SECTION_ORDER: SectionKey[] = [
  'contact',
  'summary',
  'experience',
  'projects',
  'education',
  'skills',
  'certifications',
  'involvement',
  'awards',
  'publications',
  'references',
];

export const INITIAL_RESUME_DATA: ResumeData = {
  contact: {
    fullName: '',
    email: '',
    phone: '',
    location: '',
    linkedinUrl: '',
    githubUrl: '',
    portfolioUrl: '',
  },
  summary: {
    text: '',
    visible: true,
  },
  experience: [],
  projects: [],
  education: [],
  skills: [],
  certifications: [],
  involvement: [],
  awards: [],
  publications: [],
  references: [],
};
