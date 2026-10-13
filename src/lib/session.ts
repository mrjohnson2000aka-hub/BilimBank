import { cache } from 'react';
import { getSessionUser } from './supabase/server';
/** One auth + profile lookup per request, shared by layout and page. */
export const currentUser = cache(getSessionUser);
