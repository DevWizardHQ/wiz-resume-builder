import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { createServerClient, createBrowserClient } from '@supabase/ssr';
import { createClient as getBrowserClient } from '@/lib/supabase/client';
import { createClient as getServerClient } from '@/lib/supabase/server';
import { updateSession } from '@/lib/supabase/middleware';
import { login, signup, signOut } from '@/app/(auth)/auth-actions';

// Mock next/headers
vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({
    getAll: vi.fn().mockReturnValue([{ name: 'sb-auth-token', value: 'token-123' }]),
    set: vi.fn(),
  }),
}));

// Mock next/cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

// Mock @supabase/ssr to allow spying on createServerClient
vi.mock('@supabase/ssr', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@supabase/ssr')>();
  return {
    ...actual,
    createServerClient: vi.fn((...args: Parameters<typeof actual.createServerClient>) =>
      actual.createServerClient(...args)
    ),
  };
});

describe('Supabase Client & Auth Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Browser Client (lib/supabase/client.ts)', () => {
    it('initializes with fallback values when env vars are missing', () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      const client = getBrowserClient();
      expect(client).toBeDefined();
      expect(client.auth).toBeDefined();
    });

    it('initializes with custom environment variables when set', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://custom-project.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'custom-anon-key-12345';

      const client = getBrowserClient();
      expect(client).toBeDefined();
      expect(client.auth).toBeDefined();
    });
  });

  describe('Server Client (lib/supabase/server.ts)', () => {
    it('creates server client using async cookies', async () => {
      const client = await getServerClient();
      expect(client).toBeDefined();
      expect(client.auth).toBeDefined();
    });
  });

  describe('Middleware Session & Route Protection (lib/supabase/middleware.ts)', () => {
    it('redirects unauthenticated user from /dashboard to /login', async () => {
      const request = new NextRequest('http://localhost:3000/dashboard');
      const response = await updateSession(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe('http://localhost:3000/login');
    });

    it('redirects unauthenticated user from /editor to /login', async () => {
      const request = new NextRequest('http://localhost:3000/editor');
      const response = await updateSession(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe('http://localhost:3000/login');
    });

    it('redirects unauthenticated user from /cover-letters to /login', async () => {
      const request = new NextRequest('http://localhost:3000/cover-letters');
      const response = await updateSession(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe('http://localhost:3000/login');
    });

    it('allows public route / for unauthenticated user without redirect', async () => {
      const request = new NextRequest('http://localhost:3000/');
      const response = await updateSession(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('location')).toBeNull();
    });

    it('redirects authenticated user from /login to /dashboard', async () => {
      const mockGetUser = vi.fn().mockResolvedValue({
        data: { user: { id: 'usr-123', email: 'test@example.com' } },
        error: null,
      });

      vi.mocked(createServerClient).mockReturnValueOnce({
        auth: {
          getUser: mockGetUser,
        },
      } as any);

      const request = new NextRequest('http://localhost:3000/login');
      const response = await updateSession(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe('http://localhost:3000/dashboard');
    });

    it('redirects authenticated user from /signup to /dashboard', async () => {
      const mockGetUser = vi.fn().mockResolvedValue({
        data: { user: { id: 'usr-123', email: 'test@example.com' } },
        error: null,
      });

      vi.mocked(createServerClient).mockReturnValueOnce({
        auth: {
          getUser: mockGetUser,
        },
      } as any);

      const request = new NextRequest('http://localhost:3000/signup');
      const response = await updateSession(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe('http://localhost:3000/dashboard');
    });
  });

  describe('Auth Actions (app/(auth)/auth-actions.ts)', () => {
    it('returns an error if email or password is missing in login', async () => {
      const formData = new FormData();
      formData.set('email', 'test@example.com');
      // password missing

      const result = await login(formData);
      expect(result).toEqual({ error: 'Email and password are required.' });
    });

    it('returns an error if email or password is missing in signup', async () => {
      const formData = new FormData();
      formData.set('password', 'password123');
      // email missing

      const result = await signup(formData);
      expect(result).toEqual({ error: 'Email and password are required.' });
    });

    it('returns error message if supabase login fails', async () => {
      vi.mocked(createServerClient).mockReturnValueOnce({
        auth: {
          signInWithPassword: vi.fn().mockResolvedValue({
            error: { message: 'Invalid login credentials' },
          }),
        },
      } as any);

      const formData = new FormData();
      formData.set('email', 'wrong@example.com');
      formData.set('password', 'wrongpassword');

      const result = await login(formData);
      expect(result).toEqual({ error: 'Invalid login credentials' });
    });

    it('redirects to /dashboard on successful login', async () => {
      vi.mocked(createServerClient).mockReturnValueOnce({
        auth: {
          signInWithPassword: vi.fn().mockResolvedValue({
            error: null,
          }),
        },
      } as any);

      const formData = new FormData();
      formData.set('email', 'valid@example.com');
      formData.set('password', 'validpassword');

      await expect(login(formData)).rejects.toThrow('NEXT_REDIRECT:/dashboard');
    });

    it('redirects to /dashboard on successful signup', async () => {
      vi.mocked(createServerClient).mockReturnValueOnce({
        auth: {
          signUp: vi.fn().mockResolvedValue({
            error: null,
          }),
        },
      } as any);

      const formData = new FormData();
      formData.set('email', 'valid@example.com');
      formData.set('password', 'validpassword');

      await expect(signup(formData)).rejects.toThrow('NEXT_REDIRECT:/dashboard');
    });

    it('redirects to /login on signOut', async () => {
      const mockSignOut = vi.fn().mockResolvedValue({});
      vi.mocked(createServerClient).mockReturnValueOnce({
        auth: {
          signOut: mockSignOut,
        },
      } as any);

      await expect(signOut()).rejects.toThrow('NEXT_REDIRECT:/login');
      expect(mockSignOut).toHaveBeenCalled();
    });
  });
});
