# AGENTS.md — AI-Powered ATS Resume Builder

## 1. Project Overview & Architecture
This repository contains a modular, ATS-compliant, multi-resume builder web application inspired by **Rezi.ai**. The application features split-screen editing (form inputs on the left, live real-time preview on the right), drag-and-drop section reordering, item-level visibility toggles, date-based auto-sorting, local LLM-assisted bullet generation/ATS auditing, and client/server-side exports to PDF and DOCX.

### Core Stack
- **Framework:** Next.js (App Router, Server Actions, React 19)
- **Language:** TypeScript (strict mode enabled)
- **Styling & UI:** Tailwind CSS, shadcn/ui, Lucide Icons
- **Drag & Drop:** `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`
- **Database & Auth:** Supabase (PostgreSQL, Row Level Security, Auth SSR)
- **Local LLM Engine:** Ollama / Local OpenAI-compatible API (`http://localhost:11434/v1`) using `ai` (Vercel AI SDK) or native fetch with streaming structured outputs (Zod)
- **Document Exporters:**
  - PDF: `@react-pdf/renderer` (for vector text and machine-readable ATS compliance)
  - DOCX: `docx` (native `.docx` file generator)

---

## 2. Agent Personas & Division of Labor

When implementing features, agents must operate under one of the following roles:

### 1. Database & Security Agent (`db-agent`)
- Manages Supabase migrations, typed schemas, and RLS policies.
- Enforces multi-tenancy: users can only view, mutate, or delete their own resumes and generated cover letters.
- Maintains JSON schema validation for resume data structures.

### 2. Editor & Layout Agent (`ui-agent`)
- Implements the dual-pane desktop editor: Left = Accordion Form + AI Prompter; Right = Live Paginated A4 View.
- Configures `@dnd-kit` for vertical drag-and-drop sorting of sections and inner items.
- Manages local client state using Zustand (with auto-save debouncing to Supabase).
- Ensures responsive layouts: stacked accordion tabs on mobile/tablet; synchronized side-by-side on desktop (`lg:` breakpoint).

### 3. AI & ATS Intelligence Agent (`ai-agent`)
- Interfaces with local LLM instances (e.g., Llama 3, Mistral, Qwen 2.5) via Ollama.
- Implements prompts for:
  - Bullet point rewriting using the Google X-Y-Z formula (`"Accomplished [X] as measured by [Y], by doing [Z]"`).
  - Target job description parsing and keyword extraction.
  - ATS resume scoring (0–100) and gap analysis (missing keywords, formatting flags).
  - One-click tailored Cover Letter generation based on active resume content.

### 4. Export & ATS Compliance Agent (`export-agent`)
- Ensures generated outputs strictly conform to ATS guidelines:
  - Machine-readable plain text layer (no SVG paths for letters, no unselectable canvas).
  - Single/standard multi-column hierarchy with clean heading semantic structures (`H1`, `H2`, standard date formats).
  - No graphical progress bars for skills (replaced with categorized text tags).
- Maintains parity between the on-screen live preview, the `@react-pdf/renderer` PDF, and the `docx` builder.

---

## 3. Data Models & Database Schema

### Database Schema (`supabase/migrations/001_init.sql`)

```sql
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- RESUMES TABLE
create table public.resumes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null default 'Untitled Resume',
  slug text not null,
  template_id text not null default 'classic-ats',
  section_order jsonb not null default '[
    "contact", "summary", "experience", "projects", "education",
    "skills", "certifications", "involvement", "awards", "publications", "references"
  ]'::jsonb,
  content jsonb not null default '{}'::jsonb,
  ats_score integer default 0,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- COVER LETTERS TABLE
create table public.cover_letters (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  resume_id uuid references public.resumes(id) on delete set null,
  job_title text not null,
  company_name text not null,
  content text not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- ENABLE ROW LEVEL SECURITY
alter table public.resumes enable row level security;
alter table public.cover_letters enable row level security;

-- POLICIES
create policy "Users can CRUD their own resumes"
  on public.resumes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can CRUD their own cover letters"
  on public.cover_letters for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

### TypeScript Data Contracts (`types/resume.ts`)

```typescript
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
  startDate: string; // ISO string: YYYY-MM
  endDate?: string;  // ISO string or 'Present'
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
  categoryName: string; // e.g., "Languages", "Frameworks"
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
```

---

## 4. Section Sorting & Visibility Rules

1. **Section-Level Drag & Drop:**
* Managed via the `section_order` array in state.
* Any section can be hidden globally by toggling its metadata flag without clearing its inner content.

2. **Item-Level Show/Hide:**
* Every entry inside collections (`experience`, `projects`, etc.) contains a `visible: boolean` property.
* Hidden items remain editable in the dashboard form but are completely excluded from PDF, DOCX, and live preview rendering.

3. **Date Sorting Algorithm:**
* Provide both manual drag-sorting and an instant `"Sort by Date (Reverse Chronological)"` utility for chronological sections (`experience`, `education`, `projects`, `involvement`, `certifications`, `awards`).
* Entries with `current: true` or `endDate: 'Present'` must always sort to the top of the date index.

---

## 5. Local LLM Service Architecture

### Configuration
* Base URL: `process.env.LOCAL_LLM_BASE_URL || "http://localhost:11434/v1"`
* Model Identifier: `process.env.LOCAL_LLM_MODEL || "llama3.2:latest"`

### Prompts & AI Tools

#### 1. Bullet Point Optimizer (Google X-Y-Z Schema)

```typescript
export const BULLET_OPTIMIZER_PROMPT = `
You are an expert resume writer specializing in ATS optimization.
Rewrite the following raw job achievement into 2-3 high-impact bullet points.
Rules:
- Apply the Google X-Y-Z framework: "Accomplished [X] as measured by [Y], by doing [Z]".
- Start with a strong action verb in the past tense (or present for current roles).
- Eliminate filler words and first-person pronouns ("I", "my", "we").
- Keep each bullet between 15 and 30 words.
- Return ONLY a JSON array of strings: ["bullet 1", "bullet 2"]
`;
```

#### 2. ATS Audit & Review Engine

The Review section executes a dual assessment:
* **Format Review:** Checks if contact items are complete, dates are parseable, and bullets have metrics.
* **Job Description Matcher:** Takes target job description text, parses required hard/soft skills, checks against active resume sections, and outputs:
  * Match Score (0–100)
  * Missing keywords list
  * Section-by-section improvement recommendations

---

## 6. Document Generation Standards

### PDF Pipeline (`@react-pdf/renderer`)
* Never use HTML-to-Canvas or image conversions; the final PDF must have selectable, highlightable text for ATS parsers.
* Use standard standard-safe fonts: Helvetica, Times-Roman, or Roboto.
* Margins: 0.5 in to 0.75 in (configurable via template styling).
* Suppress broken links: wrap all URLs in clickable `<Link>` components while retaining visible plain text URLs.

### DOCX Pipeline (`docx`)
* Construct document tables and headings using standard Word structural tags (`HeadingLevel.HEADING_1`, `HeadingLevel.HEADING_2`).
* Set page margins to standard 720 twips (0.5 inch) or 1440 twips (1.0 inch).
* Use native tab stops for right-aligned dates and locations.

---

## 7. Directory Structure

```text
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (dashboard)/
│   │   ├── dashboard/page.tsx           # Multi-resume list view
│   │   ├── editor/[id]/page.tsx         # Split-screen live editor
│   │   └── cover-letters/page.tsx       # AI cover letter generator
│   ├── api/
│   │   ├── ai/
│   │   │   ├── bullet-rewrite/route.ts
│   │   │   ├── ats-audit/route.ts
│   │   │   └── cover-letter/route.ts
│   │   └── export/
│   │       ├── pdf/[id]/route.ts
│   │       └── docx/[id]/route.ts
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── editor/
│   │   ├── EditorSidebar.tsx
│   │   ├── SectionContainer.tsx         # Handles @dnd-kit vertical dragging
│   │   ├── sections/                    # Contact, Exp, Projects, etc.
│   │   ├── AIReviewDrawer.tsx           # ATS score and missing keywords
│   │   └── LivePreviewPane.tsx          # Virtualized A4 preview
│   ├── templates/
│   │   ├── ClassicAts.tsx
│   │   ├── ModernMinimal.tsx
│   │   └── Executive.tsx
│   └── ui/                              # shadcn components
├── lib/
│   ├── ai/
│   │   └── local-client.ts              # Local LLM wrapper & fallback handler
│   ├── export/
│   │   ├── pdf-generator.ts
│   │   └── docx-generator.ts
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   └── utils/
│       ├── date-sorter.ts
│       └── ats-analyzer.ts
├── store/
│   └── useResumeStore.ts                # Zustand store with undo/redo & debounced sync
├── types/
│   └── resume.ts
└── AGENTS.md
```

---

## 8. Agent Step-by-Step Implementation Protocol

When executing tasks, follow this order:

1. **Verify Database Contracts:** Confirm schema mutations in `types/resume.ts` match Supabase tables before building UI components.
2. **Component Isolation:** Build form sections in `components/editor/sections/` independently, ensuring each section has its own `visibility` toggle and `@dnd-kit` item-sorting wrapper.
3. **Template Parity:** Whenever a field is added to a section, immediately update all three rendering targets:
   * Live HTML Preview (`components/templates/`)
   * PDF Builder (`lib/export/pdf-generator.ts`)
   * DOCX Builder (`lib/export/docx-generator.ts`)
4. **Local LLM Degradation Handling:** Wrap local LLM calls with health checks. If the Ollama/local instance is unreachable at `http://localhost:11434`, deliver actionable user notifications with instructions on starting the local daemon rather than throwing unhandled client exceptions.
