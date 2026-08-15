import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { HomeRedirect } from '@/routes/HomeRedirect';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { GuestScoringPage } from '@/pages/guest/GuestScoringPage';
import { ProfilePage } from '@/pages/profile/ProfilePage';
import { EditProfilePage } from '@/pages/profile/EditProfilePage';
import { DiscoverCoursesPage } from '@/pages/lecturer/DiscoverCoursesPage';
import { ChangePasswordPage } from '@/pages/ChangePasswordPage';
import { AdminLayout } from '@/pages/admin/AdminLayout';
import { LecturerApprovalPage } from '@/pages/admin/LecturerApprovalPage';
import { StudentProvisioningPage } from '@/pages/admin/StudentProvisioningPage';
import { AdminCoordinatorsPage } from '@/pages/admin/AdminCoordinatorsPage';
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
import { MarksPage } from '@/pages/student/MarksPage';
import { LecturerLayout } from '@/pages/lecturer/LecturerLayout';
import { LecturerEnterCpiPage } from '@/pages/lecturer/LecturerEnterCpiPage';
import { LecturerCpiLayout, LecturerCpiIndex } from '@/pages/lecturer/LecturerCpiLayout';
import { LecturerSessionsPage } from '@/pages/lecturer/LecturerSessionsPage';
import { AvailabilityPage } from '@/pages/lecturer/AvailabilityPage';
import { ReviewPage } from '@/pages/lecturer/ReviewPage';
import { SupervisorSelectionPage } from '@/pages/lecturer/SupervisorSelectionPage';
import { LecturerIdeasPage } from '@/pages/lecturer/LecturerIdeasPage';
import { TimerWindowPage } from '@/pages/lecturer/TimerWindowPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/guest" element={<GuestScoringPage />} />
      {/* Outside ProtectedRoute: this opens in a new window with no token, so it
          gets its own using the refresh cookie. */}
      <Route path="/timer/:cpiId/:sessionId" element={<TimerWindowPage />} />

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

      {/* An institution-wide directory: not role-gated, since a student reading
          a supervisor's profile and a lecturer reading a student's are the same
          page. Guests hold no account and never reach it. */}
      <Route
        path="/profile/edit"
        element={
          <ProtectedRoute>
            <EditProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile/:userId"
        element={
          <ProtectedRoute>
            <ProfilePage />
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
        <Route path="coordinators" element={<AdminCoordinatorsPage />} />
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
            <LecturerLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<LecturerEnterCpiPage />} />
        <Route path="discover" element={<DiscoverCoursesPage />} />
        <Route path="cpi/:cpiId" element={<LecturerCpiLayout />}>
          <Route index element={<LecturerCpiIndex />} />
          <Route path="sessions" element={<LecturerSessionsPage />} />
          <Route path="ideas" element={<LecturerIdeasPage />} />
          <Route path="selection" element={<SupervisorSelectionPage />} />
          <Route path="availability" element={<AvailabilityPage />} />
          <Route path="review" element={<ReviewPage />} />
        </Route>
      </Route>
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
          <Route path="marks" element={<MarksPage />} />
        </Route>
      </Route>

      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  );
}
