import type {
  CreateEventRequest,
  EventDetailResponse,
  GuestsParams,
  JoinEventRequest,
  JoinEventResponse,
} from '@/types/events';
import type {
  PatchRegistrationRequest,
  PatchRegistrationResponse,
} from '@/types/registrations';
import { http, HttpResponse, delay } from 'msw';
import { eventDB } from '../db/event.db';
import {
  banRegistration,
  cancelRegistration,
  createRegistration,
  getGuestList,
  getRegistrationDetailById,
} from '../db/registration.db';
import { path } from '../utils';

const toGuestStatus = (status: string | null): GuestsParams['status'] => {
  if (
    status === 'CONFIRMED' ||
    status === 'WAITLISTED' ||
    status === 'CANCELED' ||
    status === 'BANNED'
  ) {
    return status;
  }

  return undefined;
};

const toOrderBy = (orderBy: string | null): GuestsParams['orderBy'] => {
  if (orderBy === 'name' || orderBy === 'registeredAt') {
    return orderBy;
  }

  return undefined;
};

export const eventHandlers = [
  // 1. 내가 생성한/참여한 모임 목록 조회 (GET /events/me)
  // :id 보다 먼저 정의되어야 'me'를 id로 인식하지 않음
  http.get(path('/events/me'), async ({ request }) => {
    const url = new URL(request.url);
    const cursor = url.searchParams.get('cursor');
    const size = 5;

    await delay(300);

    // 현재 mock은 토큰을 해석하지 않으므로 viewer 상태로 홈 목록을 가볍게 흉내 냅니다.
    const myEvents = eventDB
      // 실제 서버에서는 로그인 유저 기준으로 생성한 모임만 내려줘야 합니다.
      .filter((e) => e.viewer.status === 'HOST' || e.viewer.status === 'NONE')
      .map((e) => ({
        publicId: e.event.publicId,
        title: e.event.title,
        startsAt: e.event.startsAt,
        endsAt: e.event.endsAt,
        registrationStartsAt: e.event.registrationStartsAt,
        registrationEndsAt: e.event.registrationEndsAt,
        capacity: e.event.capacity,
        confirmedCount: e.event.confirmedCount,
        waitlistCount: e.event.waitlistCount,
      }));

    // cursor가 있으면 해당 항목 다음부터 페이지를 시작합니다.
    let startIndex = 0;
    if (cursor) {
      const idx = myEvents.findIndex((e) => e.startsAt === cursor);
      if (idx !== -1) startIndex = idx + 1;
    }

    const paginatedEvents = myEvents.slice(startIndex, startIndex + size);
    const hasNext = startIndex + size < myEvents.length;
    const nextCursor = hasNext
      ? paginatedEvents[paginatedEvents.length - 1].startsAt
      : null;

    return HttpResponse.json({
      events: paginatedEvents,
      nextCursor,
      hasNext,
    });
  }),

  // 2. 모임 상세 정보 조회 (GET /events/:id)
  http.get(path('/events/:id'), async ({ params }) => {
    const id = String(params.id);
    await delay(300);

    const event = eventDB.find((e) => e.event.publicId === id);

    if (!event) {
      return new HttpResponse(null, { status: 404 });
    }

    return HttpResponse.json<EventDetailResponse>(event);
  }),

  // 3. 참여자 전체 명단 조회 (GET /events/:id/registrations)
  http.get(path('/events/:id/registrations'), async ({ params, request }) => {
    const eventId = String(params.id);
    const url = new URL(request.url);
    const cursor = url.searchParams.get('cursor');

    await delay(200);

    return HttpResponse.json(
      getGuestList(eventId, {
        status: toGuestStatus(url.searchParams.get('status')),
        orderBy: toOrderBy(url.searchParams.get('orderBy')),
        cursor: cursor ? Number.parseInt(cursor, 10) : undefined,
      })
    );
  }),

  // 4. 참여 신청 (POST /events/:id/registrations)
  http.post(path('/events/:id/registrations'), async ({ params, request }) => {
    const eventId = String(params.id);
    const body = (await request.json()) as JoinEventRequest;

    await delay(200);

    const registration = createRegistration(eventId, body);
    if (!registration) {
      return new HttpResponse(null, { status: 404 });
    }

    return HttpResponse.json<JoinEventResponse>(
      {
        registrationPublicId: registration.registrationId,
      },
      { status: 201 }
    );
  }),

  // 5. 신청 상태 수정 (PATCH /registrations/:id)
  http.patch(path('/registrations/:id'), async ({ params, request }) => {
    const registrationId = String(params.id);
    const body = (await request.json()) as PatchRegistrationRequest;

    await delay(200);

    if (body.status !== 'BANNED') {
      return new HttpResponse(null, { status: 400 });
    }

    const registration = banRegistration(registrationId);
    if (!registration) {
      return new HttpResponse(null, { status: 404 });
    }

    return HttpResponse.json<PatchRegistrationResponse>({
      patchEmail: registration.email ?? '',
    });
  }),

  // 6. 비로그인 유저 개별 정보 조회 (GET /registrations/:regId)
  http.get(path('/registrations/:regId'), async ({ params }) => {
    const regId = String(params.regId);
    await delay(200);

    const registration = getRegistrationDetailById(regId);
    if (!registration) {
      return new HttpResponse(null, { status: 404 });
    }

    return HttpResponse.json(registration);
  }),

  // 7. 신청 취소 (DELETE /registrations/:id)
  http.delete(path('/registrations/:id'), async ({ params }) => {
    const registrationId = String(params.id);
    await delay(200);

    const registration = cancelRegistration(registrationId);
    if (!registration) {
      return new HttpResponse(null, { status: 404 });
    }

    return new HttpResponse(null, { status: 200 });
  }),

  // 8. 모임 생성 (POST /events)
  http.post(path('/events'), async ({ request }) => {
    const body = (await request.json()) as CreateEventRequest;
    await delay(500);

    const newId = `event-${Date.now()}`;
    const newEvent: EventDetailResponse = {
      event: {
        publicId: newId,
        title: body.title,
        description: body.description || '',
        confirmedCount: 0,
        waitlistCount: 0,
        location: body.location || '',
        startsAt: body.startsAt,
        endsAt: body.endsAt,
        registrationStartsAt: body.registrationStartsAt,
        registrationEndsAt: body.registrationEndsAt,
        capacity: body.capacity,
      },
      creator: {
        name: '나 (Host)',
        email: 'me@example.com',
        profileImage: 'https://github.com/shadcn.png',
      },
      viewer: {
        status: 'HOST',
        name: '나 (Host)',
        waitlistPosition: 0,
        registrationPublicId: `reg-${newId}`,
        reservationEmail: 'me@example.com',
      },
      capabilities: {
        shareLink: true,
        apply: false, // 호스트는 신청 불가
        wait: false,
        cancel: false, // 생성 직후 취소 불가능? (기획에 따라 다름)
      },
      guestsPreview: [], // 초기엔 참여자 없음
    };

    eventDB.push(newEvent);

    return HttpResponse.json(newEvent.event, { status: 201 });
  }),
];
