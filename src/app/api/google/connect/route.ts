import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { createClient } from '@/lib/supabase/server';
import { authUrl } from '@/lib/google';
import { env, integrationStatus } from '@/lib/env';
export async function GET() {
  const { data: { user } } = await createClient().auth.getUser();
  if (!user) return NextResponse.redirect(`${env.siteUrl}/auth/sign-in?next=/settings/account`);
  if (!integrationStatus().google) return NextResponse.redirect(`${env.siteUrl}/settings/account?google=error`);
  const state = randomBytes(16).toString('hex');
  const res = NextResponse.redirect(authUrl(state));
  res.cookies.set('g_state', state, { httpOnly: true, secure: env.siteUrl.startsWith('https'), sameSite: 'lax', maxAge: 600, path: '/' });
  return res;
}
