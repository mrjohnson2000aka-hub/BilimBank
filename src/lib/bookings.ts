import type { SupabaseClient } from '@supabase/supabase-js';
import { displayStatus, type Booking } from './format';
export type BookingRow = Booking & { skills: { name_en: string; name_uz: string; slug: string } | null };
export type Person = { id: string; username: string; display_name: string; avatar_url: string | null };
export const TAB_OF: Record<string, string> = { upcoming: 'upcoming', in_progress: 'upcoming', pending: 'pending', awaiting: 'awaiting', disputed: 'awaiting', completed: 'completed', no_show_learner: 'completed', no_show_teacher: 'completed', cancelled: 'cancelled', declined: 'cancelled', expired: 'cancelled', void: 'cancelled' };
export function needsAction(b: Booking, me: string) {
  const s = displayStatus(b);
  if (s === 'pending') return b.teacher_id === me;
  if (s === 'in_progress' || s === 'awaiting') return me === b.learner_id ? !b.learner_done_at : !b.teacher_done_at;
  return false;
}
export async function peopleById(sb: SupabaseClient, ids: string[]): Promise<Record<string, Person>> {
  if (!ids.length) return {};
  const { data } = await sb.from('public_profiles').select('id,username,display_name,avatar_url').in('id', Array.from(new Set(ids)));
  return Object.fromEntries((data || []).map(p => [p.id, p as Person]));
}
