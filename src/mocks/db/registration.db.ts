import type {
  EventDetailResponse,
  GuestsParams,
  GuestsResponse,
  JoinEventRequest,
  UserPreview,
} from '@/types/events';
import type { GetRegistrationResponse } from '@/types/registrations';
import type { Guest, GuestStatus } from '@/types/schemas';
import { eventDB } from './event.db';

const PAGE_SIZE = 10;
const registrationDB = new Map<string, Guest[]>();

interface MockGuestOptions {
  eventId: string;
  index: number;
  createdAtOffset: number;
  status: GuestStatus;
  waitingNum: number | null;
  preview?: UserPreview;
}

interface RegistrationLookup {
  eventId: string;
  registration: Guest;
}

const findEvent = (eventId: string): EventDetailResponse | undefined =>
  eventDB.find((event) => event.event.publicId === eventId);

const isGuestStatus = (status: string): status is GuestStatus =>
  status === 'CONFIRMED' ||
  status === 'WAITLISTED' ||
  status === 'CANCELED' ||
  status === 'BANNED';

const toGuestStatus = (
  status: EventDetailResponse['viewer']['status']
): GuestStatus | null => (isGuestStatus(status) ? status : null);

const createMockGuest = ({
  eventId,
  index,
  createdAtOffset,
  status,
  waitingNum,
  preview,
}: MockGuestOptions): Guest => ({
  registrationId: `reg-${eventId}-${status.toLowerCase()}-${index}`,
  name:
    preview?.name ||
    `${status === 'WAITLISTED' ? '대기자' : '참여자'} ${index + 1}`,
  email: `user${index + 1}@example.com`,
  profileImage: preview?.profileImage || 'https://github.com/shadcn.png',
  createdAt: new Date(Date.now() + createdAtOffset).toISOString(),
  status,
  waitingNum,
});

const createViewerGuest = (
  eventRecord: EventDetailResponse,
  status: GuestStatus
): Guest | null => {
  const registrationId = eventRecord.viewer.registrationPublicId;
  if (!registrationId) return null;

  return {
    registrationId,
    name: eventRecord.viewer.name,
    email: eventRecord.viewer.reservationEmail || null,
    createdAt: new Date().toISOString(),
    status,
    waitingNum:
      status === 'WAITLISTED' ? eventRecord.viewer.waitlistPosition || 1 : null,
  };
};

const seedRegistrations = (eventRecord: EventDetailResponse): Guest[] => {
  const eventId = eventRecord.event.publicId;
  const registrations: Guest[] = [
    ...Array.from({ length: eventRecord.event.confirmedCount }).map(
      (_, index) =>
        createMockGuest({
          eventId,
          index,
          createdAtOffset: index,
          status: 'CONFIRMED',
          waitingNum: null,
          preview: eventRecord.guestsPreview[index],
        })
    ),
    ...Array.from({ length: eventRecord.event.waitlistCount }).map((_, index) =>
      createMockGuest({
        eventId,
        index,
        createdAtOffset: eventRecord.event.confirmedCount + index,
        status: 'WAITLISTED',
        waitingNum: index + 1,
      })
    ),
  ];

  const viewerStatus = toGuestStatus(eventRecord.viewer.status);
  const viewerGuest = viewerStatus
    ? createViewerGuest(eventRecord, viewerStatus)
    : null;

  if (viewerGuest) {
    // 상세 화면의 viewer와 참여자 목록 mock이 같은 신청자를 바라보게 맞춥니다.
    const statusReplaceIndex = registrations.findIndex(
      (registration) => registration.status === viewerStatus
    );
    const waitlistReplaceIndex =
      viewerStatus === 'WAITLISTED'
        ? registrations.findIndex(
            (registration) =>
              registration.status === 'WAITLISTED' &&
              registration.waitingNum === viewerGuest.waitingNum
          )
        : -1;
    const replaceIndex =
      waitlistReplaceIndex >= 0 ? waitlistReplaceIndex : statusReplaceIndex;

    if (replaceIndex >= 0) {
      registrations[replaceIndex] = viewerGuest;
    } else {
      registrations.push(viewerGuest);
    }
  }

  registrationDB.set(eventId, registrations);
  return registrations;
};

const getEventRegistrations = (eventId: string): Guest[] => {
  const registrations = registrationDB.get(eventId);
  if (registrations) return registrations;

  const eventRecord = findEvent(eventId);
  if (!eventRecord) return [];

  return seedRegistrations(eventRecord);
};

const sortWaitlist = (registrations: Guest[]) =>
  registrations
    .filter((registration) => registration.status === 'WAITLISTED')
    .sort((a, b) => {
      const aWaitingNum = a.waitingNum ?? Number.MAX_SAFE_INTEGER;
      const bWaitingNum = b.waitingNum ?? Number.MAX_SAFE_INTEGER;
      return aWaitingNum - bWaitingNum;
    });

const reindexWaitlist = (eventId: string) => {
  sortWaitlist(getEventRegistrations(eventId)).forEach(
    (registration, index) => {
      registration.waitingNum = index + 1;
    }
  );
};

const promoteFirstWaitlisted = (eventId: string) => {
  const [nextRegistration] = sortWaitlist(getEventRegistrations(eventId));
  if (!nextRegistration) return;

  // 실제 백엔드 정책처럼 확정 취소 시 가장 빠른 대기자를 자동 승격합니다.
  nextRegistration.status = 'CONFIRMED';
  nextRegistration.waitingNum = null;
  reindexWaitlist(eventId);
};

const updateViewerCapabilities = (
  eventRecord: EventDetailResponse,
  status: GuestStatus
) => {
  eventRecord.capabilities = {
    ...eventRecord.capabilities,
    apply: status === 'CANCELED',
    wait: false,
    cancel: status === 'CONFIRMED' || status === 'WAITLISTED',
  };
};

const syncViewerFromRegistration = (
  eventRecord: EventDetailResponse,
  registrations: Guest[]
) => {
  const registrationId = eventRecord.viewer.registrationPublicId;
  if (!registrationId) return;

  const registration = registrations.find(
    (item) => item.registrationId === registrationId
  );
  if (!registration) return;

  eventRecord.viewer = {
    ...eventRecord.viewer,
    status: registration.status,
    name: registration.name,
    waitlistPosition: registration.waitingNum ?? 0,
    registrationPublicId: registration.registrationId,
    reservationEmail: registration.email ?? eventRecord.viewer.reservationEmail,
  };
  updateViewerCapabilities(eventRecord, registration.status);
};

const syncEventDerivedState = (eventId: string) => {
  const eventRecord = findEvent(eventId);
  if (!eventRecord) return;

  const registrations = getEventRegistrations(eventId);
  const confirmedRegistrations = registrations.filter(
    (registration) => registration.status === 'CONFIRMED'
  );
  const waitlistedRegistrations = registrations.filter(
    (registration) => registration.status === 'WAITLISTED'
  );

  // 참여자 변경 후 상세 preview/count도 같은 mock 상태에서 다시 계산합니다.
  eventRecord.event.confirmedCount = confirmedRegistrations.length;
  eventRecord.event.waitlistCount = waitlistedRegistrations.length;
  eventRecord.guestsPreview = confirmedRegistrations
    .slice(0, 5)
    .map((registration, index) => ({
      id: index + 1,
      name: registration.name,
      profileImage: registration.profileImage,
    }));

  syncViewerFromRegistration(eventRecord, registrations);
};

const findRegistration = (
  registrationId: string
): RegistrationLookup | null => {
  for (const eventRecord of eventDB) {
    const eventId = eventRecord.event.publicId;
    const registration = getEventRegistrations(eventId).find(
      (item) => item.registrationId === registrationId
    );

    if (registration) {
      return { eventId, registration };
    }
  }

  return null;
};

export const getGuestList = (
  eventId: string,
  params: GuestsParams
): GuestsResponse => {
  const startIndex = params.cursor ?? 0;
  const participants = getEventRegistrations(eventId)
    .filter((registration) =>
      params.status ? registration.status === params.status : true
    )
    .sort((a, b) => {
      if (params.orderBy === 'name') {
        return a.name.localeCompare(b.name, 'ko');
      }

      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

  const paginatedParticipants = participants.slice(
    startIndex,
    startIndex + PAGE_SIZE
  );
  const hasNext = startIndex + PAGE_SIZE < participants.length;

  return {
    participants: paginatedParticipants,
    nextCursor: hasNext ? startIndex + PAGE_SIZE : 0,
    hasNext,
    totalCount: participants.length,
  };
};

export const createRegistration = (
  eventId: string,
  data: JoinEventRequest
): Guest | null => {
  const eventRecord = findEvent(eventId);
  if (!eventRecord) return null;

  const registrations = getEventRegistrations(eventId);
  const confirmedCount = registrations.filter(
    (registration) => registration.status === 'CONFIRMED'
  ).length;
  const waitlistCount = registrations.filter(
    (registration) => registration.status === 'WAITLISTED'
  ).length;
  const status: GuestStatus =
    confirmedCount < eventRecord.event.capacity ? 'CONFIRMED' : 'WAITLISTED';

  const registration: Guest = {
    registrationId: `reg-${eventId}-${Date.now()}`,
    name: data.guestName?.trim() || '예약자',
    email: data.guestEmail?.trim() || null,
    createdAt: new Date().toISOString(),
    status,
    waitingNum: status === 'WAITLISTED' ? waitlistCount + 1 : null,
  };

  registrations.push(registration);
  eventRecord.viewer = {
    ...eventRecord.viewer,
    status,
    name: registration.name,
    waitlistPosition: registration.waitingNum ?? 0,
    registrationPublicId: registration.registrationId,
    reservationEmail: registration.email ?? '',
  };
  updateViewerCapabilities(eventRecord, status);
  syncEventDerivedState(eventId);

  return registration;
};

export const cancelRegistration = (registrationId: string): Guest | null => {
  const result = findRegistration(registrationId);
  if (!result) return null;

  const previousStatus = result.registration.status;
  result.registration.status = 'CANCELED';
  result.registration.waitingNum = null;

  if (previousStatus === 'CONFIRMED') {
    promoteFirstWaitlisted(result.eventId);
  }
  if (previousStatus === 'WAITLISTED') {
    reindexWaitlist(result.eventId);
  }

  syncEventDerivedState(result.eventId);
  return result.registration;
};

export const banRegistration = (registrationId: string): Guest | null => {
  const result = findRegistration(registrationId);
  if (!result) return null;

  const previousStatus = result.registration.status;
  result.registration.status = 'BANNED';
  result.registration.waitingNum = null;

  if (previousStatus === 'CONFIRMED') {
    promoteFirstWaitlisted(result.eventId);
  }
  if (previousStatus === 'WAITLISTED') {
    reindexWaitlist(result.eventId);
  }

  syncEventDerivedState(result.eventId);
  return result.registration;
};

export const getRegistrationDetailById = (
  registrationId: string
): GetRegistrationResponse | null => {
  const result = findRegistration(registrationId);
  if (!result) return null;

  return {
    status: result.registration.status,
    guestName: result.registration.name,
    waitlistPosition: result.registration.waitingNum ?? 0,
    registrationPublicId: result.registration.registrationId,
    reservationEmail: result.registration.email ?? '',
  };
};
