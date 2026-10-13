import { NextResponse, type NextRequest } from 'next/server';
import { adminClient } from '@/lib/supabase/admin';
import { sendDueEmails } from '@/lib/email';
import { serverEnv } from '@/lib/env';
export const dynamic = 'force-dynamic';
// Scheduled job: expire unanswered requests, then send due emails and reminders.
export async function GET(req: NextRequest) {
  const secret = serverEnv().cronSecret;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const admin = adminClient();
  const { data: expired, error } = await admin.rpc('sweep');
  const mail = await sendDueEmails(admin, 100);
  return NextResponse.json({ expired, error: error?.message, ...mail });
}
export const POST = GET;
