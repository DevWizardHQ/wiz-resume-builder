# Task 3 Brief: Resume Contracts, Reverse-Chronological Date Sorter & Unit Tests

## Objective
Verify and refine the comprehensive resume data models in `types/resume.ts`, ensure complete and robust reverse-chronological sorting helpers in `lib/utils/date-sorter.ts`, and implement a comprehensive test suite in `tests/date-sorter.test.ts`.

## Files to Create/Modify
- `types/resume.ts` (verify all contracts, interfaces, and default values)
- `lib/utils/date-sorter.ts` (ensure robust parsing and order re-indexing)
- `tests/date-sorter.test.ts` (write complete unit tests)

## Requirements & Implementation Details

1. **`types/resume.ts`**:
   - Verify TypeScript contracts for `ContactInfo`, `ExperienceItem`, `ProjectItem`, `EducationItem`, `SkillCategory`, `CertificationItem`, `InvolvementItem`, `AwardItem`, `PublicationItem`, `ReferenceItem`, `ResumeData`, `ResumeRecord`, `TemplateId`, `SectionKey`.
   - Ensure `DEFAULT_SECTION_ORDER` and `INITIAL_RESUME_DATA` are exported and valid.

2. **`lib/utils/date-sorter.ts`**:
   - Implement date parsers supporting `YYYY-MM`, `YYYY`, `Present`, `Current`, empty strings, and ISO dates.
   - Implement reverse-chronological sorters for:
     - `sortExperiencesByDate(items: ExperienceItem[]): ExperienceItem[]`
     - `sortProjectsByDate(items: ProjectItem[]): ProjectItem[]`
     - `sortEducationByDate(items: EducationItem[]): EducationItem[]`
     - `sortInvolvementsByDate(items: InvolvementItem[]): InvolvementItem[]`
     - `sortCertificationsByDate(items: CertificationItem[]): CertificationItem[]`
     - `sortAwardsByDate(items: AwardItem[]): AwardItem[]`
   - All sorters must prioritize `current: true` or `endDate === 'Present' / 'Current'` to the top.
   - Sorters must compare end dates (descending), break ties using start dates (descending), and re-index `order: 0, 1, 2...` on returned array items without mutating the original input array.

3. **`tests/date-sorter.test.ts`**:
   - Unit tests covering:
     - `current: true` items sorted first.
     - ISO `YYYY-MM` date comparisons.
     - `YYYY` year-only comparisons.
     - Tie-breaking with start dates when end dates match.
     - Handling missing / undefined dates safely.
     - Preservation and proper 0-indexed renumbering of `order`.
     - Non-mutating behavior (returns a new array).
     - Tests for every exported sort function (`sortExperiencesByDate`, `sortProjectsByDate`, `sortEducationByDate`, `sortInvolvementsByDate`, `sortCertificationsByDate`, `sortAwardsByDate`).

4. Run `npm test` and `npm run typecheck` to verify all tests pass with 0 errors.
5. Commit changes to git.

## Report File
Write full execution details to `.superpowers/sdd/2026-09-16-ai-ats-resume-builder/task-3-report.md`.
