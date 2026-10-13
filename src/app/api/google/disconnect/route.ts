import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { adminClient } from '@/lib/supabase/admin';
export async function POST() {
  const { data: { user } } = await createClient().auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const admin = adminClient();
  const { data } = await admin.from('calendar_integrations').select('refresh_token').eq('user_id', user.id).maybeSingle();
  if (data?.refresh_token) await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(data.refresh_token)}`, { method: 'POST' }).catch(() => {});
  await admin.from('calendar_integrations').delete().eq('user_id', user.id);
  return NextResponse.json({ ok: true });
}
