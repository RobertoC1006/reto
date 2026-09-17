import { lazy, Suspense } from 'react';
import { createBrowserRouter, Link, Navigate, RouterProvider } from 'react-router';
import { RequireAuth } from './auth';
import AdminLayout from '../layouts/AdminLayout';
import { Skeleton } from '../shared/components/ui';
const Landing = lazy(() => import('../features/landing/Landing'));
const Login = lazy(() => import('../features/auth/Login'));
const Dashboard = lazy(() => import('../features/dashboard/Dashboard'));
const Leads = lazy(() => import('../features/leads/Leads'));
const LeadDetail = lazy(() => import('../features/leads/LeadDetail'));
const Appointments = lazy(() => import('../features/appointments/Appointments'));
const AppointmentForm = lazy(() => import('../features/appointments/AppointmentForm'));
const AppointmentDetail = lazy(() => import('../features/appointments/AppointmentDetail'));
const Messages = lazy(() => import('../features/messages/Messages'));
const Reports = lazy(() => import('../features/reports/Reports'));
const Settings = lazy(() => import('../features/settings/Settings'));
const router = createBrowserRouter([
  { path: '/', element: <Landing /> },
  { path: '/login', element: <Login /> },
  {
    element: <RequireAuth />,
    children: [
      {
        path: '/app',
        element: <AdminLayout />,
        children: [
          { index: true, element: <Navigate to="dashboard" replace /> },
          { path: 'dashboard', element: <Dashboard /> },
          { path: 'leads', element: <Leads /> },
          { path: 'leads/:leadId', element: <LeadDetail /> },
          { path: 'citas', element: <Appointments /> },
          { path: 'citas/nueva', element: <AppointmentForm /> },
          { path: 'citas/:appointmentId', element: <AppointmentDetail /> },
          { path: 'citas/:appointmentId/editar', element: <AppointmentForm /> },
          { path: 'mensajes', element: <Messages /> },
          { path: 'reportes', element: <Reports /> },
          { path: 'configuracion', element: <Settings /> },
        ],
      },
    ],
  },
  {
    path: '*',
    element: (
      <main className="not-found">
        <h1>Esta página no está en la agenda.</h1>
        <p>Vuelve al inicio para continuar.</p>
        <Link className="btn btn-teal" to="/">
          Volver a Praxia
        </Link>
      </main>
    ),
  },
]);
export default function App() {
  return (
    <Suspense
      fallback={
        <div className="app-loading">
          <Skeleton rows={6} />
        </div>
      }
    >
      <RouterProvider router={router} />
    </Suspense>
  );
}
