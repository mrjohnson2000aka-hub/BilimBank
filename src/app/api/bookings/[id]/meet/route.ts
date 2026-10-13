import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { adminClient } from '@/lib/supabase/admin';
import { createMeetEvent, deleteEvent } from '@/lib/google';
import { env, integrationStatus } from '@/lib/env';

// Teacher-only: create the Google Calendar event with a Meet link for a confirmed session.
export async function POST(_: Request, { params }: { params: { id: string } }) {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { data: b } = await sb.from('bookings').select('*, skills(name_en)').eq('id', params.id).maybeSingle(); // RLS: participants only
  if (!b || b.teacher_id !== user.id) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (b.status !== 'confirmed') return NextResponse.json({ error: 'not_confirmed' }, { status: 400 });
  if (!integrationStatus().google || !integrationStatus().service) return NextResponse.json({ error: 'not_configured' }, { status: 400 });
  const admin = adminClient();
  const [{ data: integ }, { data: priv }] = await Promise.all([admin.from('calendar_integrations').select('*').eq('user_id', user.id).maybeSingle(), admin.from('booking_private').select('*').eq('booking_id', b.id).maybeSingle()]);
  if (priv?.meet_url) return NextResponse.json({ meet: priv.meet_url });
  if (!integ) return NextResponse.json({ error: 'not_connected' }, { status: 400 });
  const [{ data: lp }, { data: tp }, { data: lu }] = await Promise.all([admin.from('profiles').select('display_name,email_prefs').eq('id', b.learner_id).single(), admin.from('profiles').select('display_name').eq('id', b.teacher_id).single(), admin.auth.admin.getUserById(b.learner_id)]);
  const learnerOk = (lp?.email_prefs as Record<string, boolean> | null)?.calendar_invite !== false;
  try {
    const r = await createMeetEvent(integ.refresh_token, {
      summary: `BilimBank: ${b.skills?.name_en || 'Session'} (${tp?.display_name} & ${lp?.display_name})`,
      description: `BilimBank session. Details: ${env.siteUrl}/sessions/${b.id}`,
      start: b.start_at, end: b.end_at, attendees: learnerOk && lu?.user?.email ? [lu.user.email] : [], requestId: `bb-${b.id}`
    });
    await admin.from('booking_private').update({ meet_url: r.meet, meet_source: 'google', calendar_event_id: r.eventId, meet_error: null, updated_at: new Date().toISOString() }).eq('booking_id', b.id);
    await admin.from('notifications').insert({ user_id: b.learner_id, kind: 'meet_ready', booking_id: b.id });
    return NextResponse.json({ meet: r.meet });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'error';
    await admin.from('booking_private').update({ meet_error: msg.slice(0, 200) }).eq('booking_id', b.id);
    if (/invalid_grant/.test(msg)) await admin.from('calendar_integrations').update({ status: 'error', last_error: msg }).eq('user_id', user.id);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}

// Remove the calendar event after a cancellation (best effort).
export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { data: b } = await sb.from('bookings').select('id,teacher_id,learner_id,status').eq('id', params.id).maybeSingle();
  if (!b || ![b.teacher_id, b.learner_id].includes(user.id) || !['cancelled', 'declined', 'void'].includes(b.status) || !integrationStatus().service) return NextResponse.json({ ok: false });
  const admin = adminClient();
  const [{ data: priv }, { data: integ }] = await Promise.all([admin.from('booking_private').select('calendar_event_id').eq('booking_id', b.id).maybeSingle(), admin.from('calendar_integrations').select('refresh_token').eq('user_id', b.teacher_id).maybeSingle()]);
  if (priv?.calendar_event_id && integ) { try { await deleteEvent(integ.refresh_token, priv.calendar_event_id); } catch { /* event may already be gone */ } }
  return NextResponse.json({ ok: true });
}
