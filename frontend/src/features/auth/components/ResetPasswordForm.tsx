'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { AuthCard, AuthLink } from '@/features/auth/components/AuthCard';
import { useResetPassword } from '@/features/auth/hooks/useResetPassword';
import { resetPasswordSchema, type ResetPasswordInput } from '@/features/auth/schemas';

interface ResetPasswordFormProps {
  token: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const resetMutation = useResetPassword();

  const form = useForm<Pick<ResetPasswordInput, 'password'>>({
    resolver: zodResolver(resetPasswordSchema.pick({ password: true })),
    defaultValues: {
      password: '',
    },
  });

  function onSubmit(values: Pick<ResetPasswordInput, 'password'>) {
    resetMutation.mutate({ token, password: values.password });
  }

  return (
    <AuthCard
      title="Reset password"
      description="Choose a new password for your account"
      footer={
        <p className="text-center text-muted-foreground sm:text-left">
          <AuthLink href="/login">Back to sign in</AuthLink>
        </p>
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    placeholder="Min. 8 characters"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={resetMutation.isPending}>
            {resetMutation.isPending ? (
              <>
                <Loader2 className="animate-spin" />
                Updating password...
              </>
            ) : (
              'Update password'
            )}
          </Button>
        </form>
      </Form>
    </AuthCard>
  );
}
