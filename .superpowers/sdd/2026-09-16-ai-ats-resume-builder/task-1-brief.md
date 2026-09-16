# Task 1 Brief: Next.js Foundation, Package Dependencies & Test Setup

## Objective
Initialize the Next.js 15 App Router project with React 19, TypeScript, Tailwind CSS, shadcn/ui utility tokens, Vitest configuration, and verify that the test runner executes cleanly.

## Files to Create/Modify
- `package.json`
- `tsconfig.json`
- `next.config.ts`
- `tailwind.config.ts`
- `postcss.config.mjs`
- `vitest.config.ts`
- `lib/utils.ts`
- `app/globals.css`
- `app/layout.tsx`
- `app/page.tsx`
- `tests/sanity.test.ts`

## Requirements
1. **`package.json`**: Include Next.js 15, React 19, Tailwind CSS, Zustand, @dnd-kit packages, @react-pdf/renderer, docx, ai, zod, @supabase/ssr, lucide-react, class-variance-authority, clsx, tailwind-merge, vitest.
2. **`tsconfig.json`**: Target ES2022, moduleResolution bundler, paths mapping `@/*` to `./*`.
3. **`tailwind.config.ts`**: Configure shadcn theme tokens with CSS variables for light/dark mode and animations.
4. **`postcss.config.mjs`**: Configure tailwindcss and autoprefixer plugins.
5. **`vitest.config.ts`**: Configure Vitest with path aliases pointing `@/` to `./`.
6. **`lib/utils.ts`**: Export `cn(...inputs: ClassValue[])` using `clsx` and `twMerge`.
7. **`app/globals.css`**: Tailwind base styles and CSS variables.
8. **`app/layout.tsx` & `app/page.tsx`**: Clean initial layout and placeholder page.
9. **`tests/sanity.test.ts`**: Sanity test asserting `cn()` behaves correctly.
10. Run `npm install` and `npm test` to verify everything works.
11. Commit changes to git.

## Report File
Write full execution details to `.superpowers/sdd/2026-09-16-ai-ats-resume-builder/task-1-report.md`.
