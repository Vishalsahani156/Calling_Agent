import { Router } from 'express';
import { authController } from './auth.controller';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from './auth.validator';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/auth';
import { authRateLimit } from '../../middleware/rate-limit';
import { auditLog, auditResponseHook } from '../../middleware/audit-log';

const router = Router();

router.post(
  '/register',
  authRateLimit,
  validate({ body: registerSchema }),
  auditLog({ action: 'register', resourceType: 'auth' }),
  auditResponseHook,
  authController.register,
);

router.post(
  '/login',
  authRateLimit,
  validate({ body: loginSchema }),
  auditLog({ action: 'login', resourceType: 'auth' }),
  auditResponseHook,
  authController.login,
);

router.post('/refresh', authController.refresh);

router.post('/logout', authenticate, authController.logout);

router.get('/me', authenticate, authController.me);

router.post(
  '/forgot-password',
  authRateLimit,
  validate({ body: forgotPasswordSchema }),
  authController.forgotPassword,
);

router.post(
  '/reset-password',
  authRateLimit,
  validate({ body: resetPasswordSchema }),
  auditLog({ action: 'reset_password', resourceType: 'auth' }),
  auditResponseHook,
  authController.resetPassword,
);

export default router;
