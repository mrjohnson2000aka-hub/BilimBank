import { EmptyState, LinkButton } from '@/components/ui';
export default function NotFound() {
  return <div className="wrap py-20"><EmptyState title="Page not found / Sahifa topilmadi" text="The link may be old or mistyped." action={<LinkButton href="/">BilimBank</LinkButton>} /></div>;
}
