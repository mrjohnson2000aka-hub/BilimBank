import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { env } from '@/lib/env';

export function createClient() {
  const store = cookies();
  return createServerClient(env.supabaseUrl, env.supabaseAnon, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: list => { try { list.forEach(({ name, value, options }) => store.set(name, value, options)); } catch { /* called from a server component; middleware refreshes the session */ } }
    }
  });
}

export async function getSessionUser() {
  const sb = createClient();
  const { data } = await sb.auth.getUser();
  if (!data.user) return { sb, user: null, profile: null };
  const { data: profile } = await sb.from('profiles').select('*').eq('id', data.user.id).maybeSingle();
  return { sb, user: data.user, profile: profile as Profile | null };
}

export type Profile = {
  id: string; username: string; display_name: string; avatar_url: string | null; bio: string | null; school: string | null; education_level: string | null;
  show_school: boolean; country: string | null; timezone: string; preferred_lang: 'en' | 'uz'; languages: string[]; min_notice_hours: number; horizon_days: number;
  buffer_minutes: number; session_durations: number[]; show_on_leaderboard: boolean; email_prefs: Record<string, boolean>; role: 'student' | 'admin';
  status: 'active' | 'suspended' | 'deleted'; is_minor: boolean; onboarded: boolean; created_at: string;
};
