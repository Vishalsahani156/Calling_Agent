import bcrypt from 'bcryptjs';
import { env } from '../../config/env';
import { authRepository } from '../auth/auth.repository';
import { usersRepository } from './users.repository';
import { CreateUserInput, InviteUserInput, UpdateUserInput } from './users.types';
import {
  assertAssignableRole,
  assertCanModifyUser,
  assertSuperAdmin,
} from './users.policy';
import { ConflictError, NotFoundError, ForbiddenError } from '../../shared/errors/app.error';
import { getPagination, buildPaginatedMeta } from '../../shared/utils/response';
import { generateToken, hashToken } from '../../shared/utils/crypto.util';
import { emailService } from '../../shared/services/email.service';
import { PLATFORM_ORG_SLUG } from '../../shared/constants/platform';

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
  organization?: { id: string; name: string; slug: string };
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
    organization: user.organization
      ? {
          id: user.organization.id,
          name: user.organization.name,
          slug: user.organization.slug,
        }
      : undefined,
    createdAt: user.createdAt,
  };
}

async function resolvePlatformOrganizationId(): Promise<string> {
  const organization = await authRepository.findOrganizationBySlug(PLATFORM_ORG_SLUG);
  if (!organization) {
    throw new NotFoundError('Platform organization not found. Run database seed.');
  }
  return organization.id;
}

async function validateAssignableRoleId(roleId: string): Promise<void> {
  const role = await usersRepository.findRoleById(roleId);
  if (!role) {
    throw new NotFoundError('Role not found');
  }
  assertAssignableRole(role.name);
}

export class UsersService {
  async list(requesterRole: string, query: { page?: string; limit?: string; search?: string }) {
    assertSuperAdmin(requesterRole);

    const { page, limit, skip } = getPagination(query);
    const [users, total] = await Promise.all([
      usersRepository.findMany(skip, limit, query.search),
      usersRepository.count(query.search),
    ]);

    return {
      data: users.map(formatUser),
      meta: buildPaginatedMeta(total, page, limit),
    };
  }

  async getById(id: string, requesterRole: string) {
    assertSuperAdmin(requesterRole);

    const user = await usersRepository.findById(id);
    if (!user) throw new NotFoundError('User not found');
    return formatUser(user);
  }

  async invite(input: InviteUserInput, requesterRole: string) {
    assertSuperAdmin(requesterRole);
    await validateAssignableRoleId(input.roleId);

    const existing = await usersRepository.findByEmail(input.email);
    if (existing) throw new ConflictError('Email already in use');

    const organizationId = await resolvePlatformOrganizationId();
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

  async create(input: CreateUserInput, requesterRole: string) {
    assertSuperAdmin(requesterRole);
    await validateAssignableRoleId(input.roleId);

    const existing = await usersRepository.findByEmail(input.email);
    if (existing) throw new ConflictError('Email already in use');

    const organizationId = await resolvePlatformOrganizationId();
    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
    const user = await usersRepository.create({
      ...input,
      passwordHash,
      organizationId,
    });

    return formatUser(user);
  }

  async update(id: string, input: UpdateUserInput, requesterRole: string) {
    assertSuperAdmin(requesterRole);

    const user = await usersRepository.findById(id);
    if (!user) throw new NotFoundError('User not found');

    assertCanModifyUser(user.role.name);

    if (input.roleId) {
      await validateAssignableRoleId(input.roleId);
    }

    const updated = await usersRepository.update(id, input);
    return formatUser(updated);
  }

  async delete(id: string, requesterId: string, requesterRole: string) {
    assertSuperAdmin(requesterRole);
    if (id === requesterId) throw new ForbiddenError('Cannot delete your own account');

    const user = await usersRepository.findById(id);
    if (!user) throw new NotFoundError('User not found');

    assertCanModifyUser(user.role.name);

    await usersRepository.softDelete(id);
    return { message: 'User deleted successfully' };
  }

  async listRoles(requesterRole: string, assignableOnly = false) {
    assertSuperAdmin(requesterRole);
    return usersRepository.listRoles(assignableOnly);
  }

  async listPermissions(requesterRole: string) {
    assertSuperAdmin(requesterRole);
    return usersRepository.listPermissions();
  }
}

export const usersService = new UsersService();
