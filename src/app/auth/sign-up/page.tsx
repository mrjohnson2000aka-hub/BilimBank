import type { Metadata } from 'next';
import SignUpForm from './SignUpForm';
import { env } from '@/lib/env';
export const metadata: Metadata = { title: 'Join' };
export default function Page() { return <SignUpForm google={env.googleSignIn} />; }
