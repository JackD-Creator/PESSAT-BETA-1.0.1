import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (!_client) {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY env vars');
    }
    _client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, storageKey: 'sb-anon-auth-token' },
    });
  }
  return _client;
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    const target = getClient();
    const val = target[prop as keyof SupabaseClient];
    return typeof val === 'function' ? val.bind(target) : val;
  },
});
