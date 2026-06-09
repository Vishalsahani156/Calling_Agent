'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { updateSettings } from '@/features/settings/api/settings.api';
import type { UpdateSettingsInput } from '@/features/settings/schemas';
import { getErrorMessage } from '@/lib/errors';
import { queryKeys } from '@/lib/query-keys';

export function useUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateSettingsInput) => updateSettings(input),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.settings.current(), data);
      toast.success('Settings saved successfully');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}
