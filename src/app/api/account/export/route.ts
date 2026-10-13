import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
// Everything the signed-in person can see about themselves, as one JSON file.
export async function GET() {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const q = (t: string, col = 'user_id') => sb.from(t).select('*').eq(col, user.id);
  const [profile, priv, teach, learn, rules, exc, account, ledger, bookings, notes, reviews, reports, notifications, convs] = await Promise.all([
    q('profiles', 'id'), q('profile_private', 'id'), q('user_teaching_skills'), q('user_learning_skills'), q('availability_rules'), q('availability_exceptions'), q('credit_accounts'), q('credit_ledger'),
    sb.from('bookings').select('*'), sb.from('booking_private').select('booking_id,session_notes,meet_url'), sb.from('reviews').select('*').eq('reviewer_id', user.id), sb.from('reports').select('*').eq('reporter_id', user.id), q('notifications'), sb.from('conversations').select('id')
  ]);
  const { data: messages } = await sb.from('messages').select('*').in('conversation_id', (convs.data || []).map(c => c.id));
  const body = { exported_at: new Date().toISOString(), email: user.email, profile: profile.data, private: priv.data, teaching_skills: teach.data, learning_skills: learn.data, availability: rules.data, unavailable_dates: exc.data,
    credit_account: account.data, credit_ledger: ledger.data, bookings: bookings.data, session_notes: notes.data, reviews_written: reviews.data, reports_filed: reports.data, notifications: notifications.data, messages };
  return new NextResponse(JSON.stringify(body, null, 2), { headers: { 'Content-Type': 'application/json', 'Content-Disposition': 'attachment; filename="bilimbank-my-data.json"' } });
}
