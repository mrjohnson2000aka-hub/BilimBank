import { env, serverEnv } from './env';
export const GOOGLE_SCOPE = 'openid email https://www.googleapis.com/auth/calendar.events';
export const redirectUri = () => `${env.siteUrl}/api/google/callback`;
export function authUrl(state: string) {
  const p = new URLSearchParams({ client_id: serverEnv().googleClientId, redirect_uri: redirectUri(), response_type: 'code', scope: GOOGLE_SCOPE, access_type: 'offline', prompt: 'consent', include_granted_scopes: 'true', state });
  return `https://accounts.google.com/o/oauth2/v2/auth?${p}`;
}
async function token(body: Record<string, string>) {
  const s = serverEnv();
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ client_id: s.googleClientId, client_secret: s.googleSecret, ...body }) });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error_description || j.error || `Google token error ${r.status}`);
  return j as { access_token: string; refresh_token?: string; id_token?: string; scope?: string };
}
export const exchangeCode = (code: string) => token({ code, grant_type: 'authorization_code', redirect_uri: redirectUri() });
export const accessToken = async (refresh: string) => (await token({ refresh_token: refresh, grant_type: 'refresh_token' })).access_token;
export function emailFromIdToken(idt?: string) {
  try { return JSON.parse(Buffer.from((idt || '').split('.')[1], 'base64url').toString()).email as string; } catch { return null; }
}
export async function createMeetEvent(refresh: string, ev: { summary: string; description: string; start: string; end: string; attendees: string[]; requestId: string }) {
  const at = await accessToken(refresh);
  const r = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1&sendUpdates=all', {
    method: 'POST', headers: { Authorization: `Bearer ${at}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ summary: ev.summary, description: ev.description, start: { dateTime: ev.start }, end: { dateTime: ev.end }, attendees: ev.attendees.map(email => ({ email })),
      reminders: { useDefault: true }, conferenceData: { createRequest: { requestId: ev.requestId, conferenceSolutionKey: { type: 'hangoutsMeet' } } } })
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error?.message || `Google Calendar error ${r.status}`);
  const meet: string | undefined = j.hangoutLink || j.conferenceData?.entryPoints?.find((e: { entryPointType: string; uri: string }) => e.entryPointType === 'video')?.uri;
  if (!meet || !/^https:\/\/meet\.google\.com\/[a-z0-9-]+$/.test(meet)) throw new Error('Google did not return a Meet link');
  return { meet, eventId: j.id as string };
}
export async function deleteEvent(refresh: string, eventId: string) {
  const at = await accessToken(refresh);
  await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(eventId)}?sendUpdates=all`, { method: 'DELETE', headers: { Authorization: `Bearer ${at}` } });
}
