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
import { useForgotPassword } from '@/features/auth/hooks/useForgotPassword';
import { forgotPasswordSchema, type ForgotPasswordInput } from '@/features/auth/schemas';

export function ForgotPasswordForm() {
  const forgotMutation = useForgotPassword();

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  function onSubmit(values: ForgotPasswordInput) {
    forgotMutation.mutate(values, {
      onSuccess: () => form.reset(),
    });
  }

  return (
    <AuthCard
      title="Forgot password"
      description="Enter your email and we will send you a reset link if an account exists"
      footer={
        <p className="text-center text-muted-foreground sm:text-left">
          Remember your password? <AuthLink href="/login">Back to sign in</AuthLink>
        </p>
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    autoComplete="email"
                    placeholder="you@company.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={forgotMutation.isPending}>
            {forgotMutation.isPending ? (
              <>
                <Loader2 className="animate-spin" />
                Sending link...
              </>
            ) : (
              'Send reset link'
            )}
          </Button>
        </form>
      </Form>
    </AuthCard>
  );
}
