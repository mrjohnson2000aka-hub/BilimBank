import { Logo } from './ui';
/** Shown when the site has been deployed without its database keys, instead of crashing. */
export default function SetupNeeded() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas p-6">
      <div className="max-w-lg rounded-2xl border border-line bg-white p-8 shadow-card">
        <Logo />
        <h1 className="mt-6 text-xl font-bold text-navy">BilimBank is not connected to its database yet</h1>
        <p className="mt-2 text-muted">The site is running, but the environment variables <code className="rounded bg-navy-50 px-1">NEXT_PUBLIC_SUPABASE_URL</code> and <code className="rounded bg-navy-50 px-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> are missing. Add them in your hosting settings and redeploy. The setup guide (SETUP.md) walks through every step.</p>
      </div>
    </div>
  );
}
