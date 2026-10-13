import { Skeleton } from '@/components/ui';
export default function Loading() {
  return <div className="wrap py-10"><Skeleton className="h-9 w-56" /><Skeleton className="mt-3 h-5 w-96 max-w-full" /><Skeleton className="mt-6 h-20 w-full" />
    <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-64" />)}</div></div>;
}
