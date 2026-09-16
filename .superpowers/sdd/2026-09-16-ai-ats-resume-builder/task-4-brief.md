# Task 4 Brief: Zustand State Store with Undo/Redo, DND Reordering & Debounced Auto-Save

## Objective
Verify, complete, and thoroughly test the Zustand state store in `store/useResumeStore.ts` supporting full multi-section state mutations, time-travel history (undo/redo up to 30 steps), section and item-level drag-and-drop reordering, visibility toggling, reverse-chronological auto-sorting, and debounced auto-saving to `/api/resumes/[id]`.

## Files to Create/Modify
- `store/useResumeStore.ts`
- `tests/resume-store.test.ts`

## Requirements & Implementation Details

1. **`store/useResumeStore.ts`**:
   - Verify state shape includes:
     - `resumeId: string | null`
     - `title: string`
     - `slug: string`
     - `templateId: TemplateId`
     - `sectionOrder: SectionKey[]`
     - `data: ResumeData`
     - `atsScore: number`
     - `isSaving: boolean`
     - `isDirty: boolean`
     - `lastSaved: string | null`
     - `saveError: string | null`
     - `past: ResumeHistoryState[]` (capped at 30)
     - `future: ResumeHistoryState[]` (capped at 30)
   - Verify all actions:
     - `loadResume`, `resetResume`, `setTitle`, `setTemplateId`, `setAtsScore`
     - `setSectionOrder`, `moveSection(activeKey, overKey)`
     - `updateContact`, `updateSummary`
     - `addItem(section, item)`
     - `updateItem(section, id, updates)`
     - `removeItem(section, id)`
     - `toggleItemVisibility(section, id)`
     - `reorderItems(section, activeId, overId)`
     - `sortSectionByDate(section)`
     - `undo()`, `redo()`
     - `triggerAutoSave()`, `forceSave()`, `setSaveError(error)`
   - Ensure clean snapshotting for history without unintended side-effects or reference mutation leaks.

2. **`tests/resume-store.test.ts`**:
   - Write comprehensive unit tests covering:
     - `resetResume` and `loadResume`
     - Contact updates and dirty state tracking
     - Summary updates (text and visibility)
     - Section reordering via `moveSection` and `setSectionOrder`
     - Item operations: `addItem`, `updateItem`, `removeItem`, `toggleItemVisibility`, `reorderItems`
     - Date sorting integration: calling `sortSectionByDate('experience')` and verifying reverse chronological order
     - History stack: `undo()` and `redo()` across multiple state mutations
     - Maximum history step capping (30 steps)

3. Run `npm test tests/resume-store.test.ts` and `npm run typecheck` to verify all tests pass with 0 errors.
4. Commit changes to git.

## Report File
Write full execution details to `.superpowers/sdd/2026-09-16-ai-ats-resume-builder/task-4-report.md`.
