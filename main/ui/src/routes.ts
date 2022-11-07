import {
  MenuItem,
  RouteEntry,
  authRoutes,
  authMenuItems,
  withAuth,
} from '@aws-ee/core-ui';
import { FaBook } from 'react-icons/fa';
import ScreeningPage from './parts/screening/ScreeningPage';
import ScreeningsPage from './parts/screenings/ScreeningsPage';
import ScreeningCreatePage from './parts/screenings/ScreeningCreatePage';

export const defaultRoute = '/screenings';

export const menuItems = (isAdmin: boolean): MenuItem[] => [
  ...authMenuItems(isAdmin),

  { url: '/screenings', title: 'Screening Requests', icon: FaBook, shouldShow: true },
];

export const routes: RouteEntry[] = [
  ...authRoutes,

  { path: '/screenings/create', page: withAuth(ScreeningCreatePage) },
  { path: '/screenings', page: withAuth(ScreeningsPage) },
  { path: '/screening/:screeningId/:stage', page: withAuth(ScreeningPage) },
  { path: '/screening/:screeningId', page: withAuth(ScreeningPage) },
];
