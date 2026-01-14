import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from '@/components/ui/item';
import type { Events } from '@/types/schema';
import { getShortenedDate } from '@/utils/date';
import { ChevronRightIcon, Plus } from 'lucide-react';
import { NavLink } from 'react-router';

type Event = Events & { guests: number; registration_start: string | null };

function getDateLabel(
  startDateString: string | null,
  endDateString: string | null
) {
  if (!endDateString) {
    return '상시 모집 중';
  }

  const now = new Date();
  const endDate = new Date(endDateString!);

  if (startDateString && now < new Date(startDateString)) {
    return `${getShortenedDate(startDateString)}부터 모집`;
  }

  if (now <= endDate) {
    return `${getShortenedDate(endDateString)}까지 모집`;
  }

  return '모집 마감';
}

export default function EventCardView({ events }: { events: Event[] }) {
  return (
    <ItemGroup className="gap-4">
      <Item variant="default" asChild role="listitem">
        <NavLink to="/new-event">
          <ItemMedia variant="icon">
            <Plus />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>
              <h2 className="text-lg font-semibold line-clamp-1">
                새로운 일정 만들기
              </h2>
            </ItemTitle>
          </ItemContent>
        </NavLink>
      </Item>
      {events.map((event) => (
        <Item key={event.id} variant="outline" asChild role="listitem">
          <NavLink to={`/event/${event.id}`}>
            <ItemContent>
              <ItemTitle>
                <h2 className="text-lg font-semibold line-clamp-1">
                  {event.title}
                </h2>
              </ItemTitle>
              <ItemDescription>
                {getDateLabel(
                  event.registration_start,
                  event.registration_deadline
                )}
              </ItemDescription>
            </ItemContent>
            <ItemActions>
              <ChevronRightIcon className="size-4" />
            </ItemActions>
          </NavLink>
        </Item>
      ))}
    </ItemGroup>
  );
}
