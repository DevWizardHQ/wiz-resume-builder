# Task 7 Brief: Vector PDF (@react-pdf/renderer) and Native DOCX (docx) Exporters

## Objective
Implement ATS-compliant vector PDF generation using `@react-pdf/renderer` and native Word document generation using `docx`, complete with downloadable Next.js API routes (`/api/export/pdf/[id]` and `/api/export/docx/[id]`), strictly maintaining 3-way layout and content parity across HTML, PDF, and DOCX outputs.

## Files to Create/Modify
- `lib/export/pdf-generator.ts`
- `lib/export/docx-generator.ts`
- `app/api/export/pdf/[id]/route.ts`
- `app/api/export/docx/[id]/route.ts`
- `tests/export-parity.test.ts`

## Requirements & Implementation Details

1. **`lib/export/pdf-generator.ts`**:
   - Built with `@react-pdf/renderer` primitives (`Document`, `Page`, `Text`, `View`, `StyleSheet`).
   - ATS Compliance Rules:
     - 100% selectable vector text layer.
     - Single-column flow with 0.5 in (36pt) margins.
     - Standard fonts (Helvetica).
     - Renders sections strictly in `sectionOrder` sequence.
     - Omits hidden items (`item.visible === false`) and hidden summary.
   - Export: `generateResumePdfBuffer(resume: ResumeData, templateId: TemplateId, sectionOrder: SectionKey[]): Promise<Buffer>`.

2. **`lib/export/docx-generator.ts`**:
   - Built with `docx` primitives (`Document`, `Packer`, `Paragraph`, `TextRun`, `HeadingLevel`, `AlignmentType`, `TabStopType`, `TabStopPosition`).
   - ATS Compliance Rules:
     - Clear hierarchical headings (`HeadingLevel.HEADING_1`, `HeadingLevel.HEADING_2`).
     - Right-aligned tab stop at 9360 dxa (6.5 inches) for dates and locations.
     - Standard bullet points for experience, projects, involvement.
     - Renders sections strictly in `sectionOrder` sequence.
     - Omits hidden items and hidden summary.
   - Export: `generateResumeDocxBuffer(resume: ResumeData, sectionOrder: SectionKey[]): Promise<Buffer>`.

3. **Export API Route Handlers**:
   - `app/api/export/pdf/[id]/route.ts`: GET handler retrieving resume record, generating PDF buffer, and returning with `Content-Type: application/pdf` and `Content-Disposition: attachment; filename="..."`.
   - `app/api/export/docx/[id]/route.ts`: GET handler retrieving resume record, generating DOCX buffer, and returning with `Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document` and `Content-Disposition: attachment; filename="..."`.
   - Provide safe fallback to `INITIAL_RESUME_DATA` if local development / mock id is requested.

4. **`tests/export-parity.test.ts`**:
   - Test `generateResumeDocxBuffer` returns a valid, non-empty Buffer.
   - Test PDF generation runs without runtime errors.
   - Test that hidden sections and hidden items are excluded from output generation.

5. Run `npm test` and `npm run typecheck` to verify all tests pass with 0 errors.
6. Commit changes to git.

## Report File
Write full execution details to `.superpowers/sdd/2026-09-16-ai-ats-resume-builder/task-7-report.md`.
