# Task 10 Brief: Multi-Resume Dashboard & AI Cover Letter Generator

## Objective
Build the multi-resume management dashboard (`/dashboard`), resume CRUD API endpoints (`/api/resumes`, `/api/resumes/[id]`), AI-powered tailored cover letter workspace (`/cover-letters`), resume cards with thumbnail previews, create/duplicate/delete modals, and a polished landing page (`app/page.tsx`).

## Files to Create/Modify
- `app/(dashboard)/dashboard/page.tsx`
- `app/(dashboard)/cover-letters/page.tsx`
- `app/api/resumes/route.ts`
- `app/api/resumes/[id]/route.ts`
- `components/dashboard/ResumeCard.tsx`
- `components/dashboard/CreateResumeDialog.tsx`
- `components/dashboard/CoverLetterGeneratorModal.tsx`
- `app/page.tsx`

## Requirements & Implementation Details

1. **Resume CRUD API Routes**:
   - `app/api/resumes/route.ts`:
     - GET: List resumes for the current authenticated user (or fallback demo resume list if Supabase is offline/local mock).
     - POST: Create new resume or clone existing resume.
   - `app/api/resumes/[id]/route.ts`:
     - GET: Fetch specific resume by ID.
     - PATCH: Update resume fields (title, content, template_id, section_order, ats_score) - handles debounced auto-save.
     - DELETE: Delete resume by ID.

2. **`components/dashboard/ResumeCard.tsx`**:
   - Card displaying resume title, template name, ATS score badge, last updated relative timestamp.
   - Live mini preview / thumbnail representation.
   - Actions dropdown: "Edit", "Duplicate", "Download PDF", "Download DOCX", "Delete".

3. **`app/(dashboard)/dashboard/page.tsx`**:
   - Responsive grid of resume cards.
   - "Create New Resume" action card / button.
   - Header with user profile menu and navigation to Cover Letters and Editor.

4. **`app/(dashboard)/cover-letters/page.tsx`**:
   - Cover letter studio:
     - Select resume source.
     - Inputs for Target Company, Job Title, Job Description (optional).
     - "Generate Tailored Cover Letter" button calling `/api/ai/cover-letter`.
     - In-place rich textarea editor for generated draft.
     - Export to PDF or DOCX download buttons.

5. **`app/page.tsx`**:
   - High-converting landing page: Hero section with CTA ("Build ATS-Optimized Resume"), live feature grid (AI Bullet Rewriter, ATS Score Meter, 3-Way Parity Export, Drag & Drop), template gallery previews, and footer.

6. Verify full test suite and TypeScript validation (`npm test && npm run typecheck`).
7. Commit changes to git.

## Report File
Write full execution details to `.superpowers/sdd/2026-09-16-ai-ats-resume-builder/task-10-report.md`.
