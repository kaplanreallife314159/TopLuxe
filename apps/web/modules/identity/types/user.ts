export type UserStatus = 'active' | 'pending_verification' | 'suspended' | 'banned';

export type RoleCode =
  | 'buyer'
  | 'seller_individual'
  | 'seller_pro'
  | 'expert'
  | 'moderator'
  | 'admin';

export interface UserProfile {
  id: string;
  piUid: string;
  piUsername: string;
  email: string | null;
  status: UserStatus;
  roles: RoleCode[];
  createdAt: Date;
  lastLoginAt: Date | null;
}
