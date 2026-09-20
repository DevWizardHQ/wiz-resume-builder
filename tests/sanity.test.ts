import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { cn, getAppUrl, getAppHost } from '@/lib/utils';

describe('Sanity & Utilities', () => {
  const originalEnv = process.env.NEXT_PUBLIC_APP_URL;

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.NEXT_PUBLIC_APP_URL = originalEnv;
    } else {
      delete process.env.NEXT_PUBLIC_APP_URL;
    }
  });

  it('combines classnames with tailwind-merge', () => {
    expect(cn('px-2 py-1', 'px-4', { 'text-red-500': true })).toBe('py-1 px-4 text-red-500');
  });

  it('handles conditional and conflicting tailwind classes', () => {
    expect(cn('bg-red-500', false && 'bg-blue-500', 'bg-green-500')).toBe('bg-green-500');
  });

  it('resolves base app url from NEXT_PUBLIC_APP_URL with fallback', () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    expect(getAppUrl()).toBe('http://localhost:3000');

    process.env.NEXT_PUBLIC_APP_URL = 'https://custom-resume.app';
    expect(getAppUrl()).toBe('https://custom-resume.app');
  });

  it('extracts sanitized host for display from environment variable with fallback', () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    expect(getAppHost()).toBe('wiz-resume.app');
    expect(getAppHost('custom-default.app')).toBe('custom-default.app');

    process.env.NEXT_PUBLIC_APP_URL = 'https://wiz-resume.app/';
    expect(getAppHost()).toBe('wiz-resume.app');

    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000/';
    expect(getAppHost()).toBe('localhost:3000');
  });
});
