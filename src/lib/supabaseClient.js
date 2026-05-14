import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  '';

let supabaseClient = null;

export const isSupabaseConfigured = () => Boolean(supabaseUrl && supabaseKey);

export const getSupabaseClient = () => {
  if (!isSupabaseConfigured()) return null;
  if (supabaseClient) return supabaseClient;

  supabaseClient = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      storageKey: 'today_mbti_supabase_auth'
    }
  });

  return supabaseClient;
};

export const ensureAnonymousUser = async () => {
  const client = getSupabaseClient();
  if (!client) return { ok: false, reason: 'not_configured' };

  const { data: sessionData, error: sessionError } = await client.auth.getSession();
  if (sessionError) return { ok: false, reason: 'session_error', error: sessionError };
  if (sessionData?.session?.user) return { ok: true, user: sessionData.session.user };

  const { data, error } = await client.auth.signInAnonymously();
  if (error || !data?.user) {
    return { ok: false, reason: 'anonymous_auth_error', error };
  }

  return { ok: true, user: data.user };
};
