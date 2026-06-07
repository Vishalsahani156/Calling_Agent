import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Response } from 'express';
import { RoleName } from '@prisma/client';
import { env } from '../../config/env';
import { authRepository } from './auth.repository';
import {
  RegisterInput,
  LoginInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from './auth.validator';
import {
  BadRequestError,
  ConflictError,
  UnauthorizedError,
  NotFoundError,
} from '../../shared/errors/app.error';
import { hashToken, generateToken, slugify } from '../../shared/utils/crypto.util';
import { JwtAccessPayload, JwtRefreshPayload } from '../../types/jwt';
import { eventBus, AppEvents } from '../../events/event-bus';

const BCRYPT_ROUNDS = 12;
const REFRESH_COOKIE = 'refresh_token';

function parseExpiry(expiry: string): number {
  const match = expiry.match(/^(\d+)([smhd])$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const value = parseInt(match[1], 10);
  const unit = match[2];
  const multipliers: Record<string, number> = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return value * (multipliers[unit] ?? 86400000);
}

function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: parseExpiry(env.JWT_REFRESH_EXPIRES_IN),
    path: '/api/v1/auth',
  });
}

function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE, { path: '/api/v1/auth' });
}

async function generateTokens(user: {
  id: string;
  email: string;
  organizationId: string;
  roleId: string;
  role: { name: RoleName };
}) {
  const accessPayload: JwtAccessPayload = {
    sub: user.id,
    email: user.email,
    organizationId: user.organizationId,
    roleId: user.roleId,
    roleName: user.role.name,
  };

  const accessToken = jwt.sign(accessPayload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });

  const refreshTokenValue = generateToken(48);
  const refreshTokenHash = hashToken(refreshTokenValue);
  const expiresAt = new Date(Date.now() + parseExpiry(env.JWT_REFRESH_EXPIRES_IN));

  await authRepository.createRefreshToken(user.id, refreshTokenHash, expiresAt);

  return { accessToken, refreshTokenValue };
}

function formatUserResponse(
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    organizationId: string;
    role: { name: RoleName; description: string | null };
    organization: { id: string; name: string; slug: string };
  },
  permissions: string[],
) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    organizationId: user.organizationId,
    organization: {
      id: user.organization.id,
      name: user.organization.name,
      slug: user.organization.slug,
    },
    role: {
      name: user.role.name,
      description: user.role.description,
    },
    permissions,
  };
}

export class AuthService {
  async register(input: RegisterInput, res: Response) {
    const existing = await authRepository.findUserByEmail(input.email);
    if (existing) throw new ConflictError('Email already registered');

    const orgAdminRole = await authRepository.findRoleByName(RoleName.org_admin);
    if (!orgAdminRole) throw new BadRequestError('Default role not configured. Run database seed.');

    let slug = slugify(input.organizationName);
    let suffix = 0;
    while (await authRepository.findOrganizationBySlug(slug)) {
      suffix += 1;
      slug = `${slugify(input.organizationName)}-${suffix}`;
    }

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

    const user = await authRepository.createOrganizationWithUser({
      orgName: input.organizationName,
      slug,
      email: input.email,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      roleId: orgAdminRole.id,
    });

    const permissions = (await authRepository.getUserPermissions(user.roleId)).map(
      (rp) => `${rp.permission.resource}:${rp.permission.action}`,
    );

    const tokens = await generateTokens(user);
    setRefreshCookie(res, tokens.refreshTokenValue);

    eventBus.emit(AppEvents.USER_REGISTERED, {
      userId: user.id,
      organizationId: user.organizationId,
      email: user.email,
    });

    return {
      accessToken: tokens.accessToken,
      user: formatUserResponse(user, permissions),
    };
  }

  async login(input: LoginInput, res: Response) {
    const user = await authRepository.findUserByEmail(input.email);
    if (!user || !user.isActive) throw new UnauthorizedError('Invalid email or password');

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) throw new UnauthorizedError('Invalid email or password');

    await authRepository.updateLastLogin(user.id);

    const permissions = (await authRepository.getUserPermissions(user.roleId)).map(
      (rp) => `${rp.permission.resource}:${rp.permission.action}`,
    );

    const tokens = await generateTokens(user);
    setRefreshCookie(res, tokens.refreshTokenValue);

    eventBus.emit(AppEvents.USER_LOGGED_IN, {
      userId: user.id,
      organizationId: user.organizationId,
    });

    return {
      accessToken: tokens.accessToken,
      user: formatUserResponse(user, permissions),
    };
  }

  async refresh(refreshToken: string | undefined, res: Response) {
    if (!refreshToken) throw new UnauthorizedError('Refresh token missing');

    const tokenHash = hashToken(refreshToken);
    const stored = await authRepository.findRefreshToken(tokenHash);
    if (!stored) throw new UnauthorizedError('Invalid refresh token');

    await authRepository.revokeRefreshToken(tokenHash);

    const user = stored.user;
    if (!user.isActive || user.deletedAt) throw new UnauthorizedError('User inactive');

    const fullUser = await authRepository.findUserById(user.id);
    if (!fullUser) throw new UnauthorizedError('User not found');

    const tokens = await generateTokens(fullUser);
    setRefreshCookie(res, tokens.refreshTokenValue);

    const permissions = (await authRepository.getUserPermissions(fullUser.roleId)).map(
      (rp) => `${rp.permission.resource}:${rp.permission.action}`,
    );

    return {
      accessToken: tokens.accessToken,
      user: formatUserResponse(fullUser, permissions),
    };
  }

  async logout(refreshToken: string | undefined, userId: string | undefined, res: Response) {
    if (refreshToken) {
      await authRepository.revokeRefreshToken(hashToken(refreshToken));
    }
    if (userId) {
      await authRepository.revokeAllUserTokens(userId);
      eventBus.emit(AppEvents.USER_LOGGED_OUT, { userId });
    }
    clearRefreshCookie(res);
    return { message: 'Logged out successfully' };
  }

  async me(userId: string) {
    const user = await authRepository.findUserById(userId);
    if (!user) throw new NotFoundError('User not found');

    const permissions = (await authRepository.getUserPermissions(user.roleId)).map(
      (rp) => `${rp.permission.resource}:${rp.permission.action}`,
    );

    return formatUserResponse(user, permissions);
  }

  async forgotPassword(input: ForgotPasswordInput) {
    const user = await authRepository.findUserByEmail(input.email);
    if (!user) {
      return { message: 'If the email exists, a reset link has been sent' };
    }

    const token = generateToken(32);
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await authRepository.createPasswordResetToken(user.id, tokenHash, expiresAt);

    if (env.NODE_ENV === 'development') {
      console.log(`[dev] Password reset token for ${input.email}: ${token}`);
    }

    return { message: 'If the email exists, a reset link has been sent' };
  }

  async resetPassword(input: ResetPasswordInput) {
    const tokenHash = hashToken(input.token);
    const resetToken = await authRepository.findPasswordResetToken(tokenHash);
    if (!resetToken) throw new BadRequestError('Invalid or expired reset token');

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
    await authRepository.updatePassword(resetToken.userId, passwordHash);
    await authRepository.markPasswordResetUsed(resetToken.id);
    await authRepository.revokeAllUserTokens(resetToken.userId);

    return { message: 'Password reset successfully' };
  }
}

export const authService = new AuthService();
