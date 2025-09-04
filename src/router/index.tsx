import { createBrowserRouter, Navigate } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { AuthGuard } from '../components/auth/AuthGuard';
import { Login } from '../pages/Login';
import { Overview } from '../pages/Overview';
import { Network } from '../pages/Network';
import { System } from '../pages/System';
import { Devices } from '../pages/Devices';
import { Performance } from '../pages/Performance';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/dashboard/overview" replace />
  },
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/dashboard',
    element: (
      <AuthGuard>
        <DashboardLayout />
      </AuthGuard>
    ),
    children: [
      {
        path: '',
        element: <Navigate to="/dashboard/overview" replace />
      },
      {
        path: 'overview',
        element: <Overview />
      },
      {
        path: 'network',
        element: <Network />
      },
      {
        path: 'system',
        element: <System />
      }
    ]
  },
  {
    path: '*',
    element: <Navigate to="/login" replace />
  }
]);

export default router;