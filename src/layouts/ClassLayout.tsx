import { useCallback, useEffect, useRef } from 'react';
import { NavLink, Outlet, useLocation, useParams } from 'react-router';
import Header from '../components/Header';
import { useUIStore } from '../hooks/useUIStore';

export default function ClassLayout() {
  const location = useLocation();
  const infoRef = useRef<HTMLDivElement>(null);
  const { classId } = useParams();

  // 동아리 데이터 하드코딩
  const classData = {
    name: '와플스튜디오',
    memberCount: 100,
    imageUrl: 'class-image-url.jpg',
  };

  const {
    classScrollY,
    setClassScrollY,
    isHeaderCollapsed,
    setIsHeaderCollapsed,
  } = useUIStore();

  const isMembersPage = location.pathname.includes('/members');

  const COLLAPSE_THRESHOLD = 50;

  const updateHeaderState = useCallback(
    (y: number) => {
      if (isMembersPage) {
        setIsHeaderCollapsed(true);
      } else {
        setIsHeaderCollapsed(y > COLLAPSE_THRESHOLD);
      }
    },
    [isMembersPage, setIsHeaderCollapsed]
  );

  // 스크롤 감지 및 상태 저장
  useEffect(() => {
    const handleScroll = () => {
      // 멤버 페이지는 제외(항상 스크롤된 상태)
      if (isMembersPage) return;

      const currentY = window.scrollY;
      setClassScrollY(currentY);
      updateHeaderState(currentY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMembersPage, setClassScrollY, updateHeaderState]);

  // 페이지 이동 시 스크롤 복구
  useEffect(() => {
    if (isMembersPage) {
      // 멤버 페이지는 스크롤된 상태 + 맨 위로 이동
      setIsHeaderCollapsed(true);
      window.scrollTo(0, 0);
    } else {
      // 저장된 헤더 상태 복구
      updateHeaderState(classScrollY);

      // 저장된 위치로 스크롤 복구
      requestAnimationFrame(() => {
        window.scrollTo({ top: classScrollY, behavior: 'instant' });
      });
    }
  }, [isMembersPage, classScrollY, updateHeaderState, setIsHeaderCollapsed]);

  const tabClass = ({ isActive }: { isActive: boolean }) => `
    flex-1 py-3 text-center font-bold border-b-2 transition-colors
    ${isActive ? 'border-blue-500 text-blue-500' : 'border-transparent text-gray-500 hover:text-gray-700'}
  `;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header displayTitle={isHeaderCollapsed ? classData.name : undefined} />

      <div
        ref={infoRef}
        className={`relative z-10 bg-white overflow-hidden ${
          isMembersPage
            ? 'h-0 opacity-0' // 멤버 페이지일 때는 transition 없이 즉시 숨김
            : `transition-all duration-500 ease-in-out ${
                // 돌아올 때는 transition 적용
                isHeaderCollapsed
                  ? 'h-0 opacity-0'
                  : 'max-h-[200px] p-6 opacity-100'
              }`
        }`}
      >
        <div className="mx-auto flex max-w-screen-xl items-center gap-4">
          <img
            src={classData.imageUrl}
            alt="class"
            className="w-20 h-20 rounded-2xl object-cover shadow-sm"
          />
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold">{classData.name}</h1>
            <NavLink to={`/class/${classId}/members`}>
              <button className="w-fit rounded-full bg-gray-100 px-4 py-1 text-sm font-medium hover:bg-gray-200">
                {classData.memberCount}명
              </button>
            </NavLink>
          </div>
        </div>
      </div>

      <nav className="sticky top-[60px] z-50 w-full border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-screen-xl">
          <NavLink to={`/class/${classId}/notice`} className={tabClass}>
            공지
          </NavLink>
          <NavLink to={`/class/${classId}/meeting`} className={tabClass}>
            모임
          </NavLink>
          <NavLink to={`/class/${classId}/vote`} className={tabClass}>
            투표
          </NavLink>
        </div>
      </nav>

      <main className="relative z-0 mx-auto w-full max-w-screen-xl p-6">
        <Outlet />
      </main>
    </div>
  );
}