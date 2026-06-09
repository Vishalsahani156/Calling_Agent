'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Send, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useTestAgent } from '@/features/agents/hooks/useTestAgent';
import { useKnowledgeBases } from '@/features/knowledge/hooks/useKnowledgeBases';
import type { ConversationMessage } from '@/features/agents/schemas';
import { cn } from '@/lib/utils';

const testFormSchema = z.object({
  message: z.string().min(1, 'Message is required').max(4000),
  knowledgeBaseId: z.string().optional(),
});

type TestFormValues = z.infer<typeof testFormSchema>;

interface TestAgentPanelProps {
  agentId: string;
  canTest: boolean;
}

export function TestAgentPanel({ agentId, canTest }: TestAgentPanelProps) {
  const [history, setHistory] = useState<ConversationMessage[]>([]);
  const [lastRag, setLastRag] = useState<{ faqMatch?: boolean; chunksUsed?: number } | null>(
    null,
  );
  const testMutation = useTestAgent(agentId);
  const { data: knowledgeBases } = useKnowledgeBases({ limit: '100' });

  const form = useForm<TestFormValues>({
    resolver: zodResolver(testFormSchema),
    defaultValues: {
      message: '',
      knowledgeBaseId: '',
    },
  });

  if (!canTest) return null;

  function onSubmit(values: TestFormValues) {
    const knowledgeBaseId = values.knowledgeBaseId?.trim() || undefined;

    testMutation.mutate(
      {
        message: values.message.trim(),
        knowledgeBaseId,
        conversationHistory: history.length > 0 ? history : undefined,
      },
      {
        onSuccess: (result) => {
          const assistantContent =
            result.response ?? result.simulatedResponse ?? result.message ?? '(No response)';

          setHistory((prev) => [
            ...prev,
            { role: 'user', content: values.message.trim() },
            { role: 'assistant', content: assistantContent },
          ]);
          setLastRag(result.rag ?? null);
          form.reset({ message: '', knowledgeBaseId: values.knowledgeBaseId });
        },
      },
    );
  }

  function clearHistory() {
    setHistory([]);
    setLastRag(null);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>Test Agent</CardTitle>
            <CardDescription>
              Send sandbox messages to preview agent responses with optional RAG.
            </CardDescription>
          </div>
          {history.length > 0 ? (
            <Button type="button" variant="outline" size="sm" onClick={clearHistory}>
              <Trash2 className="h-4 w-4" />
              Clear
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {history.length > 0 ? (
          <div className="max-h-64 space-y-2 overflow-y-auto rounded-md border p-3">
            {history.map((entry, index) => (
              <div
                key={index}
                className={cn(
                  'rounded-md px-3 py-2 text-sm',
                  entry.role === 'user'
                    ? 'ml-8 bg-primary/10'
                    : 'mr-8 bg-muted',
                )}
              >
                <p className="mb-1 text-xs font-medium capitalize text-muted-foreground">
                  {entry.role}
                </p>
                <p className="whitespace-pre-wrap">{entry.content}</p>
              </div>
            ))}
          </div>
        ) : null}

        {lastRag ? (
          <div className="flex flex-wrap gap-2">
            {lastRag.faqMatch ? <Badge variant="secondary">FAQ match</Badge> : null}
            {lastRag.chunksUsed !== undefined ? (
              <Badge variant="outline">{lastRag.chunksUsed} KB chunks used</Badge>
            ) : null}
          </div>
        ) : null}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Type a test message..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={testMutation.isPending}>
              {testMutation.isPending ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Send
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
