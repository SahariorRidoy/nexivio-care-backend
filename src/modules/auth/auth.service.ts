import { prisma } from '../../config/database';
import { redis } from '../../config/redis';
import { hashPassword, comparePassword } from '../../utils/hash.util';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/jwt.util';
import { AppError } from '../../middlewares/error.middleware';
import { RegisterDto, LoginDto, AuthTokens, AuthResponse } from './auth.types';

const REFRESH_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

const buildTokens = (userId: string, email: string, role: string): AuthTokens => ({
  accessToken: signAccessToken({ userId, email, role }),
  refreshToken: signRefreshToken({ userId, email, role }),
});

export const registerUser = async (dto: RegisterDto): Promise<AuthResponse> => {
  const existing = await prisma.user.findUnique({ where: { email: dto.email } });
  if (existing) throw new AppError('Email already in use', 409);

  const password = await hashPassword(dto.password);
  const user = await prisma.user.create({
    data: { name: dto.name, email: dto.email, password },
  });

  const tokens = buildTokens(user.id, user.email, user.role);
  await prisma.user.update({ where: { id: user.id }, data: { refreshToken: tokens.refreshToken } });

  return {
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    token: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };
};

export const loginUser = async (dto: LoginDto): Promise<AuthResponse> => {
  const user = await prisma.user.findUnique({ where: { email: dto.email } });
  if (!user) throw new AppError('Invalid credentials', 401);

  const valid = await comparePassword(dto.password, user.password);
  if (!valid) throw new AppError('Invalid credentials', 401);

  const tokens = buildTokens(user.id, user.email, user.role);
  await prisma.user.update({ where: { id: user.id }, data: { refreshToken: tokens.refreshToken } });

  return {
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    token: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };
};

export const refreshTokens = async (token: string): Promise<AuthTokens> => {
  const isBlacklisted = await redis.get(`blacklist:${token}`);
  if (isBlacklisted) throw new AppError('Token has been revoked', 401);

  const payload = verifyRefreshToken(token);
  const user = await prisma.user.findUnique({ where: { id: payload.userId } });

  if (!user || user.refreshToken !== token) throw new AppError('Invalid refresh token', 401);

  const tokens = buildTokens(user.id, user.email, user.role);
  await prisma.user.update({ where: { id: user.id }, data: { refreshToken: tokens.refreshToken } });

  return tokens;
};

export const logoutUser = async (userId: string, refreshToken: string): Promise<void> => {
  await prisma.user.update({ where: { id: userId }, data: { refreshToken: null } });
  await redis.setex(`blacklist:${refreshToken}`, REFRESH_TTL_SECONDS, '1');
};
