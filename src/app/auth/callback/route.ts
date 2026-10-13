import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
// Handles links from confirmation, password-reset and Google sign-in emails.
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const raw = url.searchParams.get('next') || '/onboarding';
  const next = raw.startsWith('/') && !raw.startsWith('//') ? raw : '/onboarding';
  if (code) {
    const { error } = await createClient().auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, url.origin));
  }
  return NextResponse.redirect(new URL('/auth/sign-in?error=link', url.origin));
}
