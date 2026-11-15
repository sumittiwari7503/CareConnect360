export type UserRole = 'ROLE_PATIENT' | 'ROLE_DOCTOR' | 'ROLE_ADMIN' | 'ROLE_TRIAGE';

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role: UserRole;
  active: boolean;
  mfaEnabled: boolean;
}

export interface AuthResponse {
  token: string;
  tokenType: string;
  userId: number;
  email: string;
  fullName: string;
  role: UserRole;
}
