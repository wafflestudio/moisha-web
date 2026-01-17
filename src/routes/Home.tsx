import { Button } from '@/components/ui/button';
import { Link } from 'react-router';

export default function Home() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="flex w-full max-w-md flex-col gap-10">
        <h1 className="text-4xl font-bold text-center">
          복잡한 모임 관리, <br></br> 모이샤로 쉽게!
        </h1>
        <div className="flex flex-col items-center justify-center gap-4">
          <Link to="/register">
            <Button className="bg-blue-600 hover:bg-blue-700 text-lg font-semibold px-25 py-5">
              계정 만들기
            </Button>
          </Link>
          <Link to="/login">
            <Button
              variant="outline"
              className="text-lg font-semibold px-25 py-5"
            >
              로그인하기
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
