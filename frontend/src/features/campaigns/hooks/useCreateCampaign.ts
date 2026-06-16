'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { createCampaign } from '@/features/campaigns/api/campaigns.api';
import type { CreateCampaignInput } from '@/features/campaigns/schemas';
import { getErrorMessage } from '@/lib/errors';
import { queryKeys } from '@/lib/query-keys';

export function useCreateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateCampaignInput) => createCampaign(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.all });
      toast.success('Campaign created');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}
