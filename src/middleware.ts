import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const PRIVATE = ['/onboarding', '/settings', '/wallet', '/sessions', '/messages', '/notifications', '/admin'];

export async function middleware(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let res = NextResponse.next({ request: req });
  if (!url || !key) return res;
  const sb = createServerClient(url, key, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: list => {
        list.forEach(({ name, value }) => req.cookies.set(name, value));
        res = NextResponse.next({ request: req });
        list.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
      }
    }
  });
  const { data: { user } } = await sb.auth.getUser();
  const path = req.nextUrl.pathname;
  const isPrivate = PRIVATE.some(p => path === p || path.startsWith(p + '/'));
  if (isPrivate && !user) {
    const to = req.nextUrl.clone(); to.pathname = '/auth/sign-in'; to.search = '?next=' + encodeURIComponent(path + req.nextUrl.search);
    return NextResponse.redirect(to);
  }
  if (user && isPrivate && !path.startsWith('/onboarding') && !path.startsWith('/settings/account')) {
    const { data: p } = await sb.from('profiles').select('onboarded,status').eq('id', user.id).maybeSingle();
    if (p && !p.onboarded) { const to = req.nextUrl.clone(); to.pathname = '/onboarding'; to.search = ''; return NextResponse.redirect(to); }
  }
  return res;
}
export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.svg|api/cron|.*\\.(?:png|jpg|svg|webp)$).*)'] };
