import { Request, Response } from 'express';
import { authService } from './auth.service';
import { sendSuccess } from '../../shared/utils/response';
import { asyncHandler } from '../../shared/utils/async-handler';
import {
  RegisterInput,
  LoginInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from './auth.validator';

export class AuthController {
  register = asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.register(req.body as RegisterInput, res);
    sendSuccess(res, result, 201);
  });

  login = asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.login(req.body as LoginInput, res);
    sendSuccess(res, result);
  });

  refresh = asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.cookies?.refresh_token as string | undefined;
    const result = await authService.refresh(refreshToken, res);
    sendSuccess(res, result);
  });

  logout = asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.cookies?.refresh_token as string | undefined;
    const result = await authService.logout(refreshToken, req.user?.id, res);
    sendSuccess(res, result);
  });

  me = asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.me(req.user!.id);
    sendSuccess(res, result);
  });

  forgotPassword = asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.forgotPassword(req.body as ForgotPasswordInput);
    sendSuccess(res, result);
  });

  resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.resetPassword(req.body as ResetPasswordInput);
    sendSuccess(res, result);
  });
}

export const authController = new AuthController();
