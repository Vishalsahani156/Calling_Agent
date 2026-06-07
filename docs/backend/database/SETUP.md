# Database Setup Guide

Phase 1 database layer for the AI Voice Calling Agent Platform.

## Prerequisites

- Node.js 20+
- Docker and Docker Compose
- npm

## Quick Start (Local)

### 1. Environment

```bash
cp .env.example .env
```

Default `DATABASE_URL`:

```
postgresql://calling:calling_dev@localhost:5434/calling?schema=public
```

### 2. Start PostgreSQL

```bash
docker compose up -d postgres
```

PostgreSQL runs on host port **5434** (mapped from container port 5432) to avoid conflicts with a local PostgreSQL installation on port 5432.

```bash
docker compose ps
```

### 3. Install Dependencies

From the repository root:

```bash
npm install
```

### 4. Generate Prisma Client

```bash
npm run db:generate
```

### 5. Run Migrations

```bash
npm run db:migrate
```

When prompted for a migration name on first run, use `init` or accept the default.

For production/CI (non-interactive):

```bash
npm run db:migrate:deploy
```

### 6. Seed RBAC Data

```bash
npm run db:seed
```

Optional dev organization and admin user:

```bash
SEED_DEV_DATA=true npm run db:seed
```

Default dev credentials (when `SEED_DEV_DATA=true`):

- Email: `admin@example.com`
- Password: `ChangeMe123!`

### 7. Verify

```bash
npm run db:validate
npm run db:studio
```

Prisma Studio opens at `http://localhost:5555`.

## Neon PostgreSQL (Cloud)

1. Create a Neon project at [https://neon.tech](https://neon.tech)
2. Enable the `vector` extension in the SQL editor:

   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

3. Set `DATABASE_URL` in `.env` to your Neon connection string
4. Use the **direct** connection URL for migrations (not the pooler)
5. Run:

   ```bash
   npm run db:migrate:deploy
   npm run db:seed
   ```

## Schema Overview

| Domain | Tables |
|---|---|
| Multi-tenant | `organizations`, `settings` |
| RBAC | `roles`, `permissions`, `role_permissions`, `users`, `refresh_tokens`, `password_reset_tokens` |
| Campaigns | `campaigns`, `campaign_contacts` |
| Contacts | `contacts`, `contact_tags`, `contact_tag_map`, `contact_groups`, `contact_group_map`, `contact_notes` |
| Calls | `calls`, `call_recordings`, `call_transcripts`, `call_logs`, `conversation_memory` |
| AI / KB | `ai_agents`, `knowledge_bases`, `knowledge_documents`, `knowledge_chunks`, `faqs` |
| Audit | `audit_logs` |

## pgvector

The schema uses `vector(1536)` for AI embeddings on:

- `knowledge_chunks.embedding`
- `faqs.embedding`

HNSW indexes are created in the initial migration for cosine similarity search.

## Troubleshooting

### Extension `vector` does not exist

Ensure you are using the `pgvector/pgvector:pg16` Docker image or have enabled the extension on Neon.

### Migration drift

Never edit applied migrations. Create a new migration instead:

```bash
cd backend && npx prisma migrate dev --name describe_change
```

### Reset local database

```bash
cd backend && npx prisma migrate reset
```

This drops all data, re-applies migrations, and re-runs the seed.

## Related Docs

- [Migration Strategy](./MIGRATION-STRATEGY.md)
- [Seed Strategy](./SEED-STRATEGY.md)
- [Schema Reference](./SCHEMA-REFERENCE.md)
- [Backend README](../README.md)
