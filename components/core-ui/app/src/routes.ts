import { FaUsers } from 'react-icons/fa';
import { GoDashboard } from 'react-icons/go';

import withAuth from './withAuth';
import { RouteEntry } from './models/Route';

import AddSingleCognitoUser from './parts/users/AddSingleCognitoUser';
import AddUser from './parts/users/AddUser';
import User from './parts/users/User';
import Dashboard from './parts/dashboard/Dashboard';
import { MenuItem } from './models/Menu';
import UserDetails from './parts/users/UserDetails';
import UserEdit from './parts/users/UserEdit';
import UserProfileDetails from './parts/users/UserProfileDetails';
import UserProfileEdit from './parts/users/UserProfileEdit';

// Auth
export const authRoutes: RouteEntry[] = [
  { path: '/users/details/:id', page: withAuth(UserDetails) },
  { path: '/users/edit/:id', page: withAuth(UserEdit) },
  { path: '/users/add/cognito', page: withAuth(AddSingleCognitoUser) },
  { path: '/users/add', page: withAuth(AddUser) },
  { path: '/users', page: withAuth(User) },
  { path: '/user/edit', page: withAuth(UserProfileEdit) },
  { path: '/user/view', page: withAuth(UserProfileDetails) },
];
export const authMenuItems = (isAdmin: boolean): MenuItem[] => [
  { url: '/users', title: 'Users', icon: FaUsers, shouldShow: isAdmin },
];

// Dashboard
export const dashboardRoutes: RouteEntry[] = [{ path: '/dashboard', page: withAuth(Dashboard) }];
export const dashboardMenuItems = (): MenuItem[] => [
  { url: '/dashboard', title: 'Dashboard', icon: GoDashboard, shouldShow: true },
];
