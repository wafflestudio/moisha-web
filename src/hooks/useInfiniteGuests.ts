import { getGuests } from '@/api/events/registrations';
import { queryKeys } from '@/constants/queryKeys';
import type { GuestsParams, GuestsResponse } from '@/types/events';
import type { InfiniteData } from '@tanstack/react-query';
import { useInfiniteQuery } from '@tanstack/react-query';

interface UseInfiniteGuestsProps {
  eventId: string;
  filters: Omit<GuestsParams, 'cursor'>;
}

export default function useInfiniteGuests({
  eventId,
  filters,
}: UseInfiniteGuestsProps) {
  return useInfiniteQuery<
    GuestsResponse,
    Error,
    InfiniteData<GuestsResponse>,
    ReturnType<typeof queryKeys.events.guests.list>,
    number | undefined
  >({
    // 이벤트 단위로 한 번에 invalidate할 수 있게 key 계층을 맞춥니다.
    queryKey: queryKeys.events.guests.list(eventId, filters),

    queryFn: async ({ pageParam }) => {
      const response = await getGuests(eventId, {
        ...filters,
        cursor: pageParam,
      });
      return response.data;
    },

    // 첫 페이지 호출 시 cursor는 없으므로 undefined, 타입은 number로 명시
    initialPageParam: undefined as number | undefined,

    getNextPageParam: (lastPage) => {
      return lastPage.hasNext ? lastPage.nextCursor : undefined;
    },
  });
}
