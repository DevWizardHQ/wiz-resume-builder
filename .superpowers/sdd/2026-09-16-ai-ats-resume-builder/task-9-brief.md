# Task 9 Brief: AI In-Line Bullet Optimizer & ATS Review Drawer

## Objective
Implement interactive AI-assisted editor enhancements: `AIBulletHelper` (dialog/popover to optimize rough bullet points into Google X-Y-Z achievements with tone selection) integrated into Experience and Project editors, and `AIReviewDrawer` (side sheet with 0-100 visual ATS score gauge, actionable suggestions, formatting warnings, and real-time job description keyword gap matcher).

## Files to Create/Modify
- `components/editor/AIBulletHelper.tsx`
- `components/editor/AIReviewDrawer.tsx`
- `components/editor/sections/ExperienceSection.tsx`
- `components/editor/sections/ProjectsSection.tsx`
- `components/editor/EditorSidebar.tsx`

## Requirements & Implementation Details

1. **`components/editor/AIBulletHelper.tsx`**:
   - Modal dialog / popover triggered next to bullet text inputs.
   - Input textarea for rough achievement drafting.
   - Tone selector: "Executive / High Impact", "Technical / Detailed", "Action-Oriented".
   - "Optimize with AI" button: calls `/api/ai/bullet-rewrite`.
   - Results view displaying 2-3 generated bullets with "Use this bullet" or "Add all bullets" actions.
   - Status badge showing whether Ollama was active or rule-based fallback was used.

2. **Integration into `ExperienceSection.tsx` & `ProjectsSection.tsx`**:
   - Add a "Sparkles / AI Optimize" button next to each bullet input and next to the "Add Bullet" button.
   - Inserting an accepted bullet directly updates store state.

3. **`components/editor/AIReviewDrawer.tsx`**:
   - Slide-over drawer / sheet toggled from editor header.
   - Visual circular score meter (0–100) color-coded: Red (<60), Yellow (60–79), Green (80+).
   - Breakdown of format checklist items (Contact info, summary, action verbs, quantified metrics, section count).
   - "Target Job Description" textarea with "Audit Match" button: calls `/api/ai/ats-audit`.
   - Displays matched keywords in green badges, missing critical keywords in amber badges, and actionable tips.

4. Run `npm run typecheck` to verify clean build with 0 errors.
5. Commit changes to git.

## Report File
Write full execution details to `.superpowers/sdd/2026-09-16-ai-ats-resume-builder/task-9-report.md`.
