# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
**wiz-resume-builder** is a modular, ATS-compliant, multi-resume builder web application inspired by Rezi.ai. It features split-screen editing (accordion form + AI prompter on the left, live paginated A4 preview on the right), drag-and-drop section and item reordering (`@dnd-kit`), item-level visibility toggles, reverse-chronological auto-sorting, local LLM-assisted bullet optimization (Google X-Y-Z formula) & ATS auditing via Ollama, and synchronized multi-format exports (PDF via `@react-pdf/renderer` and DOCX via `docx`).

Detailed project architecture and division of labor are documented in `AGENTS.md`.

---

## Tech Stack
- **Framework:** Next.js (App Router, Server Actions, React 19)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS, shadcn/ui, Lucide Icons
- **Drag & Drop:** `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`
- **Database & Auth:** Supabase (PostgreSQL, Row Level Security, Auth SSR)
- **State Management:** Zustand with undo/redo & debounced Supabase synchronization
- **Local LLM Engine:** Ollama / Local OpenAI-compatible endpoint (`http://localhost:11434/v1`) using Vercel AI SDK or native fetch with Zod structured outputs
- **Document Generation:**
  - PDF: `@react-pdf/renderer` (ATS vector selectable text layer)
  - DOCX: `docx` (native `.docx` file generator)

---

## Development Commands
```bash
# Package management & development
npm install           # Install dependencies
npm run dev           # Start Next.js development server (http://localhost:3000)
npm run build         # Build production bundle
npm run start         # Start production server
npm run lint          # Run ESLint check
npm run typecheck     # Validate TypeScript types (tsc --noEmit)

# Testing (when configured)
npm test              # Run test suite (Jest / Vitest)
npm run test:watch    # Run tests in watch mode
```

---

## Core Architectural Rules & Protocols

### 1. Three-Way Template Parity
Whenever a field, section, or formatting change is made to the resume data contract (`types/resume.ts`), immediately update all 3 rendering targets to maintain 100% parity:
1. **Live HTML Preview:** `components/templates/`
2. **PDF Generator:** `lib/export/pdf-generator.ts` (`@react-pdf/renderer`)
3. **DOCX Generator:** `lib/export/docx-generator.ts` (`docx`)

### 2. ATS Compliance Standards
- **Vector / Selectable Text Only:** Never use canvas or image-based conversions for PDFs.
- **Font Stack:** Standard ATS-safe fonts (Helvetica, Times-Roman, Roboto).
- **Structure:** Clean semantic hierarchy (`H1`, `H2`), standard date formats (`YYYY-MM` or `Month YYYY`), tab stops for right alignment in DOCX.
- **Skills Section:** Text tags / categories only; never use graphical progress bars.

### 3. State & Sync Architecture
- Local interactive state lives in the Zustand store (`store/useResumeStore.ts`).
- Mutations to resume content trigger debounced auto-saves to Supabase via server actions or Supabase client.
- Section ordering is maintained via `section_order` array.
- Individual item visibility is controlled by `visible: boolean`. Hidden items remain editable in form inputs but are excluded from preview, PDF, and DOCX.

### 4. Local LLM Graceful Degradation
- All calls to Ollama (`http://localhost:11434/v1`) must include health checks and error boundaries.
- If Ollama is offline or unavailable, deliver non-blocking UI notifications with clear instructions on starting the local daemon rather than crashing or throwing unhandled errors.

### 5. Multi-Tenancy & Database Security
- All Supabase tables (`public.resumes`, `public.cover_letters`) enforce Row Level Security (RLS) policies scoped strictly to `auth.uid() = user_id`.
