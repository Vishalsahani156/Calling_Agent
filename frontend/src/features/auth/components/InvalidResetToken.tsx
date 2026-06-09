import { AuthCard, AuthLink } from '@/features/auth/components/AuthCard';

export function InvalidResetToken() {
  return (
    <AuthCard
      title="Invalid reset link"
      description="This password reset link is missing or expired. Request a new one to continue."
      footer={
        <p className="text-center text-muted-foreground sm:text-left">
          <AuthLink href="/forgot-password">Request new reset link</AuthLink>
          {' · '}
          <AuthLink href="/login">Back to sign in</AuthLink>
        </p>
      }
    >
      <p className="text-sm text-muted-foreground">
        Reset links are single-use and expire after one hour.
      </p>
    </AuthCard>
  );
}
