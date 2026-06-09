'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { updateAgent } from '@/features/agents/api/agents.api';
import type { UpdateAgentInput } from '@/features/agents/schemas';
import { getErrorMessage } from '@/lib/errors';
import { queryKeys } from '@/lib/query-keys';

export function useUpdateAgent(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateAgentInput) => updateAgent(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.agents.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.agents.detail(id) });
      toast.success('Agent updated');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}
