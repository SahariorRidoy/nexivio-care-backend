import { prisma } from '../../config/database';
import { saveImage, deleteFile } from '../../utils/storage.util';
import { AppError } from '../../middlewares/error.middleware';
import { UpdateProfileDto, UserProfile } from './user.types';

const userSelect = {
  id: true,
  name: true,
  email: true,
  avatar: true,
  role: true,
  isVerified: true,
  createdAt: true,
} as const;

export const getUserById = async (userId: string): Promise<UserProfile> => {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: userSelect });
  if (!user) throw new AppError('User not found', 404);
  return user;
};

export const updateProfile = async (
  userId: string,
  dto: UpdateProfileDto
): Promise<UserProfile> => {
  return prisma.user.update({ where: { id: userId }, data: dto, select: userSelect });
};

export const updateAvatar = async (userId: string, buffer: Buffer): Promise<UserProfile> => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('User not found', 404);

  if (user.avatarPublicId) await deleteFile(user.avatarPublicId);

  const { url, publicId } = await saveImage(buffer, 'avatars');
  return updateProfile(userId, { avatar: url, avatarPublicId: publicId });
};
