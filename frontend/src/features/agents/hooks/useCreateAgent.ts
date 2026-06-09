'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { createAgent } from '@/features/agents/api/agents.api';
import type { CreateAgentInput } from '@/features/agents/schemas';
import { getErrorMessage } from '@/lib/errors';
import { queryKeys } from '@/lib/query-keys';

export function useCreateAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateAgentInput) => createAgent(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.agents.lists() });
      toast.success('Agent created');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}
