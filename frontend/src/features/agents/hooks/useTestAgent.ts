'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { testAgent } from '@/features/agents/api/agents.api';
import type { TestAgentInput } from '@/features/agents/schemas';
import { getErrorMessage } from '@/lib/errors';

export function useTestAgent(agentId: string) {
  return useMutation({
    mutationFn: (input: TestAgentInput) => testAgent(agentId, input),
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}
