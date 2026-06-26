import { AcceptInviteForm } from '@/src/components/auth/AcceptInviteForm';

type PageProps = { params: Promise<{ token: string }> };

export default async function InviteAcceptPage({ params }: PageProps) {
  const { token } = await params;
  return <AcceptInviteForm token={token} />;
}
