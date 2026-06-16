'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Phone } from 'lucide-react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useTestCall } from '@/features/calls/hooks/useTestCall';

const voiceTestFormSchema = z.object({
  phone: z.string().min(10, 'Enter a valid phone number').max(20),
});

type VoiceTestFormValues = z.infer<typeof voiceTestFormSchema>;

interface TestVoiceCallPanelProps {
  agentId: string;
  agentName: string;
  canCall: boolean;
}

export function TestVoiceCallPanel({ agentId, agentName, canCall }: TestVoiceCallPanelProps) {
  const testCallMutation = useTestCall();

  const form = useForm<VoiceTestFormValues>({
    resolver: zodResolver(voiceTestFormSchema),
    defaultValues: { phone: '' },
  });

  if (!canCall) return null;

  function onSubmit(values: VoiceTestFormValues) {
    testCallMutation.mutate(
      { phone: values.phone.trim(), aiAgentId: agentId },
      {
        onSuccess: (result) => {
          form.reset();
          if (result.callId) {
            // Toast already shown by hook
          }
        },
      },
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="h-4 w-4" />
          Test Voice Call
        </CardTitle>
        <CardDescription>
          Place a real phone call using agent &quot;{agentName}&quot;. Your phone will ring and the
          AI agent will speak when you answer.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Requires Exotel configured, voice server running (<code>npm run voice</code>), and a
          public WebSocket URL in your Exotel flow (use ngrok for local dev).
        </p>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your phone number</FormLabel>
                  <FormControl>
                    <Input placeholder="9876543210 or +919876543210" {...field} />
                  </FormControl>
                  <FormDescription>
                    Number to dial. Use the phone you will answer.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={testCallMutation.isPending}>
                {testCallMutation.isPending ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Phone className="h-4 w-4" />
                )}
                Call now
              </Button>
              {testCallMutation.data?.callId ? (
                <Button variant="outline" asChild>
                  <Link href={`/calls/${testCallMutation.data.callId}`}>View call status</Link>
                </Button>
              ) : null}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
