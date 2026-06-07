# Seed Strategy

## Purpose

The seed script populates **system-level RBAC data** required before any application code can authenticate or authorize users.

Location: [`backend/prisma/seed.ts`](../../../backend/prisma/seed.ts)

## Idempotency

All seed operations use `upsert` on unique keys:

| Entity | Unique key |
|---|---|
| `Permission` | `(resource, action)` |
| `Role` | `name` |
| `RolePermission` | `(roleId, permissionId)` |
| `Organization` (dev only) | `slug` |
| `User` (dev only) | `email` |
| `Settings` (dev only) | `organizationId` |

Running the seed multiple times produces the same result without duplicates.

## Seed Order

1. **Permissions** — 20 resource/action pairs
2. **Roles** — 5 system roles
3. **Role permissions** — permission matrix per role
4. **Dev data** (optional) — demo org + admin user

## Permissions (20)

| Resource | Actions |
|---|---|
| campaigns | read, write, delete |
| contacts | read, write, delete |
| calls | read, write |
| knowledge | read, write, delete |
| agents | read, write, delete |
| users | read, write, delete |
| settings | read, write |
| analytics | read |

## Roles

| Role | Access |
|---|---|
| `super_admin` | All permissions |
| `org_admin` | All permissions |
| `manager` | All except `users:write`, `users:delete`, `settings:write` |
| `agent` | campaigns/contacts/calls/knowledge/agents/analytics read; calls write |
| `viewer` | Read-only on all resources |

## Default Seed (Production-Safe)

```bash
npm run db:seed
```

Seeds **only** roles, permissions, and role-permission mappings. No organizations, users, or demo data.

## Dev Seed (Optional)

```bash
SEED_DEV_DATA=true npm run db:seed
```

Additional data:

| Entity | Value |
|---|---|
| Organization | `demo-org` / Demo Organization |
| User | `admin@example.com` (org_admin role) |
| Settings | Default empty config for demo org |

Environment variables:

| Variable | Default |
|---|---|
| `SEED_DEV_DATA` | `false` |
| `DEV_ADMIN_EMAIL` | `admin@example.com` |
| `DEV_ADMIN_PASSWORD` | `ChangeMe123!` |

**Never set `SEED_DEV_DATA=true` in production.**

## What Is NOT Seeded

- Campaigns, contacts, or calls
- AI agents or knowledge bases
- Mock or placeholder business data

This keeps the default seed production-quality and avoids demo clutter.

## Running After Migrations

The seed is configured in `backend/package.json`:

```json
"prisma": {
  "seed": "tsx prisma/seed.ts"
}
```

It runs automatically after `prisma migrate reset` and can be invoked manually with `npm run db:seed`.

## Verification

After seeding, confirm in Prisma Studio or SQL:

```sql
SELECT COUNT(*) FROM permissions;       -- 20
SELECT COUNT(*) FROM roles;               -- 5
SELECT COUNT(*) FROM role_permissions;  -- varies by matrix
```
