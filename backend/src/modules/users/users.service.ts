import bcrypt from 'bcryptjs';
import { env } from '../../config/env';
import { authRepository } from '../auth/auth.repository';
import { usersRepository } from './users.repository';
import { CreateUserInput, InviteUserInput, UpdateUserInput } from './users.types';
import { ConflictError, NotFoundError, ForbiddenError } from '../../shared/errors/app.error';
import { getPagination, buildPaginatedMeta } from '../../shared/utils/response';
import { generateToken, hashToken } from '../../shared/utils/crypto.util';
import { emailService } from '../../shared/services/email.service';

const BCRYPT_ROUNDS = 12;
const INVITE_EXPIRY_MS = 72 * 60 * 60 * 1_000;

function formatUser(user: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  isActive: boolean;
  role: { name: string; description: string | null };
  createdAt: Date;
}) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    isActive: user.isActive,
    role: user.role,
    createdAt: user.createdAt,
  };
}

export class UsersService {
  async list(organizationId: string, query: { page?: string; limit?: string; search?: string }) {
    const { page, limit, skip } = getPagination(query);
    const [users, total] = await Promise.all([
      usersRepository.findMany(organizationId, skip, limit, query.search),
      usersRepository.count(organizationId, query.search),
    ]);
    return {
      data: users.map(formatUser),
      meta: buildPaginatedMeta(total, page, limit),
    };
  }

  async getById(id: string, organizationId: string) {
    const user = await usersRepository.findById(id, organizationId);
    if (!user) throw new NotFoundError('User not found');
    return formatUser(user);
  }

  async invite(organizationId: string, input: InviteUserInput, requesterRole: string) {
    if (!['super_admin', 'org_admin'].includes(requesterRole)) {
      throw new ForbiddenError('Only admins can invite users');
    }

    const existing = await usersRepository.findByEmail(input.email);
    if (existing) throw new ConflictError('Email already in use');

    const temporaryPassword = generateToken(24);
    const passwordHash = await bcrypt.hash(temporaryPassword, BCRYPT_ROUNDS);
    const user = await usersRepository.create({
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      roleId: input.roleId,
      passwordHash,
      organizationId,
    });

    const inviteToken = generateToken(32);
    await authRepository.createPasswordResetToken(
      user.id,
      hashToken(inviteToken),
      new Date(Date.now() + INVITE_EXPIRY_MS),
    );

    const inviteUrl = `${env.CORS_ORIGIN}/reset-password?token=${inviteToken}`;
    await emailService.sendUserInviteEmail(input.email, input.firstName, inviteUrl);

    return {
      message: 'Invitation email sent',
      user: formatUser(user),
    };
  }

  async create(organizationId: string, input: CreateUserInput, requesterRole: string) {
    if (!['super_admin', 'org_admin'].includes(requesterRole)) {
      throw new ForbiddenError('Only admins can create users');
    }

    const existing = await usersRepository.findByEmail(input.email);
    if (existing) throw new ConflictError('Email already in use');

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
    const user = await usersRepository.create({
      ...input,
      passwordHash,
      organizationId,
    });
    return formatUser(user);
  }

  async update(id: string, organizationId: string, input: UpdateUserInput, requesterRole: string) {
    if (!['super_admin', 'org_admin'].includes(requesterRole)) {
      throw new ForbiddenError('Only admins can update users');
    }

    const user = await usersRepository.findById(id, organizationId);
    if (!user) throw new NotFoundError('User not found');

    const updated = await usersRepository.update(id, organizationId, input);
    return formatUser(updated);
  }

  async delete(id: string, organizationId: string, requesterId: string, requesterRole: string) {
    if (!['super_admin', 'org_admin'].includes(requesterRole)) {
      throw new ForbiddenError('Only admins can delete users');
    }
    if (id === requesterId) throw new ForbiddenError('Cannot delete your own account');

    const user = await usersRepository.findById(id, organizationId);
    if (!user) throw new NotFoundError('User not found');

    await usersRepository.softDelete(id, organizationId);
    return { message: 'User deleted successfully' };
  }

  async listRoles() {
    return usersRepository.listRoles();
  }

  async listPermissions() {
    return usersRepository.listPermissions();
  }
}

export const usersService = new UsersService();
