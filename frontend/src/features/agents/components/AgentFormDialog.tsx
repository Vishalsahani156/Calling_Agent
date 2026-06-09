'use client';

import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { GreetingScriptField } from '@/features/agents/components/GreetingScriptField';
import { useCreateAgent } from '@/features/agents/hooks/useCreateAgent';
import { useUpdateAgent } from '@/features/agents/hooks/useUpdateAgent';
import { agentFormSchema, type AgentFormValues } from '@/features/agents/schemas';
import type { Agent } from '@/features/agents/types';
import {
  agentToFormValues,
  formValuesToCreateInput,
  formValuesToUpdateInput,
  parseJsonRecord,
} from '@/features/agents/utils/json';

interface AgentFormDialogProps {
  agent?: Agent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canWrite: boolean;
}

export function AgentFormDialog({ agent, open, onOpenChange, canWrite }: AgentFormDialogProps) {
  const isEdit = !!agent;
  const createMutation = useCreateAgent();
  const updateMutation = useUpdateAgent(agent?.id ?? '');

  const form = useForm<AgentFormValues>({
    resolver: zodResolver(agentFormSchema),
    defaultValues: agentToFormValues(),
  });

  useEffect(() => {
    if (open) {
      form.reset(agentToFormValues(agent ?? undefined));
    }
  }, [open, agent, form]);

  if (!canWrite) return null;

  function validateJsonFields(values: AgentFormValues): boolean {
    try {
      parseJsonRecord(values.voiceProfileJson);
      parseJsonRecord(values.llmConfigJson);
      parseJsonRecord(values.toolsEnabledJson);
      return true;
    } catch {
      toast.error('One or more JSON fields contain invalid data');
      return false;
    }
  }

  function onSubmit(values: AgentFormValues) {
    if (!validateJsonFields(values)) return;

    if (isEdit && agent) {
      updateMutation.mutate(formValuesToUpdateInput(values), {
        onSuccess: () => onOpenChange(false),
      });
      return;
    }

    createMutation.mutate(formValuesToCreateInput(values), {
      onSuccess: () => onOpenChange(false),
    });
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit agent' : 'Create agent'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Sales assistant" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="personalityPrompt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Personality prompt</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="You are a helpful sales assistant..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <GreetingScriptField control={form.control} />

            <FormField
              control={form.control}
              name="voiceProfileJson"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Voice profile (JSON)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='{"provider":"elevenlabs","voiceId":"..."}'
                      className="min-h-[80px] font-mono text-xs"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>TTS voice configuration object.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="interruptionEnabled"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-md border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Interruption enabled</FormLabel>
                      <FormDescription className="text-xs">
                        Allow callers to interrupt the agent.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maxSilenceSeconds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max silence (seconds)</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} max={300} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="llmConfigJson"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>LLM config (JSON)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='{"model":"gpt-4o-mini","temperature":0.7}'
                      className="min-h-[80px] font-mono text-xs"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Model and generation settings.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="toolsEnabledJson"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tools enabled (JSON)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="{}"
                      className="min-h-[80px] font-mono text-xs"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Feature flags for agent tools.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending ? <Loader2 className="animate-spin" /> : isEdit ? 'Save changes' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
