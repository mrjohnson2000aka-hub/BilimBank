import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { adminClient } from '@/lib/supabase/admin';
import { sendDueEmails } from '@/lib/email';
import { serverEnv } from '@/lib/env';
// Called by the site right after an action so emails go out within seconds instead of waiting for the scheduler.
export async function POST() {
  const { data } = await createClient().auth.getUser();
  if (!data.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!serverEnv().serviceKey) return NextResponse.json({ skipped: 'not configured' });
  return NextResponse.json(await sendDueEmails(adminClient(), 15));
}
