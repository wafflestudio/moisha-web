import { queryKeys } from '@/constants/queryKeys';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

export default function useInvalidateEventRegistration() {
  const queryClient = useQueryClient();

  return useCallback(
    async (eventId: string) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.events.detailBase(eventId),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.events.guests.all(eventId),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.legacy.myRegistrations,
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.legacy.myEvents,
        }),
      ]);
    },
    [queryClient]
  );
}
