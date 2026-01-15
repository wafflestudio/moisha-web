import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import type { Events } from '../types/schema';
import { formatEventDate } from '../utils/date';

// shadcn UI 컴포넌트
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

// --- 아이콘 ---
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

export default function JoinSuccess() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [schedule, setSchedule] = useState<Events | null>(null);

  useEffect(() => {
    // Event.tsx와 동일한 구성의 Mock 데이터
    const mockEvent: Events = {
      id: Number(id) || 1,
      title: '제2회 기획 세미나',
      description:
        '일정 설명 일정설명 일정설명일정 설명 일정 설명 일정설명일정 설명 일정 설명 일정설명일정 설명 일정 설명 일정설명일정 설명 일정 설명 일정설명일정 설명 일정 설명 일정설명일정 설명 일정 설명 일정설명일정 설명 일정 설명 일정설명일정 설명 일정 설명 일정설명일정 설명 일정 설명 일정설명일정 설명 일정 설명 일정설명일정 설명 일정 설명 일정설명일정 설명 일정 설명 일정설명일정 설명 일정 설명 일정설명',
      location: '서울대',
      start_at: '2026-02-02T18:00:00Z',
      end_at: '2026-02-02T20:00:00Z',
      capacity: 10,
      waitlist_enabled: true,
      registration_deadline: '2026-02-02T17:00:00Z',
      created_by: 123,
      created_at: '2026-01-14T00:00:00Z',
      updated_at: '2026-01-14T00:00:00Z',
    };
    setSchedule(mockEvent);
  }, [id]);

  if (!schedule) return null;

  return (
    <div className="min-h-screen relative pb-20">
      {/* 1. 상단 완료 메시지 */}
      <div className="w-full flex justify-center">
        <div className="max-w-2xl min-w-[320px] w-[90%] flex items-center justify-between px-6 py-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-full"
          >
            <IconChevronLeft />
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold flex-1 ml-4 truncate text-black">
            예약이 완료 되었습니다
          </h1>
        </div>
      </div>

      {/* 2. 메인 콘텐츠*/}
      <div className="max-w-2xl min-w-[320px] mx-auto w-[90%] px-6 flex flex-col items-start gap-10">
        {/* 일정 정보 (왼쪽 정렬) */}
        <div className="text-left space-y-3 w-full">
          <h1 className="text-2xl sm:text-3xl font-bold flex-1 truncate text-black">
            {schedule.title}
          </h1>
          <p className="text-lg sm:text-xl font-bold text-black">
            일시 {formatEventDate(schedule.start_at)}
          </p>
          <p className="text-lg sm:text-xl font-bold text-black">
            장소 {schedule.location || '미정'}
          </p>
        </div>

        {/* 신청 현황 버튼 */}
        <button
          onClick={() => navigate('guests')}
          className="flex items-center text-lg font-bold group hover:opacity-70 transition-opacity"
        >
          {schedule.capacity}명 중{' '}
          <span className="text-black ml-2 font-extrabold">
            {/* 신청 인원 필드 필요 */} 8명 신청
          </span>
          <div className="rotate-180 ml-2 group-hover:translate-x-1 transition-transform text-black">
            <IconChevronLeft />
          </div>
        </button>

        {/* 상세 설명 */}
        <ScrollArea className="h-40 w-full rounded-md border-none">
          <p className="text-base text-gray-500 leading-relaxed whitespace-pre-wrap pr-4">
            {schedule.description}
          </p>
        </ScrollArea>

        {/* 취소 버튼 */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="secondary"
              className="w-full h-16 rounded-2xl bg-[#333333] hover:bg-black text-xl font-bold text-white transition-all shadow-lg active:scale-[0.98]"
            >
              강제취소
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>취소하시겠습니까?</AlertDialogTitle>
              <AlertDialogDescription>
                취소 후 선착 마감된 경우, 신청이 어려울 수 있습니다.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>신청 유지하기</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => navigate('/')}
                className="bg-red-600 hover:bg-red-700"
              >
                취소하기
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
