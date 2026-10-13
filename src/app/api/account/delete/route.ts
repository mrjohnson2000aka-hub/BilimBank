import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { adminClient } from '@/lib/supabase/admin';
// Removes personal data and signs the account out for good. Ledger and booking rows stay (anonymous) so other balances remain correct.
export async function POST() {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { count } = await sb.from('bookings').select('id', { count: 'exact', head: true }).in('status', ['pending', 'confirmed', 'disputed']);
  if (count) return NextResponse.json({ error: 'open_sessions' }, { status: 409 });
  const admin = adminClient(), id = user.id;
  await Promise.all([
    admin.from('user_teaching_skills').delete().eq('user_id', id), admin.from('user_learning_skills').delete().eq('user_id', id), admin.from('availability_rules').delete().eq('user_id', id),
    admin.from('availability_exceptions').delete().eq('user_id', id), admin.from('calendar_integrations').delete().eq('user_id', id), admin.from('user_blocks').delete().eq('blocker_id', id),
    admin.from('profile_private').update({ birth_date: null, guardian_email: null }).eq('id', id)
  ]);
  const { error } = await admin.from('profiles').update({ status: 'deleted', display_name: 'Former member', username: 'deleted_' + id.replace(/-/g, '').slice(0, 10), bio: null, avatar_url: null, school: null, education_level: null, country: null, languages: [], show_on_leaderboard: false, email_prefs: {} }).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await admin.auth.admin.deleteUser(id, true);
  return NextResponse.json({ ok: true });
}
