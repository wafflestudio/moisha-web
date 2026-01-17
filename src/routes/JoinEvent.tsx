import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import EventDetailContent from '../components/EventDetailContent';
import GuestSummaryList from '../components/GuestSummaryList';
import type { Events } from '../types/schema';

// SVG 아이콘 컴포넌트
const IconChevronLeft = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m15 18-6-6 6-6" />
  </svg>
);

export default function JoinEvent() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [schedule, setSchedule] = useState<Events | null>(null);
  const [displayGuests, setDisplayGuests] = useState<
    { name: string; img: string | undefined }[]
  >([]);

  useEffect(() => {
    // 데이터 하드코딩
    const mockEvent: Events = {
      id: Number(id) || 1,
      title: '제2회 기획 세미나',
      description:
        '일정설명 일정설명 일정설명 일정설명 일정설명 일정설명 일정설명 일정설명 일정설명 일정설명 일정설명 일정설명 일정설명 일정설명 일정설명 일정설명 ...',
      location: '서울대',
      start_at: '2026-02-02T18:00:00Z',
      end_at: '2026-02-02T20:00:00Z',
      capacity: 10,
      waitlist_enabled: true,
      registration_deadline: '2026-02-02T17:00:00Z',
      created_by: 123, // 관리자 ID
      created_at: '2026-01-14T00:00:00Z',
      updated_at: '2026-01-14T00:00:00Z',
    };

    // 관리자 확인 로직
    // if (!isLoggedIn || !isAdmin(mockData.ownerName)) {
    //   alert('접근 권한이 없습니다. 관리자만 접근 가능합니다.');
    //   navigate('/'); // 혹은 로그인 페이지로 이동
    //   return;
    // }

    setSchedule(mockEvent);

    setDisplayGuests([
      { name: '이름1', img: undefined }, // profile_image가 null인 경우
      { name: '이름2', img: 'https://via.placeholder.com/40' },
      { name: '이름3', img: undefined },
      { name: '이름4', img: undefined },
    ]);
  }, [id]);

  const handleClick = () => {
    navigate(`register`);
  };

  if (!schedule) return null;

  return (
    <div className="min-h-screen bg-white flex flex-col relative pb-20">
      {/* 상단 네비게이션 */}
      <div className="w-full flex justify-center">
        <div className="max-w-2xl min-w-[320px] w-[90%] flex items-center px-6 py-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-full"
          >
            <IconChevronLeft />
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold flex-1 ml-4 truncate text-black">
            {schedule.title}
          </h1>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="max-w-2xl min-w-[320px] mx-auto w-[90%] px-6 flex flex-col gap-10">
        {/* 일정 정보 */}
        <EventDetailContent schedule={schedule} />

        {/* 신청하기 버튼*/}
        <Button
          onClick={handleClick}
          className="w-full h-16 rounded-2xl bg-black text-white text-xl font-bold"
        >
          신청하기
        </Button>

        {/* 참여자 명단 섹션 */}
        <GuestSummaryList
          guests={displayGuests}
          totalCount={8}
          eventId={schedule.id}
        />
      </div>
    </div>
  );
}
