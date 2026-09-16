# Task 2 Brief: Supabase SSR Client, Database Migration & Auth Pages

## Objective
Implement Supabase SSR client factories (`client.ts`, `server.ts`, `middleware.ts`), root middleware protection for authenticated routes (`/dashboard`, `/editor`, `/cover-letters`), server actions for authentication (`login`, `signup`, `signOut`), responsive authentication UI pages (`/login` and `/signup`), and unit tests for Supabase configuration.

## Files to Create/Modify
- `supabase/migrations/001_init.sql` (verify and ensure complete schema)
- `lib/supabase/client.ts`
- `lib/supabase/server.ts`
- `lib/supabase/middleware.ts`
- `middleware.ts`
- `app/(auth)/login/page.tsx`
- `app/(auth)/signup/page.tsx`
- `app/(auth)/auth-actions.ts`
- `tests/supabase-config.test.ts`

## Requirements & Implementation Details

1. **`lib/supabase/client.ts`**:
   - Export `createClient()` using `createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)` from `@supabase/ssr`.
   - Provide safe fallback strings (e.g. `'https://mock.supabase.co'`, `'mock-anon-key'`) if environment variables are not set during local testing.

2. **`lib/supabase/server.ts`**:
   - Export `async function createClient()` using `createServerClient` from `@supabase/ssr` and `await cookies()` from `next/headers` (Next.js 15 `cookies()` is async).
   - Implement `getAll` and `setAll` cookie handlers safely.

3. **`lib/supabase/middleware.ts`**:
   - Export `async function updateSession(request: NextRequest)` using `createServerClient` from `@supabase/ssr` to refresh user session tokens on each incoming request.
   - Redirect unauthenticated users accessing `/dashboard`, `/editor`, or `/cover-letters` to `/login`.
   - Redirect authenticated users accessing `/login` or `/signup` to `/dashboard`.

4. **`middleware.ts`**:
   - Call `updateSession(request)`.
   - Matcher config: exclude static assets, favicon, `_next/static`, `_next/image`, and public images.

5. **`app/(auth)/auth-actions.ts`**:
   - `'use server'` actions: `login(formData: FormData)`, `signup(formData: FormData)`, `signOut()`.
   - Use server Supabase client, call `signInWithPassword`, `signUp`, and `signOut`.
   - Handle errors gracefully and use Next.js `redirect()` for page transitions.

6. **`app/(auth)/login/page.tsx` & `app/(auth)/signup/page.tsx`**:
   - Clean, modern UI using Tailwind CSS, card layouts, inputs for email and password, submit buttons with loading states, error displays, and links to toggle between Login and Signup.

7. **`tests/supabase-config.test.ts`**:
   - Vitest tests verifying `createBrowserClient` initialization and fallback behaviors.

8. Run `npm test` and `npm run typecheck` to verify all tests pass and TypeScript compiles cleanly.
9. Commit all changes to git.

## Report File
Write full execution details to `.superpowers/sdd/2026-09-16-ai-ats-resume-builder/task-2-report.md`.
