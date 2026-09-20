import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Returns the configured base application URL.
 * Falls back to 'http://localhost:3000' if not defined.
 */
export function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}

/**
 * Returns the host/domain name for display or preview purposes.
 * Strips protocol and trailing slashes (e.g., 'wiz-resume.app' or 'localhost:3000').
 */
export function getAppHost(fallback: string = 'wiz-resume.app'): string {
  const url = process.env.NEXT_PUBLIC_APP_URL;
  if (!url || !url.trim()) {
    return fallback;
  }
  return url.trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '');
}

