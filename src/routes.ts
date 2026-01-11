import { createBrowserRouter, redirect } from 'react-router';
import RootLayout from './layouts/RootLayout';
import Home from './routes/Home';
import Login from './routes/Login';
import RegisterChoice from './routes/RegisterChoice';
import RegisterForm from './routes/RegisterForm';
import SocialCallback from './routes/SocialCallback';

import ClassLayout from './layouts/ClassLayout';
import ClassMeeting from './routes/class/ClassMeeting';
import ClassMembers from './routes/class/ClassMembers';
import ClassNotice from './routes/class/ClassNotice';
import ClassVote from './routes/class/ClassVote';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: RootLayout,
    children: [
      { index: true, Component: Home },
      { path: 'login', Component: Login },
      { path: 'register', Component: RegisterChoice },
      { path: 'register/email', Component: RegisterForm },
      { path: 'auth/callback/:provider', Component: SocialCallback },
    ],
  },
  {
    // 2. 동아리 상세 페이지용 레이아웃 (:classId 파라미터 추가)
    path: '/class/:classId',
    Component: ClassLayout,
    children: [
      // /class/:classId 접속 시 자동으로 '공지' 페이지로 리다이렉트
      {
        index: true,
        loader: ({ params }) => redirect(`/class/${params.classId}/notice`),
      },
      { path: 'notice', Component: ClassNotice },
      { path: 'meeting', Component: ClassMeeting },
      { path: 'vote', Component: ClassVote },
      { path: 'members', Component: ClassMembers },
    ],
  },
]);
