import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import GuestRoute from './routes/GuestRoute';
import HomePage from './pages/public/HomePage.jsx';
import LoginPage from './pages/public/LoginPage.jsx';
import SignUpPage from './pages/public/SignUpPage.jsx';
import CoursesPage from './pages/public/CoursesPage.jsx';
import CourseDetailPage from './pages/public/CourseDetailPage.jsx';
import StudentDashboard from './pages/student/StudentDashboard.jsx';
import StudentCourse from './pages/student/StudentCourse.jsx';
import StudentProfile from './pages/student/StudentProfile.jsx';
import EnrollmentConfirmationPage from './pages/student/EnrollmentConfirmationPage.jsx';
import StudentLayout from './components/layout/StudentLayout.jsx';
import AdminLayout from './components/layout/AdminLayout.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import AdminCoursesPage from './pages/admin/AdminCoursesPage.jsx';
import AdminCourseFormPage from './pages/admin/AdminCourseFormPage.jsx';
import AdminEnrollmentsPage from './pages/admin/AdminEnrollmentsPage.jsx';
import AdminStudentsPage from './pages/admin/AdminStudentsPage.jsx';
import AdminStudentDetailPage from './pages/admin/AdminStudentDetailPage.jsx';
import AdminCreateStaffPage from './pages/admin/AdminCreateStaffPage.jsx';
import TeacherLayout from './components/layout/TeacherLayout.jsx';
import TeacherDashboard from './pages/teacher/TeacherDashboard.jsx';
import TeacherCourseStudentsPage from './pages/teacher/TeacherCourseStudentsPage.jsx';
import TeacherProfilePage from './pages/teacher/TeacherProfilePage.jsx';

const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/courses',
    element: <CoursesPage />,
  },
  {
    path: '/courses/:id',
    element: <CourseDetailPage />,
  },
  {
    element: <GuestRoute />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/signup', element: <SignUpPage /> },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={['student']} />,
    children: [
      {
        path: '/student',
        element: <StudentLayout />,
        children: [
          { index: true, element: <Navigate to="dashboard" replace /> },
          { path: 'dashboard', element: <StudentDashboard /> },
          { path: 'profile', element: <StudentProfile /> },
          { path: 'courses', element: <StudentCourse /> },
          { path: 'enrollments/:id', element: <EnrollmentConfirmationPage /> },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={['admin']} />,
    children: [
      {
        path: '/admin',
        element: <AdminLayout />,
        children: [
          { index: true, element: <AdminDashboard /> },
          { path: 'courses', element: <AdminCoursesPage /> },
          { path: 'courses/new', element: <AdminCourseFormPage /> },
          { path: 'courses/:id/edit', element: <AdminCourseFormPage /> },
          { path: 'enrollments', element: <AdminEnrollmentsPage /> },
          { path: 'students', element: <AdminStudentsPage /> },
          { path: 'students/:id', element: <AdminStudentDetailPage /> },
          { path: 'users/new', element: <AdminCreateStaffPage /> },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={['teacher']} />,
    children: [
      {
        path: '/teacher',
        element: <TeacherLayout />,
        children: [
          { index: true, element: <TeacherDashboard /> },
          { path: 'courses/:id', element: <TeacherCourseStudentsPage /> },
          { path: 'profile', element: <TeacherProfilePage /> },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);

const queryClient = new QueryClient();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </AuthProvider>
  </StrictMode>
);
