# AI-Powered ATS Resume Builder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a production-grade, modular, ATS-compliant multi-resume builder web application featuring split-screen editing, `@dnd-kit` drag-and-drop section/item reordering, item visibility toggling, reverse-chronological date sorting, local LLM (Ollama) bullet rewriting and ATS gap analysis, and 3-way parity exports to PDF (`@react-pdf/renderer`) and DOCX (`docx`).

**Architecture:** Next.js 15+ App Router with React 19, TypeScript, Tailwind CSS, and shadcn/ui. Client state is managed via Zustand with debounced Supabase persistence. Local LLM endpoints interface with Ollama with non-blocking health checks and fallbacks. Export pipelines maintain 100% parity across HTML preview, vector PDF, and native DOCX.

**Tech Stack:** Next.js (App Router, Server Actions), React 19, TypeScript, Tailwind CSS, Lucide React, Zustand, `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`, `@supabase/supabase-js`, `@supabase/ssr`, `@react-pdf/renderer`, `docx`, `ai` / Vercel AI SDK, `zod`, `vitest`.

**Spec:** `AGENTS.md`

## Global Constraints

- **Multi-Tenancy & Security:** All Supabase tables (`public.resumes`, `public.cover_letters`) enforce Row Level Security (RLS) where `auth.uid() = user_id`.
- **Three-Way Parity:** Any resume data field or template change must be synchronously implemented in:
  1. Live HTML Preview (`components/templates/`)
  2. PDF Exporter (`lib/export/pdf-generator.ts`)
  3. DOCX Exporter (`lib/export/docx-generator.ts`)
- **ATS Compliance Rules:**
  - Machine-readable vector text layer in PDF (no canvas, no image conversions).
  - ATS-safe font stacks (Helvetica, Times-Roman, Roboto).
  - Clear heading hierarchy (`H1`, `H2`), standard date formats (`YYYY-MM` or `Month YYYY`).
  - No graphical progress bars for skills (categorized text tags only).
- **Local LLM Degradation:** If Ollama daemon (`http://localhost:11434/v1`) is unreachable, deliver clear, non-blocking UI notifications with startup instructions rather than throwing unhandled client exceptions.
- **Section & Item Visibility:** Hidden items (`visible: false`) remain editable in the editor form but are completely excluded from live preview, PDF, and DOCX outputs.

---

### Task 1: Next.js Foundation, Package Dependencies & Test Setup

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `tailwind.config.ts`
- Create: `postcss.config.mjs`
- Create: `vitest.config.ts`
- Create: `app/globals.css`
- Create: `app/layout.tsx`
- Create: `app/page.tsx`
- Create: `lib/utils.ts`
- Test: `tests/sanity.test.ts`

**Interfaces:**
- Consumes: None (Root setup)
- Produces: Base Next.js app, Vitest test runner, Tailwind CSS tokens, `cn()` utility

- [ ] **Step 1: Create package.json with all required dependencies**

```json
{
  "name": "wiz-resume-builder",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@dnd-kit/core": "^6.3.1",
    "@dnd-kit/modifiers": "^9.0.0",
    "@dnd-kit/sortable": "^10.0.0",
    "@dnd-kit/utilities": "^3.2.2",
    "@radix-ui/react-accordion": "^1.2.3",
    "@radix-ui/react-alert-dialog": "^1.1.6",
    "@radix-ui/react-dialog": "^1.1.6",
    "@radix-ui/react-dropdown-menu": "^2.1.6",
    "@radix-ui/react-label": "^2.1.2",
    "@radix-ui/react-popover": "^1.1.6",
    "@radix-ui/react-progress": "^1.1.2",
    "@radix-ui/react-scroll-area": "^1.2.3",
    "@radix-ui/react-select": "^2.1.6",
    "@radix-ui/react-separator": "^1.1.2",
    "@radix-ui/react-slider": "^1.2.3",
    "@radix-ui/react-slot": "^1.1.2",
    "@radix-ui/react-switch": "^1.1.3",
    "@radix-ui/react-tabs": "^1.1.3",
    "@radix-ui/react-toast": "^1.2.6",
    "@radix-ui/react-tooltip": "^1.1.8",
    "@react-pdf/renderer": "^4.2.1",
    "@supabase/ssr": "^0.5.2",
    "@supabase/supabase-js": "^2.49.1",
    "ai": "^4.1.45",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "docx": "^9.2.0",
    "lucide-react": "^0.477.0",
    "next": "15.2.1",
    "react": "19.0.0",
    "react-dom": "19.0.0",
    "tailwind-merge": "^3.0.2",
    "tailwindcss-animate": "^1.0.7",
    "zod": "^3.24.2",
    "zustand": "^5.0.3"
  },
  "devDependencies": {
    "@types/node": "^22.13.9",
    "@types/react": "19.0.10",
    "@types/react-dom": "19.0.4",
    "postcss": "^8.5.3",
    "tailwindcss": "^3.4.17",
    "typescript": "^5.8.2",
    "vitest": "^3.0.8"
  }
}
```

- [ ] **Step 2: Create TypeScript and configuration files**

Create `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.mjs`, `vitest.config.ts`, and `lib/utils.ts`.

- [ ] **Step 3: Create sanity test to verify Vitest configuration**

```typescript
// tests/sanity.test.ts
import { describe, it, expect } from 'vitest';
import { cn } from '../lib/utils';

describe('Sanity & Utilities', () => {
  it('combines classnames with tailwind-merge', () => {
    expect(cn('px-2 py-1', 'px-4', { 'text-red-500': true })).toBe('py-1 px-4 text-red-500');
  });
});
```

- [ ] **Step 4: Install dependencies and run tests**

Run: `npm install && npm test`
Expected: PASS 1/1 tests

- [ ] **Step 5: Commit**

```bash
git add package.json tsconfig.json next.config.ts tailwind.config.ts postcss.config.mjs vitest.config.ts lib/utils.ts app/ tests/
git commit -m "feat: initialize Next.js app with Tailwind, shadcn utilities, and Vitest"
```

---

### Task 2: Supabase SSR Client, Database Migration & Auth Pages

**Files:**
- Create: `supabase/migrations/001_init.sql` (already created)
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/server.ts`
- Create: `lib/supabase/middleware.ts`
- Create: `middleware.ts`
- Create: `app/(auth)/login/page.tsx`
- Create: `app/(auth)/signup/page.tsx`
- Create: `app/(auth)/auth-actions.ts`
- Test: `tests/supabase-config.test.ts`

**Interfaces:**
- Consumes: `@supabase/ssr`, `@supabase/supabase-js`
- Produces: `createClient()` for browser, `createClient()` for server/cookies, auth middleware protection for `/dashboard` and `/editor`

- [ ] **Step 1: Implement Supabase client and server factories**

Create `lib/supabase/client.ts` for browser interactions, `lib/supabase/server.ts` using Next.js `cookies()`, and `lib/supabase/middleware.ts` for session refresh.

- [ ] **Step 2: Implement Next.js root middleware to guard protected routes**

Route guard ensures unauthenticated users trying to access `/dashboard`, `/editor`, or `/cover-letters` are redirected to `/login`.

- [ ] **Step 3: Implement Auth Forms and Server Actions (`login`, `signup`, `signout`)**

Build clean UI forms in `app/(auth)/login/page.tsx` and `app/(auth)/signup/page.tsx` with email/password authentication.

- [ ] **Step 4: Write tests for Supabase configuration and URL/Key fallbacks**

```typescript
// tests/supabase-config.test.ts
import { describe, it, expect } from 'vitest';
import { createBrowserClient } from '@supabase/ssr';

describe('Supabase Client Initializer', () => {
  it('creates browser client with valid env vars or fallback', () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock.supabase.co';
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-anon-key';
    const client = createBrowserClient(url, key);
    expect(client).toBeDefined();
    expect(client.auth).toBeDefined();
  });
});
```

- [ ] **Step 5: Run tests and commit**

Run: `npm test tests/supabase-config.test.ts`
Expected: PASS

```bash
git add lib/supabase/ middleware.ts app/\(auth\)/ tests/supabase-config.test.ts
git commit -m "feat: setup Supabase SSR auth client, middleware guard, and login/signup pages"
```

---

### Task 3: Resume Contracts, Reverse-Chronological Date Sorter & Unit Tests

**Files:**
- Modify/Verify: `types/resume.ts`
- Modify/Verify: `lib/utils/date-sorter.ts`
- Test: `tests/date-sorter.test.ts`

**Interfaces:**
- Consumes: `types/resume.ts`
- Produces: `sortExperiencesByDate`, `sortProjectsByDate`, `sortEducationByDate`, `sortInvolvementsByDate`, `sortCertificationsByDate`, `sortAwardsByDate`

- [ ] **Step 1: Write comprehensive unit test suite for date sorting**

Cover cases:
1. `current: true` or `endDate: 'Present'` sorting to top.
2. Standard ISO `YYYY-MM` date comparisons.
3. Plain `YYYY` year comparisons.
4. Tied end dates falling back to start date comparison.
5. Preserving/updating array `order` property indices.

```typescript
// tests/date-sorter.test.ts
import { describe, it, expect } from 'vitest';
import { sortExperiencesByDate, sortEducationByDate } from '../lib/utils/date-sorter';
import { ExperienceItem, EducationItem } from '../types/resume';

describe('Date Sorter Utility', () => {
  it('sorts current experience to the top above past experiences', () => {
    const items: ExperienceItem[] = [
      { id: '1', company: 'Old Corp', role: 'Dev', startDate: '2020-01', endDate: '2022-01', current: false, bullets: [], visible: true, order: 0 },
      { id: '2', company: 'Now Corp', role: 'Senior Dev', startDate: '2022-02', current: true, bullets: [], visible: true, order: 1 },
      { id: '3', company: 'Mid Corp', role: 'Dev II', startDate: '2021-01', endDate: '2023-01', current: false, bullets: [], visible: true, order: 2 }
    ];
    const sorted = sortExperiencesByDate(items);
    expect(sorted[0].id).toBe('2'); // Current
    expect(sorted[1].id).toBe('3'); // 2023-01
    expect(sorted[2].id).toBe('1'); // 2022-01
    expect(sorted.map(s => s.order)).toEqual([0, 1, 2]);
  });
});
```

- [ ] **Step 2: Run test to verify all date sorting algorithms pass**

Run: `npm test tests/date-sorter.test.ts`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add types/resume.ts lib/utils/date-sorter.ts tests/date-sorter.test.ts
git commit -m "feat: implement resume data contracts and reverse-chronological date sorter"
```

---

### Task 4: Zustand State Store with Undo/Redo, DND Reordering & Debounced Auto-Save

**Files:**
- Modify/Verify: `store/useResumeStore.ts`
- Test: `tests/resume-store.test.ts`

**Interfaces:**
- Consumes: `types/resume.ts`, `lib/utils/date-sorter.ts`
- Produces: `useResumeStore` hook for full application state, drag-drop reordering, visibility toggling, undo/redo, and debounced auto-save.

- [ ] **Step 1: Write unit tests covering all store actions**

```typescript
// tests/resume-store.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useResumeStore } from '../store/useResumeStore';

describe('useResumeStore', () => {
  beforeEach(() => {
    useResumeStore.getState().resetResume();
  });

  it('updates contact info and marks store as dirty', () => {
    const store = useResumeStore.getState();
    store.updateContact({ fullName: 'John Doe', email: 'john@example.com' });
    expect(useResumeStore.getState().data.contact.fullName).toBe('John Doe');
    expect(useResumeStore.getState().isDirty).toBe(true);
  });

  it('reorders sections via moveSection', () => {
    const store = useResumeStore.getState();
    store.moveSection('experience', 'contact');
    const order = useResumeStore.getState().sectionOrder;
    expect(order[0]).toBe('experience');
  });

  it('adds, updates, toggles visibility, and removes items', () => {
    const store = useResumeStore.getState();
    store.addItem('experience', {
      id: 'exp-1',
      company: 'Acme',
      role: 'Engineer',
      startDate: '2023-01',
      current: true,
      bullets: ['Built systems'],
      visible: true,
      order: 0,
    });
    expect(useResumeStore.getState().data.experience.length).toBe(1);

    store.toggleItemVisibility('experience', 'exp-1');
    expect(useResumeStore.getState().data.experience[0].visible).toBe(false);

    store.removeItem('experience', 'exp-1');
    expect(useResumeStore.getState().data.experience.length).toBe(0);
  });

  it('performs undo and redo', () => {
    const store = useResumeStore.getState();
    store.setTitle('Version 1');
    store.setTitle('Version 2');
    expect(useResumeStore.getState().title).toBe('Version 2');

    store.undo();
    expect(useResumeStore.getState().title).toBe('Version 1');

    store.redo();
    expect(useResumeStore.getState().title).toBe('Version 2');
  });
});
```

- [ ] **Step 2: Run store tests**

Run: `npm test tests/resume-store.test.ts`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add store/useResumeStore.ts tests/resume-store.test.ts
git commit -m "feat: complete Zustand store with undo/redo, DND reordering, and debounced auto-save"
```

---

### Task 5: Local LLM Engine (Ollama) & ATS Analyzer Utility

**Files:**
- Create: `lib/ai/local-client.ts`
- Create: `lib/utils/ats-analyzer.ts`
- Create: `app/api/ai/bullet-rewrite/route.ts`
- Create: `app/api/ai/ats-audit/route.ts`
- Create: `app/api/ai/cover-letter/route.ts`
- Test: `tests/ats-analyzer.test.ts`
- Test: `tests/local-ai-client.test.ts`

**Interfaces:**
- Consumes: Local Ollama endpoint (`http://localhost:11434/v1`) or mock fallback
- Produces:
  - `checkOllamaHealth(): Promise<{ available: boolean; models: string[]; message?: string }>`
  - `rewriteBulletPoints(rawText: string, context?: string): Promise<string[]>`
  - `analyzeAtsScore(resume: ResumeData, jobDescription?: string): AtsAnalysisResult`
  - `generateCoverLetter(resume: ResumeData, jobTitle: string, company: string): Promise<string>`

- [ ] **Step 1: Implement ATS Analyzer utility (`lib/utils/ats-analyzer.ts`)**

Evaluates format completeness (contact, summary, bullet count, action verbs, quantified metrics) and keyword match percentage against target job descriptions.

- [ ] **Step 2: Implement Local LLM client (`lib/ai/local-client.ts`) with health check & Google X-Y-Z prompts**

Includes timeout safety, health ping, structured JSON parsing, and graceful degradation returning rule-based bullet points if local Ollama daemon is offline.

- [ ] **Step 3: Create API Routes for Bullet Rewrite, ATS Audit, and Cover Letter**

`app/api/ai/bullet-rewrite/route.ts`, `app/api/ai/ats-audit/route.ts`, and `app/api/ai/cover-letter/route.ts`.

- [ ] **Step 4: Write unit tests for ATS Analyzer and Local AI fallback**

```typescript
// tests/ats-analyzer.test.ts
import { describe, it, expect } from 'vitest';
import { analyzeAtsScore } from '../lib/utils/ats-analyzer';
import { INITIAL_RESUME_DATA } from '../types/resume';

describe('ATS Analyzer Engine', () => {
  it('calculates score penalties for missing contact info and empty sections', () => {
    const emptyResult = analyzeAtsScore(INITIAL_RESUME_DATA);
    expect(emptyResult.score).toBeLessThan(40);
    expect(emptyResult.issues.length).toBeGreaterThan(0);
  });

  it('matches keywords from job description against resume content', () => {
    const populated = {
      ...INITIAL_RESUME_DATA,
      contact: { fullName: 'Jane Dev', email: 'jane@dev.com', phone: '1234567890', location: 'Remote' },
      summary: { text: 'Expert TypeScript and Next.js engineer with React experience', visible: true },
    };
    const jobDesc = 'Looking for an experienced Next.js, TypeScript, and React developer with PostgreSQL skills.';
    const result = analyzeAtsScore(populated, jobDesc);
    expect(result.matchedKeywords).toContain('typescript');
    expect(result.matchedKeywords).toContain('next.js');
    expect(result.missingKeywords).toContain('postgresql');
  });
});
```

- [ ] **Step 5: Run tests and commit**

Run: `npm test tests/ats-analyzer.test.ts`
Expected: PASS

```bash
git add lib/ai/ lib/utils/ats-analyzer.ts app/api/ai/ tests/ats-analyzer.test.ts
git commit -m "feat: implement local LLM engine, health checks, ATS analyzer, and AI API routes"
```

---

### Task 6: HTML Resume Templates (Classic ATS, Modern Minimal, Executive)

**Files:**
- Create: `components/templates/ClassicAts.tsx`
- Create: `components/templates/ModernMinimal.tsx`
- Create: `components/templates/Executive.tsx`
- Create: `components/templates/TemplateRenderer.tsx`
- Test: `tests/template-renderer.test.tsx`

**Interfaces:**
- Consumes: `ResumeData`, `SectionKey[]`, `TemplateId`
- Produces: Live HTML A4 templates with synchronized section ordering and item-level visibility filtering.

- [ ] **Step 1: Build Classic ATS Template (`components/templates/ClassicAts.tsx`)**

Standard single-column, ATS-optimized layout with uppercase section headers, horizontal divider lines, right-aligned dates/locations, and bulleted achievements.

- [ ] **Step 2: Build Modern Minimal Template (`components/templates/ModernMinimal.tsx`)**

Sleek, minimalist header, compact tag-based skills display, and clean typography.

- [ ] **Step 3: Build Executive Template (`components/templates/Executive.tsx`)**

Prominent executive summary banner, highlighted key competencies grid, and formal typography.

- [ ] **Step 4: Build TemplateRenderer with section sorting and visibility filtering**

Renders sections strictly according to `sectionOrder` prop and excludes any item with `visible === false`.

- [ ] **Step 5: Commit**

```bash
git add components/templates/
git commit -m "feat: implement Classic ATS, Modern Minimal, and Executive HTML resume templates"
```

---

### Task 7: Vector PDF (`@react-pdf/renderer`) and Native DOCX (`docx`) Exporters

**Files:**
- Create: `lib/export/pdf-generator.ts`
- Create: `lib/export/docx-generator.ts`
- Create: `app/api/export/pdf/[id]/route.ts`
- Create: `app/api/export/docx/[id]/route.ts`
- Test: `tests/export-parity.test.ts`

**Interfaces:**
- Consumes: `ResumeRecord` / `ResumeData`
- Produces:
  - `generateResumePdfBlob(resume: ResumeData, templateId: TemplateId, sectionOrder: SectionKey[]): Promise<Buffer | Blob>`
  - `generateResumeDocxBuffer(resume: ResumeData, sectionOrder: SectionKey[]): Promise<Buffer>`
  - Downloadable API endpoints `/api/export/pdf/[id]` and `/api/export/docx/[id]`

- [ ] **Step 1: Implement ATS Vector PDF generator using `@react-pdf/renderer`**

Ensure 100% selectable text layer, ATS standard fonts (Helvetica), standard 0.5 in margins, and multi-page flow.

- [ ] **Step 2: Implement native DOCX generator using `docx`**

Use native `HeadingLevel.HEADING_1`, `HeadingLevel.HEADING_2`, right-aligned tab stops for dates/locations, and bullet formatting.

- [ ] **Step 3: Implement export API routes for PDF and DOCX download**

Fetch resume record from Supabase, run generator, and stream response with `Content-Disposition: attachment; filename="..."`.

- [ ] **Step 4: Write test verifying export generator functions construct valid buffers**

```typescript
// tests/export-parity.test.ts
import { describe, it, expect } from 'vitest';
import { generateResumeDocxBuffer } from '../lib/export/docx-generator';
import { INITIAL_RESUME_DATA, DEFAULT_SECTION_ORDER } from '../types/resume';

describe('Export Generators', () => {
  it('generates DOCX buffer successfully with initial resume data', async () => {
    const buffer = await generateResumeDocxBuffer(INITIAL_RESUME_DATA, DEFAULT_SECTION_ORDER);
    expect(buffer).toBeDefined();
    expect(buffer.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 5: Run tests and commit**

Run: `npm test tests/export-parity.test.ts`
Expected: PASS

```bash
git add lib/export/ app/api/export/ tests/export-parity.test.ts
git commit -m "feat: implement ATS vector PDF generator, native DOCX exporter, and export routes"
```

---

### Task 8: Dual-Pane Live Editor with `@dnd-kit` Reordering & Live Preview

**Files:**
- Create: `components/ui/` (shadcn Button, Input, Textarea, Card, Accordion, Switch, Tabs, Slider, Dialog, Tooltip)
- Create: `components/editor/EditorSidebar.tsx`
- Create: `components/editor/SectionContainer.tsx`
- Create: `components/editor/SortableItem.tsx`
- Create: `components/editor/sections/ContactSection.tsx`
- Create: `components/editor/sections/SummarySection.tsx`
- Create: `components/editor/sections/ExperienceSection.tsx`
- Create: `components/editor/sections/ProjectsSection.tsx`
- Create: `components/editor/sections/EducationSection.tsx`
- Create: `components/editor/sections/SkillsSection.tsx`
- Create: `components/editor/sections/CertificationsSection.tsx`
- Create: `components/editor/sections/InvolvementSection.tsx`
- Create: `components/editor/sections/AwardsSection.tsx`
- Create: `components/editor/sections/PublicationsSection.tsx`
- Create: `components/editor/sections/ReferencesSection.tsx`
- Create: `components/editor/LivePreviewPane.tsx`
- Create: `app/(dashboard)/editor/[id]/page.tsx`

**Interfaces:**
- Consumes: `useResumeStore`, `@dnd-kit/core`, `@dnd-kit/sortable`, `components/templates/`
- Produces: Interactive split-screen editor with left accordion form and right real-time paginated A4 preview.

- [ ] **Step 1: Implement base UI components (Button, Input, Textarea, Switch, Accordion, Card, Tabs, Badge)**

- [ ] **Step 2: Implement DND wrappers (`SectionContainer.tsx`, `SortableItem.tsx`)**

Supports drag handles for reordering top-level sections as well as inner items in collections.

- [ ] **Step 3: Implement individual form sections with visibility switches & date auto-sort buttons**

Each section has item-level visibility toggles, add/edit/delete actions, and instant `"Sort by Date"` trigger.

- [ ] **Step 4: Implement `LivePreviewPane.tsx` with Zoom, Template Selector & Export Buttons**

Includes zoom slider (50%–150%), template switcher, print preview, and instant PDF/DOCX download triggers.

- [ ] **Step 5: Assemble `app/(dashboard)/editor/[id]/page.tsx`**

Synchronized dual-pane layout (`lg:grid-cols-2` or resizable columns) with auto-save indicator (`Saved`, `Saving...`, `Unsaved changes`).

- [ ] **Step 6: Commit**

```bash
git add components/ui/ components/editor/ app/\(dashboard\)/editor/
git commit -m "feat: build split-screen editor with @dnd-kit reordering, section forms, and live preview"
```

---

### Task 9: AI In-Line Bullet Optimizer & ATS Review Drawer

**Files:**
- Create: `components/editor/AIBulletHelper.tsx`
- Create: `components/editor/AIReviewDrawer.tsx`
- Modify: `components/editor/sections/ExperienceSection.tsx`
- Modify: `components/editor/sections/ProjectsSection.tsx`
- Modify: `components/editor/EditorSidebar.tsx`

**Interfaces:**
- Consumes: `app/api/ai/bullet-rewrite`, `app/api/ai/ats-audit`, `useResumeStore`
- Produces:
  - In-line popup for rewriting bullets using Google X-Y-Z formula.
  - Side drawer showing 0-100 ATS score gauge, formatting flags, and job description keyword matcher.

- [ ] **Step 1: Implement `AIBulletHelper.tsx` modal / popover**

Allows user to paste a rough accomplishment, select rewriting tone, click "Optimize with AI", and preview/accept the generated Google X-Y-Z bullets.

- [ ] **Step 2: Connect AI Bullet Helper into Experience and Project bullet editors**

- [ ] **Step 3: Implement `AIReviewDrawer.tsx`**

Features:
- Visual score circle (0–100 with color gradient: red < 60, amber 60–79, green 80+).
- Formatted issues list (clickable to jump to section).
- Target Job Description textarea with instant keyword gap analysis (matched vs missing keywords).

- [ ] **Step 4: Commit**

```bash
git add components/editor/AIBulletHelper.tsx components/editor/AIReviewDrawer.tsx components/editor/
git commit -m "feat: add AI bullet optimizer modal and comprehensive ATS audit review drawer"
```

---

### Task 10: Multi-Resume Dashboard & AI Cover Letter Generator

**Files:**
- Create: `app/(dashboard)/dashboard/page.tsx`
- Create: `app/(dashboard)/cover-letters/page.tsx`
- Create: `app/api/resumes/route.ts`
- Create: `app/api/resumes/[id]/route.ts`
- Create: `components/dashboard/ResumeCard.tsx`
- Create: `components/dashboard/CreateResumeDialog.tsx`
- Create: `components/dashboard/CoverLetterGeneratorModal.tsx`
- Modify: `app/page.tsx` (Landing page)

**Interfaces:**
- Consumes: Supabase database, `useResumeStore`, `app/api/ai/cover-letter`
- Produces: Complete multi-resume management dashboard, resume duplication/deletion, and one-click tailored cover letter builder.

- [ ] **Step 1: Implement Resume CRUD API routes (`/api/resumes`, `/api/resumes/[id]`)**

Supports creating new resumes, cloning existing resumes, updating content (auto-save endpoint), and deleting.

- [ ] **Step 2: Implement Dashboard View (`app/(dashboard)/dashboard/page.tsx`)**

Displays grid of user's resumes with live thumbnail previews, ATS score badges, template tags, last modified timestamps, and actions (Edit, Duplicate, Download, Delete).

- [ ] **Step 3: Implement Cover Letter Generator (`app/(dashboard)/cover-letters/page.tsx`)**

Select base resume, input target company & job title, generate tailored cover letter via local LLM, edit in-place, and export to PDF/DOCX.

- [ ] **Step 4: Implement modern landing page (`app/page.tsx`) showcasing features and CTA**

- [ ] **Step 5: Run full test suite and TypeScript validation**

Run: `npm test && npm run typecheck`
Expected: ALL PASS with 0 type errors

- [ ] **Step 6: Commit**

```bash
git add app/\(dashboard\)/ components/dashboard/ app/api/resumes/ app/page.tsx
git commit -m "feat: implement multi-resume dashboard, cover letter generator, and landing page"
```
