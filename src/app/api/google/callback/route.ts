import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { adminClient } from '@/lib/supabase/admin';
import { emailFromIdToken, exchangeCode } from '@/lib/google';
import { env } from '@/lib/env';
export async function GET(req: NextRequest) {
  const back = (r: string) => { const res = NextResponse.redirect(`${env.siteUrl}/settings/account?google=${r}`); res.cookies.delete('g_state'); return res; };
  const url = new URL(req.url), code = url.searchParams.get('code'), state = url.searchParams.get('state');
  if (!code || !state || state !== req.cookies.get('g_state')?.value) return back('error');
  const { data: { user } } = await createClient().auth.getUser();
  if (!user) return back('error');
  try {
    const t = await exchangeCode(code);
    if (!t.refresh_token) return back('error');
    await adminClient().from('calendar_integrations').upsert({ user_id: user.id, provider: 'google', google_email: emailFromIdToken(t.id_token), refresh_token: t.refresh_token, scope: t.scope || null, status: 'connected', last_error: null, connected_at: new Date().toISOString() });
    return back('ok');
  } catch { return back('error'); }
}
