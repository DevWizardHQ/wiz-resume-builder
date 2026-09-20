import { z } from 'zod';

export const LocationSchema = z
  .union([
    z.string(),
    z
      .object({
        address: z.string().optional().nullable(),
        postalCode: z.string().optional().nullable(),
        city: z.string().optional().nullable(),
        countryCode: z.string().optional().nullable(),
        region: z.string().optional().nullable(),
      })
      .passthrough(),
  ])
  .optional()
  .nullable();

export const ProfileSchema = z
  .object({
    network: z.string().optional().nullable(),
    username: z.string().optional().nullable(),
    url: z.string().optional().nullable(),
  })
  .passthrough();

export const BasicsSchema = z
  .object({
    name: z.string().optional().nullable(),
    label: z.string().optional().nullable(),
    image: z.string().optional().nullable(),
    email: z.string().optional().nullable(),
    phone: z.string().optional().nullable(),
    url: z.string().optional().nullable(),
    portfolio: z.string().optional().nullable(),
    website: z.string().optional().nullable(),
    homepage: z.string().optional().nullable(),
    link: z.string().optional().nullable(),
    summary: z.string().optional().nullable(),
    location: LocationSchema,
    profiles: z.array(ProfileSchema).optional().nullable(),
  })
  .passthrough()
  .optional()
  .nullable();

export const WorkItemSchema = z
  .object({
    name: z.string().optional().nullable(),
    company: z.string().optional().nullable(),
    position: z.string().optional().nullable(),
    role: z.string().optional().nullable(),
    url: z.string().optional().nullable(),
    startDate: z.string().optional().nullable(),
    endDate: z.string().optional().nullable(),
    summary: z.string().optional().nullable(),
    highlights: z.array(z.union([z.string(), z.any()])).optional().nullable(),
    location: z.string().optional().nullable(),
  })
  .passthrough();

export const EducationItemSchema = z
  .object({
    institution: z.string().optional().nullable(),
    name: z.string().optional().nullable(),
    url: z.string().optional().nullable(),
    area: z.string().optional().nullable(),
    fieldOfStudy: z.string().optional().nullable(),
    studyType: z.string().optional().nullable(),
    degree: z.string().optional().nullable(),
    startDate: z.string().optional().nullable(),
    endDate: z.string().optional().nullable(),
    score: z.string().optional().nullable(),
    gpa: z.union([z.string(), z.number()]).optional().nullable(),
    courses: z.array(z.union([z.string(), z.any()])).optional().nullable(),
    honors: z.array(z.union([z.string(), z.any()])).optional().nullable(),
  })
  .passthrough();

export const SkillItemSchema = z
  .object({
    name: z.string().optional().nullable(),
    categoryName: z.string().optional().nullable(),
    level: z.string().optional().nullable(),
    keywords: z.array(z.union([z.string(), z.any()])).optional().nullable(),
    skills: z.array(z.union([z.string(), z.any()])).optional().nullable(),
  })
  .passthrough();

export const ProjectItemSchema = z
  .object({
    name: z.string().optional().nullable(),
    title: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
    highlights: z.array(z.union([z.string(), z.any()])).optional().nullable(),
    bullets: z.array(z.union([z.string(), z.any()])).optional().nullable(),
    keywords: z.array(z.union([z.string(), z.any()])).optional().nullable(),
    technologies: z.array(z.union([z.string(), z.any()])).optional().nullable(),
    startDate: z.string().optional().nullable(),
    endDate: z.string().optional().nullable(),
    url: z.string().optional().nullable(),
    link: z.string().optional().nullable(),
    role: z.string().optional().nullable(),
  })
  .passthrough();

export const CertificateItemSchema = z
  .object({
    name: z.string().optional().nullable(),
    title: z.string().optional().nullable(),
    date: z.string().optional().nullable(),
    startDate: z.string().optional().nullable(),
    issueDate: z.string().optional().nullable(),
    issuer: z.string().optional().nullable(),
    awarder: z.string().optional().nullable(),
    url: z.string().optional().nullable(),
    credentialUrl: z.string().optional().nullable(),
    link: z.string().optional().nullable(),
  })
  .passthrough();

export const VolunteerItemSchema = z
  .object({
    organization: z.string().optional().nullable(),
    name: z.string().optional().nullable(),
    company: z.string().optional().nullable(),
    position: z.string().optional().nullable(),
    role: z.string().optional().nullable(),
    url: z.string().optional().nullable(),
    startDate: z.string().optional().nullable(),
    endDate: z.string().optional().nullable(),
    summary: z.string().optional().nullable(),
    highlights: z.array(z.union([z.string(), z.any()])).optional().nullable(),
    bullets: z.array(z.union([z.string(), z.any()])).optional().nullable(),
  })
  .passthrough();

export const AwardItemSchema = z
  .object({
    title: z.string().optional().nullable(),
    name: z.string().optional().nullable(),
    date: z.string().optional().nullable(),
    awarder: z.string().optional().nullable(),
    issuer: z.string().optional().nullable(),
    summary: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
  })
  .passthrough();

export const PublicationItemSchema = z
  .object({
    name: z.string().optional().nullable(),
    title: z.string().optional().nullable(),
    publisher: z.string().optional().nullable(),
    releaseDate: z.string().optional().nullable(),
    date: z.string().optional().nullable(),
    url: z.string().optional().nullable(),
    link: z.string().optional().nullable(),
    summary: z.string().optional().nullable(),
    authors: z.array(z.union([z.string(), z.any()])).optional().nullable(),
  })
  .passthrough();

export const ReferenceItemSchema = z
  .object({
    name: z.string().optional().nullable(),
    reference: z.string().optional().nullable(),
    company: z.string().optional().nullable(),
    relationship: z.string().optional().nullable(),
    contact: z.string().optional().nullable(),
    email: z.string().optional().nullable(),
    phone: z.string().optional().nullable(),
  })
  .passthrough();

/**
 * Strict ATS / JSON Resume AI Extraction Schema validated via Zod.
 */
export const ResumeAiSchema = z
  .object({
    basics: BasicsSchema,
    summary: z.string().optional().nullable(),
    work: z.array(WorkItemSchema).optional().nullable(),
    experience: z.array(WorkItemSchema).optional().nullable(),
    education: z.array(EducationItemSchema).optional().nullable(),
    skills: z.array(SkillItemSchema).optional().nullable(),
    projects: z.array(ProjectItemSchema).optional().nullable(),
    certificates: z.array(CertificateItemSchema).optional().nullable(),
    certifications: z.array(CertificateItemSchema).optional().nullable(),
    volunteer: z.array(VolunteerItemSchema).optional().nullable(),
    involvement: z.array(VolunteerItemSchema).optional().nullable(),
    awards: z.array(AwardItemSchema).optional().nullable(),
    publications: z.array(PublicationItemSchema).optional().nullable(),
    references: z.array(ReferenceItemSchema).optional().nullable(),
  })
  .passthrough();

export type ResumeAiData = z.infer<typeof ResumeAiSchema>;
