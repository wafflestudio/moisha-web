import type { GuestsParams } from '@/types/events';

type GuestListFilters = Omit<GuestsParams, 'cursor'>;

export const queryKeys = {
  events: {
    detailRoot: ['events', 'detail'] as const,
    detailBase: (eventId: string) =>
      [...queryKeys.events.detailRoot, eventId] as const,
    detail: (eventId: string, registrationId?: string | null) =>
      [
        ...queryKeys.events.detailBase(eventId),
        registrationId ?? 'viewer',
      ] as const,
    guests: {
      all: (eventId: string) => ['events', 'guests', eventId] as const,
      list: (eventId: string, filters: GuestListFilters) =>
        [...queryKeys.events.guests.all(eventId), filters] as const,
    },
  },
  legacy: {
    myEvents: ['myEvents'] as const,
    myRegistrations: ['myRegistrations'] as const,
  },
};
