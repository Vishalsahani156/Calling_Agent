'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  pauseCampaign,
  startCampaign,
  stopCampaign,
} from '@/features/campaigns/api/campaigns.api';
import { getErrorMessage } from '@/lib/errors';
import { queryKeys } from '@/lib/query-keys';

type CampaignAction = 'start' | 'pause' | 'stop';

const actionFns = {
  start: startCampaign,
  pause: pauseCampaign,
  stop: stopCampaign,
} as const;

const actionLabels = {
  start: 'Campaign started',
  pause: 'Campaign paused',
  stop: 'Campaign stopped',
} as const;

export function useCampaignAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: CampaignAction }) =>
      actionFns[action](id),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.all });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.campaigns.detail(variables.id),
      });
      toast.success(actionLabels[variables.action]);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}
