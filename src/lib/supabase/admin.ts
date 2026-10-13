import { createClient } from '@supabase/supabase-js';
import { env, serverEnv } from '@/lib/env';
/** Service-role client for trusted server code only (email sender, Google tokens, account deletion). */
export function adminClient() {
  const key = serverEnv().serviceKey;
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
  return createClient(env.supabaseUrl, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
