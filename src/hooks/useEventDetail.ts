import { deleteEvent, getEventDetail } from '@/api/events/event';
import { joinEvent } from '@/api/events/registrations';
import {
  deleteRegistration,
  getRegistrationDetail,
  patchRegistration,
} from '@/api/registrations/registration';
import { queryKeys } from '@/constants/queryKeys';
import useAuthStore from '@/hooks/useAuthStore';
import useInvalidateEventRegistration from '@/hooks/useInvalidateEventRegistration';
import type { EventDetailResponse, JoinEventRequest } from '@/types/events';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { useEffect } from 'react';
import { useSearchParams } from 'react-router';

interface JoinEventVariables {
  eventId: string;
  data: JoinEventRequest;
}

const getMergedEventDetail = async (
  eventId: string,
  effectiveRegId?: string | null
): Promise<EventDetailResponse> => {
  const eventRes = await getEventDetail(eventId);
  let mergedData = eventRes.data;

  if (mergedData.viewer.status !== 'NONE' || !effectiveRegId) {
    return mergedData;
  }

  try {
    const regRes = await getRegistrationDetail(effectiveRegId);
    const canCancel =
      regRes.status === 'CONFIRMED' || regRes.status === 'WAITLISTED';

    // 비로그인 신청자는 이벤트 상세 응답만으로 본인 상태를 알 수 없어서
    // 저장해 둔 regId로 신청 상세를 병합해 같은 화면 상태를 구성합니다.
    mergedData = {
      ...mergedData,
      viewer: {
        ...mergedData.viewer,
        status: regRes.status,
        name: regRes.guestName,
        waitlistPosition: regRes.waitlistPosition,
        registrationPublicId: regRes.registrationPublicId,
        reservationEmail: regRes.reservationEmail,
      },
      capabilities: {
        ...mergedData.capabilities,
        apply: regRes.status === 'CANCELED',
        wait: false,
        cancel: canCancel,
      },
    };
  } catch (regError) {
    // regId가 만료되었거나 잘못된 경우에는 공개 상세만 보여줘야 합니다.
    console.error('Failed to fetch guest registration info:', regError);
  }

  return mergedData;
};

export default function useEventDetail(id?: string) {
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const invalidateEventRegistration = useInvalidateEventRegistration();

  const urlRegId = searchParams.get('regId');
  const guestRegId = useAuthStore((state) =>
    id ? state.guestRegistrations[id] : null
  );
  const effectiveRegId = urlRegId || guestRegId;

  const setGuestRegistration = useAuthStore(
    (state) => state.setGuestRegistration
  );

  // 1. 이벤트 상세는 regId에 따라 viewer 상태가 달라질 수 있어 key에 함께 포함합니다.
  const eventDetailQuery = useQuery<EventDetailResponse, Error>({
    queryKey: id
      ? queryKeys.events.detail(id, effectiveRegId)
      : queryKeys.events.detail('__missing_event__'),
    queryFn: () => {
      if (!id) {
        throw new Error('EVENT_ID_REQUIRED');
      }
      return getMergedEventDetail(id, effectiveRegId);
    },
    enabled: Boolean(id),
    retry: (failureCount, error) => {
      if (isAxiosError(error) && error.response?.status === 404) return false;
      if (isAxiosError(error) && error.response?.status === 401) return false;
      if (
        error.message === 'TOKEN_EXPIRED_LOCAL' ||
        error.message === 'INVALID_TOKEN_FORMAT'
      ) {
        return false;
      }
      return failureCount < 3;
    },
  });

  useEffect(() => {
    const title = eventDetailQuery.data?.event.title;
    document.title = title ? `${title} - 모이밍` : '모임 상세 - 모이밍';
  }, [eventDetailQuery.data?.event.title]);

  // 2. 신청 성공 후 저장된 regId가 다음 상세 조회의 viewer 병합 기준이 됩니다.
  const joinMutation = useMutation({
    mutationFn: ({ eventId, data }: JoinEventVariables) =>
      joinEvent(eventId, data),
    onSuccess: async (response, { eventId }) => {
      const regId = response.data.registrationPublicId;

      if (regId) {
        setGuestRegistration(eventId, regId);
      }

      await invalidateEventRegistration(eventId);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (registrationId: string) => deleteRegistration(registrationId),
    onSuccess: async () => {
      if (id) {
        // 비로그인 사용자의 regId는 유지하고, 서버의 CANCELED 상태를 다시 조회합니다.
        await invalidateEventRegistration(id);
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (eventId: string) => deleteEvent(eventId),
    onSuccess: async (_response, eventId) => {
      // 삭제 후 홈 목록과 상세/참여자 캐시가 서로 다른 상태를 보지 않게 함께 무효화합니다.
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.events.detailBase(eventId),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.events.guests.all(eventId),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.legacy.myEvents,
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.legacy.myRegistrations,
        }),
      ]);
    },
  });

  const banMutation = useMutation({
    mutationFn: (registrationId: string) =>
      patchRegistration(registrationId, {
        status: 'BANNED',
      }),
    onSuccess: async () => {
      if (id) {
        await invalidateEventRegistration(id);
      }
    },
  });

  const handleJoinEvent = async (
    eventId: string,
    data: JoinEventRequest
  ): Promise<boolean> => {
    try {
      await joinMutation.mutateAsync({ eventId, data });
      return true;
    } catch (error: unknown) {
      console.error('Join event error:', error);
      return false;
    }
  };

  const handleCancelEvent = async (
    registrationId: string
  ): Promise<boolean> => {
    try {
      await cancelMutation.mutateAsync(registrationId);
      return true;
    } catch (error: unknown) {
      console.error('Cancel event error:', error);
      return false;
    }
  };

  const handleDeleteEvent = async (eventId: string): Promise<boolean> => {
    try {
      await deleteMutation.mutateAsync(eventId);
      return true;
    } catch (error: unknown) {
      console.error('Delete event error:', error);
      return false;
    }
  };

  const handleBanEvent = async (registrationId: string): Promise<boolean> => {
    try {
      await banMutation.mutateAsync(registrationId);
      return true;
    } catch (error: unknown) {
      console.error('Ban event error:', error);
      return false;
    }
  };

  const isDeleted =
    isAxiosError(eventDetailQuery.error) &&
    eventDetailQuery.error.response?.status === 404;
  const hasFetchError = eventDetailQuery.isError && !isDeleted;

  return {
    loading:
      eventDetailQuery.isLoading ||
      joinMutation.isPending ||
      cancelMutation.isPending ||
      deleteMutation.isPending ||
      banMutation.isPending,
    data: eventDetailQuery.data ?? null,
    isDeleted,
    hasFetchError,
    isBanning: banMutation.isPending,
    handleJoinEvent,
    handleCancelEvent,
    handleDeleteEvent,
    handleBanEvent,
  };
}
