export type {
  CreateUserInput,
  InviteUserInput,
  UpdateUserInput,
  ListUsersQuery,
} from '@/features/users/schemas';

export interface UserListItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  isActive: boolean;
  role: {
    name: string;
    description: string | null;
  };
  createdAt: string;
}

export interface Role {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
}

export interface Permission {
  id: string;
  resource: string;
  action: string;
  description: string | null;
}
