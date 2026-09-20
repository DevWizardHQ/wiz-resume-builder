# Two-Stage Resume Import & AI Schema Fitting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a robust two-stage resume import and auto-fill engine that first extracts all raw text from uploaded documents (PDF, DOCX, TXT, JSON) client-side and then accurately maps and fits that data into the complete 11-section application schema using an AI response endpoint (`/api/ai/parse-resume`) with deterministic heuristic fallbacks so that no information is dropped.

**Architecture:** 
- Stage 1 (Raw Ingestion): Client-side document extraction converts PDF (via `pdfjs-dist` coordinate bucketing) and DOCX (via `mammoth`) into structured raw text without leaking private files to external servers.
- Stage 2 (Schema Fitting): The raw text is dispatched to `/api/ai/parse-resume`, where LLM prompts extract structured JSON adhering to the `ResumeAiSchema` (Zod validated) and non-destructively merge with deterministic heuristic baselines.
- State & UI: Ingested resume data is seamlessly piped into `useResumeStore` (in Editor) or `POST /api/resumes` (in Dashboard) with full undo/redo history snapshotting.

**Tech Stack:** Next.js 15 App Router, TypeScript, Zod, Vitest, Zustand, `mammoth`, `pdfjs-dist`, `@dnd-kit/core`, Tailwind CSS.

**Spec:** Two-stage CV/Resume extraction and schema fitting architecture.

## Global Constraints

- Never drop extracted fields: Always perform non-destructive heuristic fallback merge if AI omits sections.
- Zero Layout Drift: Parsed `ResumeData` must strictly conform to `types/resume.ts` and render identically across HTML Preview, Vector PDF, and DOCX.
- Offline Safety: Gracefully fall back to local heuristic regex parsing if Ollama / OpenAI / OmniRoute are unavailable or timeout.
- Browser Security: PDF and DOCX files must be parsed in-memory on the client; raw binary files are never saved to disk or server filesystem.

---

### Task 1: Enhance Stage 1 Client-Side Document Text Extraction

**Files:**
- Modify: `lib/import/resume-parser.ts`
- Test: `tests/import-parser.test.ts`

**Interfaces:**
- Consumes: `mammoth.extractRawText`, `pdfjs-dist`, `File`
- Produces: `extractTextFromFile(file: File): Promise<{ text: string; sourceType: 'json' | 'pdf' | 'docx' | 'text'; fileName: string }>`

- [ ] **Step 1: Write the failing unit test for extractTextFromFile and text sanitization**

Add test cases in `tests/import-parser.test.ts` checking `extractTextFromFile` for plain text, JSON, and layout-preserved text extraction:

```typescript
import { describe, it, expect } from 'vitest';
import { extractTextFromFile, sanitizeAtsText } from '@/lib/import/resume-parser';

describe('Stage 1 - Document Text Extraction', () => {
  it('extracts plain text and markdown files properly', async () => {
    const txtBlob = new Blob(['Alex Doe\nalex@example.com\nSoftware Engineer'], { type: 'text/plain' });
    const file = new File([txtBlob], 'resume.txt', { type: 'text/plain' });
    const result = await extractTextFromFile(file);
    expect(result.sourceType).toBe('text');
    expect(result.text).toContain('Alex Doe');
    expect(result.fileName).toBe('resume.txt');
  });

  it('identifies json files and preserves JSON string payload', async () => {
    const jsonContent = JSON.stringify({ basics: { name: 'Jordan Smith' } });
    const file = new File([jsonContent], 'resume.json', { type: 'application/json' });
    const result = await extractTextFromFile(file);
    expect(result.sourceType).toBe('json');
    expect(result.text).toContain('Jordan Smith');
  });
});
```

- [ ] **Step 2: Run test to verify it fails or needs updates**

Run: `npx vitest run tests/import-parser.test.ts`
Expected: Passes or fails with missing assertions depending on existing tests.

- [ ] **Step 3: Implement extractTextFromFile enhancement in lib/import/resume-parser.ts**

Ensure `extractTextFromFile` is robustly exported with proper typing and error boundary:

```typescript
export async function extractTextFromFile(
  file: File
): Promise<{ text: string; sourceType: 'json' | 'pdf' | 'docx' | 'text'; fileName: string }> {
  const fileName = file.name || 'resume';
  const lower = fileName.toLowerCase();

  if (lower.endsWith('.json') || file.type === 'application/json') {
    const text = await file.text();
    return { text, sourceType: 'json', fileName };
  }

  if (lower.endsWith('.docx') || file.type.includes('wordprocessingml')) {
    const arrayBuffer = await file.arrayBuffer();
    const text = await extractDocxText(arrayBuffer);
    return { text, sourceType: 'docx', fileName };
  }

  if (lower.endsWith('.pdf') || file.type === 'application/pdf') {
    const arrayBuffer = await file.arrayBuffer();
    const text = await extractPdfText(arrayBuffer);
    return { text, sourceType: 'pdf', fileName };
  }

  const text = await file.text();
  return { text, sourceType: 'text', fileName };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/import-parser.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/import/resume-parser.ts tests/import-parser.test.ts
git commit -m "feat(import): enhance Stage 1 client-side raw document text extraction"
```

---

### Task 2: Enhance Stage 2 AI Prompt, Schema Validation & Non-Destructive Fallback Fitting

**Files:**
- Modify: `lib/ai/resume-parser-ai.ts`
- Modify: `lib/ai/resume-schema.ts`
- Test: `tests/import-ai-parser.test.ts`

**Interfaces:**
- Consumes: `rawText: string`, `ResumeAiSchema`, `parsePlainTextResume(rawText)`
- Produces: `extractStructuredResume(rawJsonText: string, fallback: ImportedResume): ImportedResume`, `parseResumeWithAi(content: string, options?: AiClientOptions): Promise<ParseResumeResult>`

- [ ] **Step 1: Write the failing unit tests for AI schema fitting and comprehensive section retention**

In `tests/import-ai-parser.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { buildResumeParsePrompt, extractStructuredResume } from '@/lib/ai/resume-parser-ai';
import { parsePlainTextResume } from '@/lib/import/resume-parser';

describe('Stage 2 - AI Schema Fitting and Non-Destructive Merging', () => {
  it('maps all 11 sections from AI response without dropping nested fields', () => {
    const rawFallbackText = `Alex Taylor\nalex@tech.io\n(555) 000-1111\nSan Francisco, CA\n\nEXPERIENCE\nSenior Developer | Acme Corp | 2020 - Present\n- Built scalable microservices\n\nPROJECTS\nAI Agent Platform | https://github.com/alex/agent | 2023\n- Developed LLM orchestration system\n\nSKILLS\nLanguages: TypeScript, Python, Rust`;
    const fallback = parsePlainTextResume(rawFallbackText);

    const aiJsonResponse = JSON.stringify({
      basics: {
        name: 'Alex Taylor',
        email: 'alex@tech.io',
        phone: '(555) 000-1111',
        location: { city: 'San Francisco', region: 'CA' },
        summary: 'Accomplished software engineer with focus on distributed systems.',
      },
      work: [
        {
          company: 'Acme Corp',
          position: 'Staff Engineer',
          startDate: '2020-01',
          endDate: null,
          highlights: ['Architected event-driven microservices processing 1M events/sec.'],
        },
      ],
      projects: [
        {
          name: 'AI Agent Platform',
          url: 'https://github.com/alex/agent',
          startDate: '2023-01',
          endDate: '2023-12',
          keywords: ['TypeScript', 'Python', 'Ollama'],
          highlights: ['Developed LLM orchestration pipeline reducing latency by 40%.'],
        },
      ],
      skills: [
        {
          name: 'Core Languages',
          keywords: ['TypeScript', 'Python', 'Rust', 'Go'],
        },
      ],
      certificates: [
        {
          name: 'AWS Solutions Architect',
          issuer: 'Amazon Web Services',
          date: '2022-05',
          url: 'https://aws.cert/12345',
        },
      ],
    });

    const structured = extractStructuredResume(aiJsonResponse, fallback);
    expect(structured.contact.fullName).toBe('Alex Taylor');
    expect(structured.summary).toContain('Accomplished software engineer');
    expect(structured.experience[0].role).toBe('Staff Engineer');
    expect(structured.projects[0].technologies).toEqual(['TypeScript', 'Python', 'Ollama']);
    expect(structured.projects[0].link).toBe('https://github.com/alex/agent');
    expect(structured.certifications[0].name).toBe('AWS Solutions Architect');
    expect(structured.certifications[0].credentialUrl).toBe('https://aws.cert/12345');
  });

  it('preserves heuristic fallback when AI returns partial or empty sections', () => {
    const rawText = `Sam Rivera\nsam@example.com\n\nEDUCATION\nBS Computer Science, Stanford University, 2018 - 2022`;
    const fallback = parsePlainTextResume(rawText);
    const partialAi = JSON.stringify({
      basics: { name: 'Sam Rivera' },
      // work, education omitted by AI
    });

    const structured = extractStructuredResume(partialAi, fallback);
    expect(structured.contact.fullName).toBe('Sam Rivera');
    expect(structured.contact.email).toBe('sam@example.com');
    expect(structured.education.length).toBe(1);
    expect(structured.education[0].institution).toBe('Stanford University');
  });
});
```

- [ ] **Step 2: Run test to verify it fails or runs as expected**

Run: `npx vitest run tests/import-ai-parser.test.ts`
Expected: Verify test results.

- [ ] **Step 3: Update lib/ai/resume-parser-ai.ts and lib/ai/resume-schema.ts**

Refine `buildResumeParsePrompt` and `extractStructuredResume` to handle deep nested fields, clean JSON markdown fences, and perform complete Zod validation before merging.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/import-ai-parser.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/ai/resume-parser-ai.ts lib/ai/resume-schema.ts tests/import-ai-parser.test.ts
git commit -m "feat(ai): enhance Stage 2 AI prompt, Zod validation, and non-destructive schema fitting"
```

---

### Task 3: Connect File Uploads in Editor Modal (`ImportResumeModal.tsx`) to Stage 1 + Stage 2 AI Pipeline

**Files:**
- Modify: `components/editor/ImportResumeModal.tsx`
- Test: `tests/import-resume-modal.test.tsx`

**Interfaces:**
- Consumes: `extractTextFromFile(file)`, `fetch('/api/ai/parse-resume')`, `useResumeStore.importResumeData`
- Produces: Seamless client extraction -> AI schema normalization -> Zustand store auto-fill

- [ ] **Step 1: Write integration tests in tests/import-resume-modal.test.tsx for file extraction routing**

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { ImportResumeModal } from '@/components/editor/ImportResumeModal';
import { useResumeStore } from '@/store/useResumeStore';
import { INITIAL_RESUME_DATA } from '@/types/resume';

describe('ImportResumeModal Component Integration', () => {
  beforeEach(() => {
    useResumeStore.setState({
      data: JSON.parse(JSON.stringify(INITIAL_RESUME_DATA)),
      past: [],
      future: [],
      isDirty: false,
      title: 'My Resume',
    });
  });

  it('renders modal trigger button with correct labels', () => {
    const html = renderToStaticMarkup(React.createElement(ImportResumeModal));
    expect(html).toContain('Import / Auto-Fill');
  });

  it('integrates state transitions and undo snapshots on resume data merge', () => {
    const state = useResumeStore.getState();
    const importedSample = {
      ...INITIAL_RESUME_DATA,
      contact: { ...INITIAL_RESUME_DATA.contact, fullName: 'Morgan Freeman', email: 'morgan@cinema.com' },
      experience: [
        {
          id: 'exp-1',
          visible: true,
          order: 0,
          company: 'Warner Bros',
          role: 'Lead Voice Artist',
          startDate: '2010-01',
          endDate: 'Present',
          current: true,
          bullets: ['Narrated award-winning feature documentaries.'],
        },
      ],
    };

    state.importResumeData(importedSample, 'merge');
    const updated = useResumeStore.getState();
    expect(updated.data.contact.fullName).toBe('Morgan Freeman');
    expect(updated.data.experience[0].company).toBe('Warner Bros');
    expect(updated.past.length).toBe(1);

    updated.undo();
    expect(useResumeStore.getState().data.contact.fullName).toBe('');
  });
});
```

- [ ] **Step 2: Update handleFile in components/editor/ImportResumeModal.tsx**

Replace `parseImportedFile` with the two-stage pipeline:
1. Stage 1: `extractTextFromFile(file)` extracts the text on client-side.
2. If `sourceType === 'json'`, parse JSON directly with `parseJsonResumeContent`.
3. Stage 2: POST `{ content: text, rawText: text, sourceType, fileName: file.name }` to `/api/ai/parse-resume`.
4. Fallback to heuristic parser if network or AI fails.

```typescript
const handleFile = async (file: File | null) => {
  setError(null);
  setParsed(null);
  setSource(null);
  if (!file) return;
  setIsParsing(true);
  setFileName(file.name);
  try {
    const extracted = await extractTextFromFile(file);
    if (extracted.sourceType === 'json') {
      const jsonData = parseJsonResumeContent(extracted.text);
      if (jsonData) {
        setParsed(jsonData);
        setSource('json');
        setPastedText('');
        return;
      }
    }

    // Call AI parsing endpoint
    const res = await fetch('/api/ai/parse-resume', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: extracted.text,
        rawText: extracted.text,
        sourceType: extracted.sourceType,
        fileName: file.name,
      }),
    });

    if (res.ok) {
      const result = await res.json();
      setParsed(result.data);
      setSource(result.source || 'heuristic');
    } else {
      setParsed(parseTextResumeContent(extracted.text));
      setSource('heuristic');
    }
    setPastedText('');
  } catch (err: any) {
    setError(err?.message || 'Failed to read the uploaded file.');
  } finally {
    setIsParsing(false);
  }
};
```

- [ ] **Step 3: Run test to verify it passes**

Run: `npx vitest run tests/import-resume-modal.test.tsx`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add components/editor/ImportResumeModal.tsx tests/import-resume-modal.test.tsx
git commit -m "feat(editor): connect file upload in ImportResumeModal to Stage 1 + Stage 2 AI parser"
```

---

### Task 4: Connect File Uploads in Dashboard Dialog (`ImportResumeDialog.tsx`) to Stage 1 + Stage 2 AI Pipeline

**Files:**
- Modify: `components/dashboard/ImportResumeDialog.tsx`
- Test: `tests/import-resume-dialog.test.tsx`

**Interfaces:**
- Consumes: `extractTextFromFile(file)`, `fetch('/api/ai/parse-resume')`, `POST /api/resumes`
- Produces: New resume document creation from uploaded and AI-fitted resume files.

- [ ] **Step 1: Write integration tests in tests/import-resume-dialog.test.tsx**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ImportResumeDialog } from '@/components/dashboard/ImportResumeDialog';
import { parseTextResumeContent } from '@/lib/import/resume-parser';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

describe('ImportResumeDialog Component', () => {
  it('renders default button trigger when open is false', () => {
    const html = renderToStaticMarkup(React.createElement(ImportResumeDialog));
    expect(html).toContain('Import Resume');
  });

  it('formats payload ready for POST /api/resumes with all sections', () => {
    const sampleText = `Taylor Swift\ntaylor@music.com\n\nSUMMARY\nAward-winning songwriter.\n\nEXPERIENCE\nLead Artist | Big Machine | 2006 - 2018\n- Released multi-platinum records.`;
    const parsed = parseTextResumeContent(sampleText);
    expect(parsed.contact.fullName).toBe('Taylor Swift');
    expect(parsed.experience.length).toBe(1);

    const postPayload = {
      title: `${parsed.contact.fullName} — Resume`,
      template_id: 'classic-ats',
      use_sample_data: false,
      content: parsed,
    };
    expect(postPayload.title).toBe('Taylor Swift — Resume');
    expect(postPayload.content.contact.fullName).toBe('Taylor Swift');
  });
});
```

- [ ] **Step 2: Update handleFile in components/dashboard/ImportResumeDialog.tsx**

Update `handleFile` to run `extractTextFromFile` followed by `/api/ai/parse-resume` and initialize document title from parsed contact:

```typescript
const handleFile = async (file: File | null) => {
  setError(null);
  setParsed(null);
  setSource(null);
  if (!file) return;
  setIsParsing(true);
  setFileName(file.name);
  try {
    const extracted = await extractTextFromFile(file);
    if (extracted.sourceType === 'json') {
      const jsonData = parseJsonResumeContent(extracted.text);
      if (jsonData) {
        setParsed(jsonData);
        setSource('json');
        setTitle(jsonData.contact.fullName ? `${jsonData.contact.fullName} — Resume` : file.name.replace(/\.[^/.]+$/, ''));
        setPastedText('');
        return;
      }
    }

    const res = await fetch('/api/ai/parse-resume', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: extracted.text,
        rawText: extracted.text,
        sourceType: extracted.sourceType,
        fileName: file.name,
      }),
    });

    if (res.ok) {
      const result = await res.json();
      setParsed(result.data);
      setSource(result.source || 'heuristic');
      setTitle(
        result.data?.contact?.fullName
          ? `${result.data.contact.fullName} — Resume`
          : file.name.replace(/\.[^/.]+$/, '')
      );
    } else {
      const heuristicData = parseTextResumeContent(extracted.text);
      setParsed(heuristicData);
      setSource('heuristic');
      setTitle(
        heuristicData.contact.fullName
          ? `${heuristicData.contact.fullName} — Resume`
          : file.name.replace(/\.[^/.]+$/, '')
      );
    }
    setPastedText('');
  } catch (err: any) {
    setError(err?.message || 'Failed to read the uploaded file.');
  } finally {
    setIsParsing(false);
  }
};
```

- [ ] **Step 3: Run test to verify it passes**

Run: `npx vitest run tests/import-resume-dialog.test.tsx`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add components/dashboard/ImportResumeDialog.tsx tests/import-resume-dialog.test.tsx
git commit -m "feat(dashboard): wire two-stage document extraction and AI schema fit to ImportResumeDialog"
```

---

### Task 5: End-to-End Test Suite & Typecheck Verification

**Files:**
- Test: All test files across the repository (`tests/*.test.ts`, `tests/*.test.tsx`)

**Interfaces:**
- Consumes: Vitest CLI, TypeScript compiler (`tsc`)
- Produces: 100% passing tests and zero TypeScript compiler errors

- [ ] **Step 1: Run full Vitest test suite**

Run: `npm test`
Expected: All tests pass across all test suites.

- [ ] **Step 2: Run TypeScript strict typecheck**

Run: `npm run typecheck`
Expected: 0 errors on `tsc --noEmit`.

- [ ] **Step 3: Commit final integration verification**

```bash
git commit --allow-empty -m "chore(import): verify full test suite and TypeScript type safety for two-stage resume import"
```

---
