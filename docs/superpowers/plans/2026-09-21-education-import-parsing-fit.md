# Education Import Parsing and Best-Fit CV Schema Normalization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix educational information parsing and schema mapping across heuristic text parsing, JSON Resume normalization, and AI extraction to achieve complete accuracy and zero data loss on `EducationItem` (`institution`, `degree`, `fieldOfStudy`, `startDate`, `endDate`, `gpa`, `honors`).

**Architecture:** Multi-tier parser enhancement: (1) Rule-based heuristic chunker with boundary detection, international degree ontology, and flexible layout classification (degree-first vs. institution-first), (2) Non-destructive JSON Resume schema normalizer mapping all field aliases and honors, (3) AI prompt and Zod schema refinement mapping global educational attributes cleanly to the CV schema with non-destructive heuristic fallbacks.

**Tech Stack:** TypeScript (strict mode), Next.js 15, Zod, Vitest.

**Spec:** `docs/superpowers/plans/2026-09-21-education-import-parsing-fit.md`

## Global Constraints
- Target canonical interface `EducationItem` from `types/resume.ts`: `{ id: string, visible: boolean, order: number, institution: string, degree: string, fieldOfStudy: string, startDate: string, endDate: string, gpa?: string, honors?: string[] }`.
- Date format normalized to `YYYY-MM` or `YYYY` via `normalizeDate()` in `lib/import/resume-parser.ts`.
- Zero data loss: non-destructive fallbacks across heuristic, JSON, and AI extraction pipelines.
- Full compatibility with Next.js 15 App Router and Vitest test runner.

---

### Task 1: Heuristic Education Boundary Chunking and International Degree/Institution Extraction

**Files:**
- Modify: `lib/import/resume-parser.ts:411-467`
- Test: `tests/import-parser.test.ts`

**Interfaces:**
- Consumes: `types/resume.ts:EducationItem`, `lib/import/id.ts:genId`, `lib/import/resume-parser.ts:normalizeDate`, `lib/import/resume-parser.ts:sanitizeAtsText`.
- Produces: `parseEducationSection(text: string): EducationItem[]` returning fully parsed and segmented `EducationItem` objects with `institution`, `degree`, `fieldOfStudy`, `startDate`, `endDate`, `gpa`, and `honors`.

- [ ] **Step 1: Write the failing tests for heuristic education parsing**

Add tests to `tests/import-parser.test.ts` covering:
1. Multi-item education blocks separated by single newlines (not double newlines).
2. International degrees (`B.Sc`, `B.Tech`, `M.Phil`, `Ph.D.`, `High School Diploma`, `Diploma in Mechanical Engineering`).
3. Institution-first layout vs degree-first layout.
4. GPA formats (`GPA: 3.8/4.0`, `Cumulative GPA 3.9`, `CGPA 3.85`, `Grade: 3.9`).
5. Honors detection (`Dean's List`, `Cum Laude`, `Summa Cum Laude`, `Distinction`).

```typescript
describe('Stage 2 - Advanced Education Heuristic Parsing', () => {
  it('parses multiple single-newline separated education entries', () => {
    const text = `B.S. in Computer Science, Stanford University, 2016-09 - 2020-06
M.S. in Artificial Intelligence, MIT, 2020-09 - 2022-06`;
    const items = parseEducationSection(text);
    expect(items).toHaveLength(2);
    expect(items[0].institution).toBe('Stanford University');
    expect(items[0].degree).toBe('B.S.');
    expect(items[0].fieldOfStudy).toBe('Computer Science');
    expect(items[0].startDate).toBe('2016-09');
    expect(items[0].endDate).toBe('2020-06');
    expect(items[1].institution).toBe('MIT');
    expect(items[1].degree).toBe('M.S.');
    expect(items[1].fieldOfStudy).toBe('Artificial Intelligence');
  });

  it('parses institution-first multi-line education blocks', () => {
    const text = `University of Oxford
Master of Science in Mathematics
2018 - 2020
GPA: 3.95/4.0
Dean's List, Distinction in Mathematics`;
    const items = parseEducationSection(text);
    expect(items).toHaveLength(1);
    expect(items[0].institution).toBe('University of Oxford');
    expect(items[0].degree).toBe('Master of Science');
    expect(items[0].fieldOfStudy).toBe('Mathematics');
    expect(items[0].startDate).toBe('2018');
    expect(items[0].endDate).toBe('2020');
    expect(items[0].gpa).toBe('3.95/4.0');
    expect(items[0].honors).toEqual(expect.arrayContaining(["Dean's List", 'Distinction in Mathematics']));
  });

  it('parses international and vocational degree types', () => {
    const text = `B.Tech in Information Technology
National Institute of Technology
2014 - 2018 | CGPA: 3.82`;
    const items = parseEducationSection(text);
    expect(items).toHaveLength(1);
    expect(items[0].degree).toBe('B.Tech');
    expect(items[0].fieldOfStudy).toBe('Information Technology');
    expect(items[0].institution).toBe('National Institute of Technology');
    expect(items[0].gpa).toBe('3.82');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/import-parser.test.ts`
Expected: FAIL due to missing multi-item single newline chunking and missing international degree regexes.

- [ ] **Step 3: Implement enhanced `parseEducationSection` in `lib/import/resume-parser.ts`**

Update `parseEducationSection` in `lib/import/resume-parser.ts`:
1. Intelligent entry chunking using boundary heuristics:
   - Paragraph split (`\n\s*\n`) + line-by-line boundary check.
   - Detect new entry boundary when a line starts with a degree keyword, institution indicator (`University`, `College`, `Institute`, `School`, `Academy`, `Polytechnic`), or date range when the previous chunk already has institution/degree.
2. Expanded international degree regex:
   ```typescript
   const DEGREE_REGEX =
     /(?:B\.?S\.?c?\.?|B\.?A\.?|B\.?Tech\.?|B\.?E\.?|B\.?Eng\.?|B\.?Com\.?|B\.?B\.?A\.?|BBA|BCA|B\.?Ed\.?|Bachelor(?:'s)?(?: of [A-Za-z &]+)?|M\.?S\.?c?\.?|M\.?A\.?|M\.?B\.?A\.?|M\.?Tech\.?|M\.?E\.?|M\.?Eng\.?|M\.?Phil\.?|MCA|M\.?Ed\.?|Master(?:'s)?(?: of [A-Za-z &]+)?|P\.?h\.?D\.?|Doctor(?: of Philosophy)?|Doctorate|Associate(?:'s)?(?: of [A-Za-z &]+)?|Associate Degree|A\.?A\.?|A\.?S\.?|Postgraduate Diploma|PG Diploma|Advanced Diploma|Diploma|High School Diploma|Higher Secondary|Secondary School Certificate|SSC|HSC|A-Levels|O-Levels|International Baccalaureate|IB Diploma|Matriculation|GED)(?=\s|$|,|:|\))/i;
   ```
3. Major / Field of Study extraction logic (`in <Major>`, `Major: <Major>`, `Major in <Major>`, `Concentration in <Major>`, `- <Major>`, `, <Major>`).
4. Line-by-line classification for Institution vs Degree lines when multi-line.
5. GPA and honors extraction.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/import-parser.test.ts`
Expected: PASS

- [ ] **Step 5: Commit changes**

```bash
git add lib/import/resume-parser.ts tests/import-parser.test.ts
git commit -m "feat(import): enhance heuristic education chunking, international degree parsing, and field normalization"
```

---

### Task 2: JSON Resume Education Schema Normalizer & Alias Resolution

**Files:**
- Modify: `lib/import/resume-parser.ts:731-751`
- Test: `tests/resume-parser.test.ts`

**Interfaces:**
- Consumes: `src.education: unknown[]` from JSON Resume payload.
- Produces: `EducationItem[]` mapped with support for `institution`, `school`, `university`, `college`, `academy`, `name`, `studyType`, `degree`, `qualification`, `diploma`, `area`, `fieldOfStudy`, `major`, `discipline`, `subject`, `score`, `gpa`, `grade`, `cgpa`, and `honors`.

- [ ] **Step 1: Write failing tests for JSON Resume education alias mapping**

Add tests to `tests/resume-parser.test.ts`:
```typescript
it('maps education fields from diverse JSON Resume aliases and formats', () => {
  const customJson = JSON.stringify({
    basics: { name: 'Edu Tester' },
    education: [
      {
        school: 'UC Berkeley',
        degree: 'Bachelor of Arts',
        major: 'Computer Science',
        startDate: '2015-08',
        endDate: '2019-05',
        cgpa: '3.92',
        honors: ['Honors in Computer Science', 'Summa Cum Laude'],
      },
      {
        university: 'Oxford University',
        studyType: 'M.Sc.',
        area: 'Data Science',
        startDate: '2019-10',
        endDate: '2020-09',
        score: '3.98',
        honors: 'Distinction',
      },
    ],
  });

  const parsed = parseJsonResumeContent(customJson);
  expect(parsed).not.toBeNull();
  expect(parsed!.education).toHaveLength(2);

  expect(parsed!.education[0].institution).toBe('UC Berkeley');
  expect(parsed!.education[0].degree).toBe('Bachelor of Arts');
  expect(parsed!.education[0].fieldOfStudy).toBe('Computer Science');
  expect(parsed!.education[0].gpa).toBe('3.92');
  expect(parsed!.education[0].honors).toEqual(['Honors in Computer Science', 'Summa Cum Laude']);

  expect(parsed!.education[1].institution).toBe('Oxford University');
  expect(parsed!.education[1].degree).toBe('M.Sc.');
  expect(parsed!.education[1].fieldOfStudy).toBe('Data Science');
  expect(parsed!.education[1].gpa).toBe('3.98');
  expect(parsed!.education[1].honors).toEqual(['Distinction']);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/resume-parser.test.ts`
Expected: FAIL due to unmapped aliases (`school`, `degree`, `major`, `cgpa`, `honors`).

- [ ] **Step 3: Implement education alias normalizer in `lib/import/resume-parser.ts`**

Update `jsonResumeToImported` in `lib/import/resume-parser.ts`:
```typescript
const education: EducationItem[] = Array.isArray(src.education)
  ? (src.education as unknown[])
      .filter((e) => e && typeof e === 'object')
      .map((e, idx) => {
        const obj = e as Record<string, unknown>;
        const institution =
          toStringOrEmpty(obj.institution).trim() ||
          toStringOrEmpty(obj.school).trim() ||
          toStringOrEmpty(obj.university).trim() ||
          toStringOrEmpty(obj.college).trim() ||
          toStringOrEmpty(obj.academy).trim() ||
          toStringOrEmpty(obj.name).trim();

        const degree =
          toStringOrEmpty(obj.studyType).trim() ||
          toStringOrEmpty(obj.degree).trim() ||
          toStringOrEmpty(obj.qualification).trim() ||
          toStringOrEmpty(obj.diploma).trim() ||
          toStringOrEmpty(obj.certificate).trim();

        const fieldOfStudy =
          toStringOrEmpty(obj.area).trim() ||
          toStringOrEmpty(obj.fieldOfStudy).trim() ||
          toStringOrEmpty(obj.major).trim() ||
          toStringOrEmpty(obj.discipline).trim() ||
          toStringOrEmpty(obj.subject).trim() ||
          toStringOrEmpty(obj.branch).trim();

        const rawGpa =
          obj.gpa !== undefined && obj.gpa !== null
            ? toStringOrEmpty(obj.gpa).trim()
            : obj.score !== undefined && obj.score !== null
              ? toStringOrEmpty(obj.score).trim()
              : obj.cgpa !== undefined && obj.cgpa !== null
                ? toStringOrEmpty(obj.cgpa).trim()
                : obj.grade !== undefined && obj.grade !== null
                  ? toStringOrEmpty(obj.grade).trim()
                  : undefined;

        let honorsList: string[] | undefined = undefined;
        if (Array.isArray(obj.honors)) {
          honorsList = (obj.honors as unknown[])
            .map((h) => toStringOrEmpty(h).trim())
            .filter(Boolean);
        } else if (typeof obj.honors === 'string' && obj.honors.trim()) {
          honorsList = [obj.honors.trim()];
        }

        return {
          id: genId('edu'),
          visible: true,
          order: idx,
          institution: institution || 'Unknown Institution',
          degree,
          fieldOfStudy,
          startDate: normalizeDate(toStringOrEmpty(obj.startDate)),
          endDate: normalizeDate(toStringOrEmpty(obj.endDate)),
          gpa: rawGpa || undefined,
          honors: honorsList && honorsList.length > 0 ? honorsList : undefined,
        };
      })
  : [];
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/resume-parser.test.ts`
Expected: PASS

- [ ] **Step 5: Commit changes**

```bash
git add lib/import/resume-parser.ts tests/resume-parser.test.ts
git commit -m "feat(import): support JSON Resume education aliases for institution, degree, major, gpa, and honors"
```

---

### Task 3: AI Resume Schema Zod Types, Prompt Engineering, and Extraction Fit

**Files:**
- Modify: `lib/ai/resume-schema.ts:62-79`
- Modify: `lib/ai/resume-parser-ai.ts:34-57`
- Modify: `lib/ai/resume-parser-ai.ts:198-226`
- Test: `tests/import-ai-parser.test.ts`

**Interfaces:**
- Consumes: `EducationItemSchema` from `lib/ai/resume-schema.ts`, `buildResumeParsePrompt` and `extractStructuredResume` from `lib/ai/resume-parser-ai.ts`.
- Produces: Enhanced `EducationItemSchema` validating all schema variations and `extractStructuredResume` merging AI education output into `EducationItem` without losing fields or fallback records.

- [ ] **Step 1: Write failing tests for AI education extraction and non-destructive fallbacks**

Add tests to `tests/import-ai-parser.test.ts`:
```typescript
it('extracts education items from AI output supporting international degrees and alias properties', () => {
  const fallback = parsePlainTextResume(RAW_TEXT);
  const aiJson = JSON.stringify({
    education: [
      {
        school: 'University of Cambridge',
        qualification: 'Master of Philosophy (M.Phil)',
        major: 'Machine Learning',
        startDate: '2021-10',
        endDate: '2022-07',
        grade: 'First Class with Distinction',
        honors: ['Cambridge Trust Scholar', "Dean's Commendation"],
      },
    ],
  });

  const result = extractStructuredResume(aiJson, fallback);
  expect(result.education).toHaveLength(1);
  expect(result.education[0].institution).toBe('University of Cambridge');
  expect(result.education[0].degree).toBe('Master of Philosophy (M.Phil)');
  expect(result.education[0].fieldOfStudy).toBe('Machine Learning');
  expect(result.education[0].gpa).toBe('First Class with Distinction');
  expect(result.education[0].honors).toEqual(['Cambridge Trust Scholar', "Dean's Commendation"]);
});

it('preserves fallback education items when AI output education is empty or malformed', () => {
  const fallback = parsePlainTextResume(RAW_TEXT);
  const aiJson = JSON.stringify({
    basics: { name: 'Fallback Retain User' },
    education: [],
  });

  const result = extractStructuredResume(aiJson, fallback);
  expect(result.contact.fullName).toBe('Fallback Retain User');
  expect(result.education).toHaveLength(1);
  expect(result.education[0].institution).toBe('MIT');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/import-ai-parser.test.ts`
Expected: FAIL due to missing schema property aliases in Zod/extractor.

- [ ] **Step 3: Update `EducationItemSchema`, prompt, and `extractStructuredResume`**

In `lib/ai/resume-schema.ts`:
```typescript
export const EducationItemSchema = z
  .object({
    institution: z.string().optional().nullable(),
    school: z.string().optional().nullable(),
    university: z.string().optional().nullable(),
    college: z.string().optional().nullable(),
    academy: z.string().optional().nullable(),
    name: z.string().optional().nullable(),
    url: z.string().optional().nullable(),
    area: z.string().optional().nullable(),
    fieldOfStudy: z.string().optional().nullable(),
    major: z.string().optional().nullable(),
    discipline: z.string().optional().nullable(),
    subject: z.string().optional().nullable(),
    branch: z.string().optional().nullable(),
    studyType: z.string().optional().nullable(),
    degree: z.string().optional().nullable(),
    qualification: z.string().optional().nullable(),
    diploma: z.string().optional().nullable(),
    certificate: z.string().optional().nullable(),
    startDate: z.string().optional().nullable(),
    endDate: z.string().optional().nullable(),
    score: z.union([z.string(), z.number()]).optional().nullable(),
    gpa: z.union([z.string(), z.number()]).optional().nullable(),
    grade: z.union([z.string(), z.number()]).optional().nullable(),
    cgpa: z.union([z.string(), z.number()]).optional().nullable(),
    courses: z.array(z.union([z.string(), z.any()])).optional().nullable(),
    honors: z.union([z.array(z.union([z.string(), z.any()])), z.string()]).optional().nullable(),
  })
  .passthrough();
```

In `lib/ai/resume-parser-ai.ts`:
1. Enhance prompt instructions for education:
   - Map `institution`, `studyType` (degree), `area` (fieldOfStudy / major), `startDate`, `endDate`, `score` / `gpa`, `honors`.
2. Enhance `extractStructuredResume` education mapping resolving all aliases and sanitizing honors/GPA.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/import-ai-parser.test.ts`
Expected: PASS

- [ ] **Step 5: Commit changes**

```bash
git add lib/ai/resume-schema.ts lib/ai/resume-parser-ai.ts tests/import-ai-parser.test.ts
git commit -m "feat(ai): enhance education Zod schema, prompt engineering, and structured extraction fit"
```

---

### Task 4: Full Test Suite and TypeScript Type Verification

**Files:**
- Test: All test suites in `tests/*.test.ts`
- Validate: `npm run typecheck` and `npm test`

- [ ] **Step 1: Run TypeScript typecheck**

Run: `npm run typecheck`
Expected: 0 errors (`tsc --noEmit`)

- [ ] **Step 2: Run all unit and integration tests**

Run: `npm test`
Expected: All 18 test suites and >250 tests PASS.

- [ ] **Step 3: Commit final verification**

```bash
git commit --allow-empty -m "chore(import): verify full test suite and type safety for education schema normalization"
```

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-09-21-education-import-parsing-fit.md`. Two execution options:

**1. Subagent-Driven (recommended)** - Fresh subagent per task, review between tasks, fast iteration.
**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach?
