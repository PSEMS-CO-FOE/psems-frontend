import { useMutation } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '@/lib/apiClient';
import { useAuthStore } from '@/stores/authStore';
import type { LoginResponse, Role } from '@/types/auth';

// Which role each section belongs to. `ProtectedRoute` remembers the page a
// visitor was sent away from, but the person who signs in next is not always
// the person who was sent away — so a remembered page is only followed when it
// belongs to the role that just signed in. Anything else goes to their own home.
const SECTION_ROLE: { prefix: string; role: Role }[] = [
  { prefix: '/super-admin', role: 'SUPER_ADMIN' },
  { prefix: '/admin', role: 'SYSTEM_ADMIN' },
  { prefix: '/coordinator', role: 'COURSE_COORDINATOR' },
  { prefix: '/lecturer', role: 'LECTURER' },
  { prefix: '/student', role: 'STUDENT' },
];

// A path segment that identifies one record: a course, a group, a session. The
// role check alone is not enough — two lecturers both pass it, and the second
// would land on the first one's course.
const IDENTIFIES_A_RECORD = /\/(?:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|\d+)(?:\/|$)/i;

function reachableBy(path: string | undefined, role: Role): boolean {
  if (!path) return false;
  // Remembered only as far as the section. Which course was open belonged to
  // whoever was signed in then, and that is not necessarily this person.
  if (IDENTIFIES_A_RECORD.test(path)) return false;
  const section = SECTION_ROLE.find((s) => path === s.prefix || path.startsWith(`${s.prefix}/`));
  // Shared routes (profile, directory, guide) belong to no section and are
  // reachable by everyone.
  return section ? section.role === role : true;
}

interface LoginArgs {
  email: string;
  password: string;
}

interface LocationState {
  from?: { pathname: string };
}

export function useLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const setSession = useAuthStore((s) => s.setSession);

  return useMutation({
    mutationFn: async (args: LoginArgs) => {
      const res = await api.post<LoginResponse>('/auth/login', args);
      return res.data;
    },
    onSuccess: (data) => {
      setSession({
        accessToken: data.accessToken,
        user: data.user,
        forcePasswordChange: data.forcePasswordChange,
      });

      if (data.forcePasswordChange) {
        navigate('/change-password', { replace: true });
        return;
      }

      const from = (location.state as LocationState | null)?.from?.pathname;
      navigate(reachableBy(from, data.user.role) ? from! : '/', { replace: true });
    },
  });
}
