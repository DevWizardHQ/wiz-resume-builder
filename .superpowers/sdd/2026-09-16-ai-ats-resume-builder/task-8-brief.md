# Task 8 Brief: Dual-Pane Live Editor with @dnd-kit Reordering & Live Preview

## Objective
Build the core live editor experience: reusable UI components (shadcn primitives), split-screen dual-pane layout (accordion forms on left, live A4 document preview on right), drag-and-drop section and item reordering via `@dnd-kit`, item visibility toggling, date auto-sorting, zoom controls, template switching, and export triggers.

## Files to Create/Modify
- `components/ui/button.tsx`
- `components/ui/input.tsx`
- `components/ui/textarea.tsx`
- `components/ui/card.tsx`
- `components/ui/accordion.tsx`
- `components/ui/switch.tsx`
- `components/ui/tabs.tsx`
- `components/ui/slider.tsx`
- `components/ui/dialog.tsx`
- `components/ui/tooltip.tsx`
- `components/ui/badge.tsx`
- `components/ui/label.tsx`
- `components/editor/EditorSidebar.tsx`
- `components/editor/SectionContainer.tsx`
- `components/editor/SortableItem.tsx`
- `components/editor/sections/ContactSection.tsx`
- `components/editor/sections/SummarySection.tsx`
- `components/editor/sections/ExperienceSection.tsx`
- `components/editor/sections/ProjectsSection.tsx`
- `components/editor/sections/EducationSection.tsx`
- `components/editor/sections/SkillsSection.tsx`
- `components/editor/sections/CertificationsSection.tsx`
- `components/editor/sections/InvolvementSection.tsx`
- `components/editor/sections/AwardsSection.tsx`
- `components/editor/sections/PublicationsSection.tsx`
- `components/editor/sections/ReferencesSection.tsx`
- `components/editor/LivePreviewPane.tsx`
- `app/(dashboard)/editor/[id]/page.tsx`

## Requirements & Implementation Details

1. **`components/ui/` Primitives**:
   - Clean, accessible Radix UI / Tailwind primitives (`Button`, `Input`, `Textarea`, `Card`, `Accordion`, `Switch`, `Tabs`, `Slider`, `Dialog`, `Tooltip`, `Badge`, `Label`).

2. **Drag & Drop Integration (`@dnd-kit/core` & `@dnd-kit/sortable`)**:
   - `SectionContainer.tsx`: Draggable accordion wrapper with drag handles to reorder resume sections.
   - `SortableItem.tsx`: Draggable card wrapper to reorder individual items within a section (e.g. experiences, projects).
   - Sensor setup: Pointer & Keyboard sensors with collision detection (`closestCenter`).

3. **Section Form Editors**:
   - Dedicated interactive editors for Contact, Summary, Experience, Projects, Education, Skills, Certifications, Involvement, Awards, Publications, and References.
   - Each section provides:
     - Item-level visibility toggle (`Eye` / `EyeOff`).
     - "Sort by Date" button (calls `sortSectionByDate`).
     - "Add Item" button.
     - Collapsible form fields with bullet point list management for experiences/projects.

4. **`LivePreviewPane.tsx`**:
   - Zoom controls slider (50% - 150%) and preset buttons.
   - Template switcher dropdown or tabs (`Classic ATS`, `Modern Minimal`, `Executive`).
   - Direct export action triggers for PDF and DOCX download.
   - A4 aspect ratio preview wrapper embedding `TemplateRenderer`.

5. **`app/(dashboard)/editor/[id]/page.tsx`**:
   - Dynamic page component loading resume ID or fallback demo state.
   - Auto-save status indicator in header (`Saved`, `Saving...`, `Unsaved changes`).
   - Title editor with inline rename.
   - Responsive split layout (`grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-64px)]`).

6. Run `npm run typecheck` and verify clean build with 0 TypeScript errors.
7. Commit changes to git.

## Report File
Write full execution details to `.superpowers/sdd/2026-09-16-ai-ats-resume-builder/task-8-report.md`.
