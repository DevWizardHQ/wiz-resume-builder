'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

export interface AuthActionResult {
  error?: string;
  message?: string;
  success?: boolean;
}

export async function login(formData: FormData): Promise<AuthActionResult | void> {
  const email = (formData.get('email') as string)?.trim();
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Email and password are required.' };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}

export async function signup(formData: FormData): Promise<AuthActionResult | void> {
  const email = (formData.get('email') as string)?.trim();
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Email and password are required.' };
  }

  let origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  try {
    const headerList = await headers();
    const originHeader = headerList.get('origin');
    if (originHeader) {
      origin = originHeader;
    }
  } catch {
    // Fallback to process.env.NEXT_PUBLIC_APP_URL
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  // If Supabase requires email verification, user is created but session is null
  if (data?.user && !data?.session) {
    return {
      success: true,
      message: 'Account created! Please check your email inbox to verify your account before logging in.',
    };
  }

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}
