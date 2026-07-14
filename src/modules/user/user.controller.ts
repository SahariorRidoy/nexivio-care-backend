import { Request, Response, NextFunction } from 'express';
import * as userService from './user.service';
import { sendSuccess, sendError } from '../../utils/response.util';

export const getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await userService.getUserById(req.user!.userId);
    sendSuccess(res, 'Profile fetched', user);
  } catch (err) {
    next(err);
  }
};

export const updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await userService.updateProfile(req.user!.userId, req.body);
    sendSuccess(res, 'Profile updated', user);
  } catch (err) {
    next(err);
  }
};

export const updateAvatar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.file) {
      sendError(res, 'No file uploaded', 400);
      return;
    }
    const user = await userService.updateAvatar(req.user!.userId, req.file.buffer);
    sendSuccess(res, 'Avatar updated', user);
  } catch (err) {
    next(err);
  }
};
