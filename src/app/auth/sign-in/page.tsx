import type { Metadata } from 'next';
import SignInForm from './SignInForm';
import { env } from '@/lib/env';
export const metadata: Metadata = { title: 'Sign in' };
export default function Page({ searchParams }: { searchParams: { next?: string } }) {
  const next = searchParams.next && searchParams.next.startsWith('/') && !searchParams.next.startsWith('//') ? searchParams.next : '/sessions';
  return <SignInForm google={env.googleSignIn} next={next} />;
}
