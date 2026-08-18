import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { HomeRedirect } from '@/routes/HomeRedirect';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { GuestScoringPage } from '@/pages/guest/GuestScoringPage';
import { ProfilePage } from '@/pages/profile/ProfilePage';
import { EditProfilePage } from '@/pages/profile/EditProfilePage';
import { DirectoryPage } from '@/pages/profile/DirectoryPage';
import { RoleShell } from '@/components/layout/RoleShell';
import { DiscoverCoursesPage } from '@/pages/lecturer/DiscoverCoursesPage';
import { ChangePasswordPage } from '@/pages/ChangePasswordPage';
import { AdminLayout } from '@/pages/admin/AdminLayout';
import { LecturerApprovalPage } from '@/pages/admin/LecturerApprovalPage';
import { StudentProvisioningPage } from '@/pages/admin/StudentProvisioningPage';
import { AdminCoordinatorsPage } from '@/pages/admin/AdminCoordinatorsPage';
import { CoordinatorLayout } from '@/pages/coordinator/CoordinatorLayout';
import { CpiListPage } from '@/pages/coordinator/CpiListPage';
import { CpiLayout } from '@/pages/coordinator/CpiLayout';
import { CpiSetupPage } from '@/pages/coordinator/CpiSetupPage';
import { CpiIdeasPage } from '@/pages/coordinator/CpiIdeasPage';
import { CpiSelectionPage } from '@/pages/coordinator/CpiSelectionPage';
import { CpiAllocationPage } from '@/pages/coordinator/CpiAllocationPage';
import { CpiEvaluationPage } from '@/pages/coordinator/CpiEvaluationPage';
import { CpiSubmissionsPage } from '@/pages/coordinator/CpiSubmissionsPage';
import { CpiSchedulePage } from '@/pages/coordinator/CpiSchedulePage';
import { CpiMarksPage } from '@/pages/coordinator/CpiMarksPage';
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
import { SchedulePage } from '@/pages/student/SchedulePage';

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

      {/* Institution-wide routes: not role-gated, since a student reading a
          supervisor's profile and a lecturer reading a student's are the same
          page. They share `RoleShell` so they keep the signed-in reader's own
          navigation — rendered bare, they had no way back into the app.
          Guests hold no account and never reach them. */}
      <Route
        element={
          <ProtectedRoute>
            <RoleShell />
          </ProtectedRoute>
        }
      >
        <Route path="/directory" element={<DirectoryPage />} />
        <Route path="/profile/edit" element={<EditProfilePage />} />
        <Route path="/profile/:userId" element={<ProfilePage />} />
      </Route>

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
        <Route path=":cpiId" element={<CpiLayout />}>
          {/* The course page used to be one scroll of eleven panels. Each area
              is now its own route, so it can be linked to and bookmarked. */}
          <Route index element={<Navigate to="setup" replace />} />
          <Route path="setup" element={<CpiSetupPage />} />
          <Route path="ideas" element={<CpiIdeasPage />} />
          <Route path="selection" element={<CpiSelectionPage />} />
          <Route path="allocation" element={<CpiAllocationPage />} />
          <Route path="evaluation" element={<CpiEvaluationPage />} />
          <Route path="submissions" element={<CpiSubmissionsPage />} />
          <Route path="schedule" element={<CpiSchedulePage />} />
          <Route path="marks" element={<CpiMarksPage />} />
        </Route>
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
          <Route path="schedule" element={<SchedulePage />} />
          <Route path="marks" element={<MarksPage />} />
        </Route>
      </Route>

      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  );
}
