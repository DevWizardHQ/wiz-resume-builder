# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
**wiz-resume-builder** is a production-ready, ATS-compliant, multi-resume builder web application inspired by Rezi.ai. It features:
- **Split-Screen Live Editor**: Form accordion and AI helpers on the left; live paginated A4 preview on the right (`/editor/[id]`).
- **Drag-and-Drop Reordering**: Section-level and item-level reordering powered by `@dnd-kit/core` and `@dnd-kit/sortable`.
- **Item-Level Visibility & Auto-Sorting**: Granular `visible: boolean` controls per item and UTC-based reverse-chronological auto-sorting (`lib/utils/date-sorter.ts`) prioritizing active positions (`Number.MAX_SAFE_INTEGER`).
- **Local AI & ATS Auditing**: Local Ollama LLM integration (`/api/ai/*`) for Google X-Y-Z formula bullet rewriting, 0–100 ATS scoring with keyword gap analysis, and tailored cover letters, with offline rule-based fallbacks.
- **3-Way Layout Parity**: Complete visual and content synchronization across HTML preview (`components/templates/`), vector selectable text PDF (`@react-pdf/renderer`), and native Word documents (`docx`).
- **Database & SSR Auth**: Multi-tenant database and session management with Supabase and Row Level Security (`auth.uid() = user_id`).

---

## Tech Stack
- **Framework:** Next.js 15 (App Router, Server Actions, React 19)
- **Language:** TypeScript (strict mode, 0 errors on `tsc --noEmit`)
- **Styling:** Tailwind CSS, Lucide React icons
- **Drag & Drop:** `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`
- **State Management:** Zustand with deep-cloned 30-step undo/redo history and 1500ms debounced persistence (`store/useResumeStore.ts`)
- **Database & Auth:** Supabase (`@supabase/ssr`, `@supabase/supabase-js`, PostgreSQL RLS)
- **Testing:** Vitest with jsdom environment (161+ unit and integration tests across 12 test files)
- **AI & ATS Engine:** Ollama (`http://localhost:11434/v1`) with heuristic fallback engines (`lib/ai/`)
- **Document Generation:**
  - PDF: `@react-pdf/renderer` (Vector selectable text layer, Helvetica ATS-compliant font)
  - DOCX: `docx` (Native OpenXML generator with 9360 dxa right-aligned tab stops)

---

## Development & Test Commands
```bash
# Development
npm run dev           # Start Next.js development server (http://localhost:3000)
npm run build         # Build production bundle
npm run start         # Start production server
npm run typecheck     # Validate TypeScript types (tsc --noEmit)
npm run lint          # Run ESLint validation

# Testing with Vitest
npm test              # Run all unit and integration tests (vitest run)
npm run test:watch    # Run tests in interactive watch mode
npx vitest tests/resume-store.test.ts   # Run a single test file
```

---

## Codebase Architecture & Key Files

### 1. Data Contracts & State Store
- `types/resume.ts`: Strict TypeScript interfaces for all 11 resume sections (`ContactInfo`, `ExperienceItem`, `ProjectItem`, `EducationItem`, `SkillCategory`, `CertificationItem`, `InvolvementItem`, `AwardItem`, `PublicationItem`, `ReferenceItem`, `ResumeData`, `ResumeRecord`, `TemplateId`, `SectionKey`).
- `store/useResumeStore.ts`: Zustand store managing resume state, item CRUD, vertical section reordering, date auto-sorting, deep-cloned undo/redo history snapshots, and debounced auto-saving.
- `lib/utils/date-sorter.ts`: Non-mutating reverse-chronological sorting engine utilizing explicit UTC date parsing and safe `-Infinity` score comparison.

### 2. Live Templates & Multi-Target Export Parity
Whenever a section or field is modified in `types/resume.ts`, ensure all 3 targets remain synchronized:
1. **Live HTML Preview:**
   - `components/templates/TemplateRenderer.tsx`
   - `components/templates/ClassicAtsTemplate.tsx`
   - `components/templates/ModernMinimalTemplate.tsx`
   - `components/templates/ExecutiveTemplate.tsx`
2. **Vector PDF Exporter:** `lib/export/pdf-generator.tsx` (`@react-pdf/renderer`)
3. **Native DOCX Exporter:** `lib/export/docx-generator.ts` (`docx`)

### 3. AI & ATS Analyzer Engine
- `lib/ai/local-ai-client.ts`: Ollama client with timeout checks and structured parsing.
- `lib/ai/ats-analyzer.ts`: Heuristic and LLM-assisted ATS scoring (0–100), section audits, keyword matching, and action verb detectors.
- `app/api/ai/bullet-rewrite/route.ts`: Google X-Y-Z bullet optimization endpoint with tone selection.
- `app/api/ai/ats-audit/route.ts`: Resume-to-job description keyword gap analysis endpoint.
- `app/api/ai/cover-letter/route.ts`: AI-generated tailored cover letter synthesis endpoint.

### 4. Split-Screen Editor & Interactive UI
- `app/(dashboard)/editor/[id]/page.tsx`: Dynamic editor route loading resume record into the Zustand store.
- `components/editor/EditorSidebar.tsx`: Accordion form with section drag-and-drop handles.
- `components/editor/LivePreviewPane.tsx`: Real-time paginated A4 preview with zoom and template switcher.
- `components/editor/AIBulletHelper.tsx`: In-line achievement rewriting dialog.
- `components/editor/AIReviewDrawer.tsx`: Slide-over ATS score meter and keyword gap analyzer.

### 5. Multi-Resume Dashboard & Workspace
- `app/(dashboard)/dashboard/page.tsx`: Multi-resume management dashboard with clone, create, and delete modals.
- `app/(dashboard)/cover-letters/page.tsx`: AI Cover Letter Studio with live export to PDF and DOCX.
- `app/page.tsx`: High-converting landing page with interactive editor preview.
- `app/api/resumes/route.ts` & `app/api/resumes/[id]/route.ts`: Resume CRUD and debounced persistence endpoints with Supabase integration and offline fallback mocks.

---

## Core Development Principles
1. **Zero Layout Drift:** Any change in resume content or layout must render identically across the Web preview, Vector PDF, and DOCX.
2. **Deterministic Offline Fallbacks:** All AI and database operations must gracefully degrade to offline mock data and rule-based heuristics when local Ollama or Supabase are not active.
3. **Immutability in Store & Sorters:** Always deep-clone nested arrays and objects when creating history snapshots to prevent state leakage.
