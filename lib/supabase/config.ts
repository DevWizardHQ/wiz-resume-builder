export function getSupabaseCredentials() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock.supabase.co';

  const isPlaceholder = (val?: string) =>
    !val ||
    val.includes('your-supabase-') ||
    val.includes('mock-') ||
    val.includes('placeholder') ||
    val.trim() === '';

  const pubKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let key = 'mock-anon-key';

  // 1. Check for real (non-placeholder) publishable or anon key
  if (pubKey && !isPlaceholder(pubKey)) {
    key = pubKey;
  } else if (anonKey && !isPlaceholder(anonKey)) {
    key = anonKey;
  } else if (pubKey && pubKey.trim() !== '') {
    key = pubKey;
  } else if (anonKey && anonKey.trim() !== '') {
    key = anonKey;
  }

  return { supabaseUrl, supabaseAnonKey: key };
}
