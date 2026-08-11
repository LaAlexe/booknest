export interface AdminProfile {
  id: string;
  email: string;
}

export interface CreatedAdminSession {
  admin: AdminProfile;
  sessionToken: string;
  expiresAt: Date;
}
