import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('Sanity & Utilities', () => {
  it('combines classnames with tailwind-merge', () => {
    expect(cn('px-2 py-1', 'px-4', { 'text-red-500': true })).toBe('py-1 px-4 text-red-500');
  });

  it('handles conditional and conflicting tailwind classes', () => {
    expect(cn('bg-red-500', false && 'bg-blue-500', 'bg-green-500')).toBe('bg-green-500');
  });
});
