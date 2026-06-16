'use client';

import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';

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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAgents } from '@/features/agents/hooks/useAgents';
import { useCreateCampaign } from '@/features/campaigns/hooks/useCreateCampaign';
import {
  createCampaignSchema,
  type CreateCampaignInput,
} from '@/features/campaigns/schemas';
import { useKnowledgeBases } from '@/features/knowledge/hooks/useKnowledgeBases';
import { useSettings } from '@/features/settings/hooks/useSettings';

interface CampaignFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canWrite: boolean;
}

export function CampaignFormDialog({ open, onOpenChange, canWrite }: CampaignFormDialogProps) {
  const createMutation = useCreateCampaign();
  const { data: agents } = useAgents({ limit: '100' });
  const { data: knowledgeBases } = useKnowledgeBases({ limit: '100' });
  const { data: settings } = useSettings();

  const form = useForm<CreateCampaignInput>({
    resolver: zodResolver(createCampaignSchema),
    defaultValues: {
      name: '',
      description: '',
      aiAgentId: '',
      knowledgeBaseId: '',
      callerPhone: '',
      exotelFlowUrl: '',
      maxConcurrentCalls: 1,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: '',
        description: '',
        aiAgentId: '',
        knowledgeBaseId: '',
        callerPhone: settings?.defaultCallerId ?? '',
        exotelFlowUrl: '',
        maxConcurrentCalls: 1,
      });
    }
  }, [open, settings?.defaultCallerId, form]);

  if (!canWrite) return null;

  function onSubmit(values: CreateCampaignInput) {
    createMutation.mutate(values, {
      onSuccess: () => onOpenChange(false),
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New campaign</DialogTitle>
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
                    <Input placeholder="Outbound sales Q1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Optional campaign notes" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="aiAgentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>AI agent</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select agent" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {agents?.data.map((agent) => (
                        <SelectItem key={agent.id} value={agent.id}>
                          {agent.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="knowledgeBaseId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Knowledge base (optional)</FormLabel>
                  <Select
                    value={field.value || 'none'}
                    onValueChange={(value) => field.onChange(value === 'none' ? '' : value)}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="No knowledge base" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">No knowledge base</SelectItem>
                      {knowledgeBases?.data.map((kb) => (
                        <SelectItem key={kb.id} value={kb.id}>
                          {kb.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="callerPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Caller ID (ExoPhone)</FormLabel>
                  <FormControl>
                    <Input placeholder="09513886363" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="exotelFlowUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Exotel flow URL (optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Uses server default if empty"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="maxConcurrentCalls"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Max concurrent calls</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} max={50} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? <Loader2 className="animate-spin" /> : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
