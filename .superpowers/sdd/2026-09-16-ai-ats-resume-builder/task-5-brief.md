# Task 5 Brief: Local LLM Engine (Ollama) & ATS Analyzer Utility

## Objective
Implement local AI inference client with Ollama integration, graceful offline fallback handling, ATS score analysis engine (format completeness + job description keyword match), and Next.js API route handlers for bullet rewriting, ATS auditing, and cover letter generation.

## Files to Create/Modify
- `lib/ai/local-client.ts`
- `lib/utils/ats-analyzer.ts`
- `app/api/ai/bullet-rewrite/route.ts`
- `app/api/ai/ats-audit/route.ts`
- `app/api/ai/cover-letter/route.ts`
- `tests/ats-analyzer.test.ts`
- `tests/local-ai-client.test.ts`

## Requirements & Implementation Details

1. **`lib/ai/local-client.ts`**:
   - Configuration constants: default endpoint `http://localhost:11434`, default model `llama3.2` / `mistral` / `qwen2.5`.
   - `checkOllamaHealth(endpoint?: string)`: Quick fetch with 2000ms timeout to `http://localhost:11434/api/tags` or `/v1/models`. Returns `{ available: boolean, models: string[], message?: string }`.
   - `rewriteBulletPoints(rawText: string, context?: string)`:
     - Prompt instructs LLM to rewrite input into 2-3 high-impact bullet points using Google's X-Y-Z formula: "Accomplished [X] as measured by [Y], by doing [Z]".
     - If Ollama is unreachable, fall back to rule-based bullet generator (extract sentences, prefix strong action verbs like "Spearheaded", "Optimized", "Architected", and add quantifiable metrics placeholders).
     - Return `{ bullets: string[], source: 'ollama' | 'fallback' }`.
   - `generateCoverLetter(resume: ResumeData, jobTitle: string, company: string, jobDescription?: string)`:
     - Prompts LLM for a 3-4 paragraph tailored professional cover letter.
     - Falls back to a structured template if Ollama is unreachable.
     - Return `{ coverLetter: string, source: 'ollama' | 'fallback' }`.

2. **`lib/utils/ats-analyzer.ts`**:
   - `AtsAnalysisResult` interface:
     - `overallScore: number` (0-100)
     - `formatScore: number` (0-100)
     - `keywordScore: number` (0-100)
     - `matchedKeywords: string[]`
     - `missingKeywords: string[]`
     - `suggestions: string[]`
     - `warnings: string[]`
     - `metricsCount: number`
     - `actionVerbCount: number`
   - `analyzeAtsScore(resume: ResumeData, jobDescription?: string): AtsAnalysisResult`:
     - Evaluates contact information (email, phone, location).
     - Evaluates summary length and strength.
     - Evaluates experience bullets: checks for action verbs (e.g. "Developed", "Engineered", "Managed", "Reduced", "Increased") and quantifiable numbers/percentages (`\d+%|\$\d+|\d+x|\d+`).
     - Extracts technical/domain keywords from `jobDescription` (if provided) and calculates overlap with resume text.
     - Computes balanced overall score and actionable suggestions.

3. **API Routes**:
   - `app/api/ai/bullet-rewrite/route.ts`: POST route accepting `{ text: string, context?: string }`.
   - `app/api/ai/ats-audit/route.ts`: POST route accepting `{ resume: ResumeData, jobDescription?: string }`.
   - `app/api/ai/cover-letter/route.ts`: POST route accepting `{ resume: ResumeData, jobTitle: string, company: string, jobDescription?: string }`.

4. **Tests**:
   - `tests/ats-analyzer.test.ts`: test format scoring, keyword matching, action verbs detection, suggestions for empty vs complete resumes.
   - `tests/local-ai-client.test.ts`: test rule-based fallback generation when offline, health checker response shape, prompt builder.

5. Run `npm test` and `npm run typecheck` to verify all tests pass with 0 errors.
6. Commit changes to git.

## Report File
Write full execution details to `.superpowers/sdd/2026-09-16-ai-ats-resume-builder/task-5-report.md`.
