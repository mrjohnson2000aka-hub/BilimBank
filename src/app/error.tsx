'use client';
import { Button, EmptyState } from '@/components/ui';
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return <div className="wrap py-20"><EmptyState title="Something went wrong. / Xatolik yuz berdi." text="Please try again. If it keeps happening, tell the administrators." action={<Button onClick={reset}>Try again</Button>} /></div>;
}
