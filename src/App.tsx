import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { HomeRedirect } from '@/routes/HomeRedirect';
import { LoginPage } from '@/pages/LoginPage';
import { ChangePasswordPage } from '@/pages/ChangePasswordPage';
import { PlaceholderPage } from '@/pages/PlaceholderPage';
import { AdminLayout } from '@/pages/admin/AdminLayout';
import { LecturerApprovalPage } from '@/pages/admin/LecturerApprovalPage';
import { StudentProvisioningPage } from '@/pages/admin/StudentProvisioningPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      {/* Not role-gated: any authenticated user with the force flag lands here. */}
      <Route
        path="/change-password"
        element={
          <ProtectedRoute>
            <ChangePasswordPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <HomeRedirect />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['SYSTEM_ADMIN']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin/lecturers" replace />} />
        <Route path="lecturers" element={<LecturerApprovalPage />} />
        <Route path="students" element={<StudentProvisioningPage />} />
      </Route>
      <Route
        path="/coordinator"
        element={
          <ProtectedRoute allowedRoles={['COURSE_COORDINATOR']}>
            <PlaceholderPage title="Course Coordinator" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/lecturer"
        element={
          <ProtectedRoute allowedRoles={['LECTURER']}>
            <PlaceholderPage title="Lecturer" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student"
        element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <PlaceholderPage title="Student" />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  );
}
