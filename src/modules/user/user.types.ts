export interface UpdateProfileDto {
  name?: string;
  avatar?: string;
  avatarPublicId?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: string;
  isVerified: boolean;
  createdAt: Date;
}
