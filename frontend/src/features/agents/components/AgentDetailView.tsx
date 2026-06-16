'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Pencil } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AgentFormDialog } from '@/features/agents/components/AgentFormDialog';
import { TestAgentPanel } from '@/features/agents/components/TestAgentPanel';
import { TestVoiceCallPanel } from '@/features/calls/components/TestVoiceCallPanel';
import { useAgent } from '@/features/agents/hooks/useAgent';
import { stringifyJson } from '@/features/agents/utils/json';

interface AgentDetailViewProps {
  agentId: string;
  canWrite: boolean;
  canTest: boolean;
  canCall: boolean;
}

export function AgentDetailView({ agentId, canWrite, canTest, canCall }: AgentDetailViewProps) {
  const [editOpen, setEditOpen] = useState(false);
  const { data: agent, isLoading, isError } = useAgent(agentId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (isError || !agent) {
    return <p className="text-destructive">Agent not found or failed to load.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <Button variant="ghost" size="sm" asChild className="-ml-2 w-fit">
            <Link href="/agents">
              <ArrowLeft className="h-4 w-4" />
              Back to agents
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight">{agent.name}</h1>
          <div className="flex flex-wrap gap-2">
            <Badge variant={agent.interruptionEnabled ? 'default' : 'secondary'}>
              Interruption {agent.interruptionEnabled ? 'on' : 'off'}
            </Badge>
            <Badge variant="outline">Max silence {agent.maxSilenceSeconds}s</Badge>
          </div>
        </div>
        {canWrite ? (
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil className="h-4 w-4" />
            Edit agent
          </Button>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <p className="mb-1 font-medium">Personality prompt</p>
              <p className="whitespace-pre-wrap rounded-md bg-muted p-3 text-muted-foreground">
                {agent.personalityPrompt}
              </p>
            </div>
            <div>
              <p className="mb-1 font-medium">Greeting script</p>
              <div className="space-y-2">
                {Object.entries(agent.greetingScript ?? {}).map(([lang, text]) => (
                  <div key={lang} className="rounded-md bg-muted p-3">
                    <p className="text-xs font-medium uppercase text-muted-foreground">{lang}</p>
                    <p className="whitespace-pre-wrap">{text}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-1 font-medium">Voice profile</p>
              <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs">
                {stringifyJson(agent.voiceProfile)}
              </pre>
            </div>
            <div>
              <p className="mb-1 font-medium">LLM config</p>
              <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs">
                {stringifyJson(agent.llmConfig)}
              </pre>
            </div>
            <div>
              <p className="mb-1 font-medium">Tools enabled</p>
              <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs">
                {stringifyJson(agent.toolsEnabled)}
              </pre>
            </div>
          </CardContent>
        </Card>

        <TestAgentPanel agentId={agentId} canTest={canTest} />
      </div>

      <TestVoiceCallPanel agentId={agentId} agentName={agent.name} canCall={canCall} />

      <AgentFormDialog
        agent={agent}
        open={editOpen}
        onOpenChange={setEditOpen}
        canWrite={canWrite}
      />
    </div>
  );
}
