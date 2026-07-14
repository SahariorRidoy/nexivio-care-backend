import { Request, Response, NextFunction } from 'express';
import * as authService from './auth.service';
import * as userService from '../user/user.service';
import { sendSuccess } from '../../utils/response.util';
import { RegisterDto, LoginDto } from './auth.types';

export const me = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await userService.getUserById(req.user!.userId);
    sendSuccess(res, 'Current user', user);
  } catch (err) {
    next(err);
  }
};

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await authService.registerUser(req.body as RegisterDto);
    sendSuccess(res, 'Registration successful', result, 201);
  } catch (err) {
    next(err);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await authService.loginUser(req.body as LoginDto);
    sendSuccess(res, 'Login successful', result);
  } catch (err) {
    next(err);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tokens = await authService.refreshTokens(req.body.refreshToken as string);
    sendSuccess(res, 'Tokens refreshed', tokens);
  } catch (err) {
    next(err);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await authService.logoutUser(req.user!.userId, req.body.refreshToken as string);
    sendSuccess(res, 'Logged out successfully');
  } catch (err) {
    next(err);
  }
};
