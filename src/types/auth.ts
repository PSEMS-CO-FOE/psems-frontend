export type Role =
  | 'SYSTEM_ADMIN'
  | 'COURSE_COORDINATOR'
  | 'LECTURER'
  | 'STUDENT';

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
}

export interface LoginResponse {
  accessToken: string;
  forcePasswordChange: boolean;
  user: {
    id: string;
    email: string;
    role: Role;
  };
}

export interface RefreshResponse {
  accessToken: string;
  forcePasswordChange: boolean;
  user: {
    id: string;
    email: string;
    role: Role;
  };
}
