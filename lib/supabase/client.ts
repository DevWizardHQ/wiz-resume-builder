import { createBrowserClient } from '@supabase/ssr';
import { getSupabaseCredentials } from './config';

export function createClient() {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseCredentials();
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
