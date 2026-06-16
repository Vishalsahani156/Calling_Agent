export const PLATFORM_ORG_SLUG = 'platform';

export const ASSIGNABLE_ROLE_NAMES = [
  'org_admin',
  'manager',
  'agent',
  'viewer',
] as const;

export type AssignableRoleName = (typeof ASSIGNABLE_ROLE_NAMES)[number];
