import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { HomeRedirect } from '@/routes/HomeRedirect';
import { LoginPage } from '@/pages/LoginPage';
import { ChangePasswordPage } from '@/pages/ChangePasswordPage';
import { PlaceholderPage } from '@/pages/PlaceholderPage';
import { AdminLayout } from '@/pages/admin/AdminLayout';
import { LecturerApprovalPage } from '@/pages/admin/LecturerApprovalPage';
import { StudentProvisioningPage } from '@/pages/admin/StudentProvisioningPage';
import { CoordinatorLayout } from '@/pages/coordinator/CoordinatorLayout';
import { CpiListPage } from '@/pages/coordinator/CpiListPage';
import { CpiDetailPage } from '@/pages/coordinator/CpiDetailPage';
import { StudentLayout } from '@/pages/student/StudentLayout';
import { EnterCpiPage } from '@/pages/student/EnterCpiPage';
import { StudentCpiLayout } from '@/pages/student/StudentCpiLayout';
import { GroupPage } from '@/pages/student/GroupPage';
import { IdeasPage } from '@/pages/student/IdeasPage';
import { SelectionPage } from '@/pages/student/SelectionPage';
import { SubmissionsPage } from '@/pages/student/SubmissionsPage';

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
            <CoordinatorLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<CpiListPage />} />
        <Route path=":cpiId" element={<CpiDetailPage />} />
      </Route>
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
            <StudentLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<EnterCpiPage />} />
        <Route path="cpi/:cpiId" element={<StudentCpiLayout />}>
          <Route index element={<GroupPage />} />
          <Route path="group" element={<GroupPage />} />
          <Route path="ideas" element={<IdeasPage />} />
          <Route path="selection" element={<SelectionPage />} />
          <Route path="submissions" element={<SubmissionsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  );
}
