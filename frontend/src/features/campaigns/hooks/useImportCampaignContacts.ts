'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { importCampaignContacts } from '@/features/campaigns/api/campaigns.api';
import type { ImportCampaignContactsInput } from '@/features/campaigns/schemas';
import { getErrorMessage } from '@/lib/errors';
import { queryKeys } from '@/lib/query-keys';

export function useImportCampaignContacts(campaignId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ImportCampaignContactsInput) =>
      importCampaignContacts(campaignId, input),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.all });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.campaigns.detail(campaignId),
      });
      toast.success(result.message);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}
