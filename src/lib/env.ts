export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  supabaseAnon: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  siteUrl: (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, ''),
  googleSignIn: process.env.NEXT_PUBLIC_GOOGLE_SIGNIN === 'true',
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || ''
};
export const isConfigured = () => !!(env.supabaseUrl && env.supabaseAnon);

/** Server-only secrets. Never import this from a client component. */
export function serverEnv() {
  return {
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    resendKey: process.env.RESEND_API_KEY || '',
    emailFrom: process.env.EMAIL_FROM || '',
    googleClientId: process.env.GOOGLE_CLIENT_ID || '',
    googleSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    cronSecret: process.env.CRON_SECRET || '',
    // Gmail (or any SMTP) instead of Resend — no own domain needed
    smtpUser: process.env.SMTP_USER || '',
    smtpPass: (process.env.SMTP_PASS || '').replace(/\s+/g, ''),
    smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
    smtpPort: Number(process.env.SMTP_PORT || 465),
    smtpInsecure: process.env.SMTP_INSECURE_TEST === '1'
  };
}
export function integrationStatus() {
  const s = serverEnv();
  return { email: !!((s.resendKey && s.emailFrom) || (s.smtpUser && s.smtpPass)), google: !!(s.googleClientId && s.googleSecret), service: !!s.serviceKey, cron: !!s.cronSecret };
}
