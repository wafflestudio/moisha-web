import { Link, NavLink } from 'react-router';
import useAuth from '../hooks/useAuth';

interface HeaderProps {
  displayTitle?: string;
}

export default function Header({ displayTitle }: HeaderProps) {
  const { isLoggedIn, handleLogout } = useAuth();

  const linkClassName = (isActive: boolean) => `
    font-bold h-[42px] items-center px-4 py-2 rounded-md
    ${isActive ? 'bg-gray-200' : 'hover:bg-gray-200 transition-all text-gray-500'}
  `;

  return (
    <header className="sticky top-0 z-100 flex w-full justify-center bg-white">
      <div className="flex w-full items-center justify-between px-6 py-4 sm:w-screen-sm md:w-screen-md lg:w-screen-lg xl:max-w-screen-xl">
        <div className="text-xl font-bold font-title">
          <Link to="/">모이샤</Link>
          {displayTitle ? ` - ${displayTitle}` : null}
        </div>

        <div className="items-center space-x-2">
          {isLoggedIn === false ? (
            <>
              <NavLink
                to="/login"
                className={({ isActive }) => linkClassName(isActive)}
              >
                로그인
              </NavLink>
              <NavLink
                to="/register"
                className={({ isActive }) => linkClassName(isActive)}
              >
                회원가입
              </NavLink>
            </>
          ) : (
            <>
              <button
                onClick={handleLogout}
                className="font-bold h-[42px] items-center px-4 py-2 rounded-md hover:bg-gray-200 transition-all text-gray-500"
              >
                로그아웃
              </button>
              {/* TODO: Add an avatar UI */}
            </>
          )}
        </div>
      </div>
    </header>
  );
}
