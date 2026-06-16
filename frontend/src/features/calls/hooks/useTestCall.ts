'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { placeTestCall } from '@/features/calls/api/calls.api';
import type { TestCallInput } from '@/features/calls/schemas';
import { getErrorMessage } from '@/lib/errors';
import { queryKeys } from '@/lib/query-keys';

export function useTestCall() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: TestCallInput) => placeTestCall(input),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.calls.all });
      toast.success(result.message);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}
