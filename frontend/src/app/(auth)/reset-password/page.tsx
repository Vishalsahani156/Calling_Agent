import { InvalidResetToken } from '@/features/auth/components/InvalidResetToken';
import { ResetPasswordForm } from '@/features/auth/components/ResetPasswordForm';

interface ResetPasswordPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const { token } = await searchParams;

  if (!token) {
    return <InvalidResetToken />;
  }

  return <ResetPasswordForm token={token} />;
}
