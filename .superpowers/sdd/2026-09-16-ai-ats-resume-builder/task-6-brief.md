# Task 6 Brief: HTML Resume Templates (Classic ATS, Modern Minimal, Executive)

## Objective
Implement three distinct, ATS-compliant, responsive HTML resume template components (`ClassicAts`, `ModernMinimal`, `Executive`), a unified `TemplateRenderer` supporting dynamic section reordering and item-level visibility filtering, and unit tests verifying template rendering and filtering behavior.

## Files to Create/Modify
- `components/templates/ClassicAts.tsx`
- `components/templates/ModernMinimal.tsx`
- `components/templates/Executive.tsx`
- `components/templates/TemplateRenderer.tsx`
- `tests/template-renderer.test.ts`

## Requirements & Implementation Details

1. **`components/templates/ClassicAts.tsx`**:
   - ATS-optimized layout: single column, clear hierarchy, uppercase section titles with bottom borders, right-aligned dates & locations.
   - Bullet point styling with clear indentations and standard bullets.
   - Render sections dynamically according to `sectionOrder: SectionKey[]`.
   - Strictly respect item-level `visible` flags (only render items where `item.visible !== false`).

2. **`components/templates/ModernMinimal.tsx`**:
   - Clean, modern layout: subtle border accents, sleek header with contact links, structured skills grid with pills or category labels.
   - Render sections according to `sectionOrder`, respecting `item.visible !== false`.

3. **`components/templates/Executive.tsx`**:
   - Executive styling: prominent summary statement, highlighted key competencies / core achievements section, refined typography.
   - Render sections according to `sectionOrder`, respecting `item.visible !== false`.

4. **`components/templates/TemplateRenderer.tsx`**:
   - Props:
     ```typescript
     export interface TemplateRendererProps {
       data: ResumeData;
       templateId: TemplateId;
       sectionOrder?: SectionKey[];
       className?: string;
     }
     ```
   - Dynamically selects and renders `ClassicAts`, `ModernMinimal`, or `Executive`.
   - Falls back to `DEFAULT_SECTION_ORDER` if `sectionOrder` is omitted or empty.

5. **`tests/template-renderer.test.ts`**:
   - Unit tests verifying:
     - `TemplateRenderer` handles all 3 template IDs (`classic-ats`, `modern-minimal`, `executive`).
     - Sections render in the custom order given by `sectionOrder`.
     - Items with `visible: false` are excluded from rendering.
     - Summary with `visible: false` is excluded.

6. Run `npm test` and `npm run typecheck` to verify all tests pass with 0 errors.
7. Commit changes to git.

## Report File
Write full execution details to `.superpowers/sdd/2026-09-16-ai-ats-resume-builder/task-6-report.md`.
