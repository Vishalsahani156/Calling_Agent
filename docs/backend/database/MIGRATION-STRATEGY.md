# Migration Strategy

## Principles

1. **One source of truth:** [`backend/prisma/schema.prisma`](../../../backend/prisma/schema.prisma)
2. **Never edit applied migrations** — always create a new migration for schema changes
3. **pgvector first:** The initial migration enables the `vector` extension before creating embedding columns
4. **Environment separation:** Use Neon branches or separate databases for dev, staging, and production

## Initial Migration

The first migration (`init`) includes:

1. `CREATE EXTENSION IF NOT EXISTS vector;`
2. All enum types and tables
3. Foreign keys, unique constraints, and indexes
4. HNSW indexes on embedding columns:

   ```sql
   CREATE INDEX knowledge_chunks_embedding_idx ON knowledge_chunks
     USING hnsw (embedding vector_cosine_ops);

   CREATE INDEX faqs_embedding_idx ON faqs
     USING hnsw (embedding vector_cosine_ops);
   ```

## Workflows

### Local Development

```bash
# After schema.prisma changes
npm run db:migrate
```

Uses `prisma migrate dev` — generates SQL, applies it, and regenerates the client.

### CI / Production

```bash
npm run db:migrate:deploy
```

Uses `prisma migrate deploy` — applies pending migrations without prompting. Non-interactive and safe for pipelines.

### Neon

| Use case | Connection |
|---|---|
| Migrations | Direct (non-pooled) URL |
| Application (Phase 2+) | Pooled URL via PgBouncer |

Create a branch per environment:

- `main` → production
- `staging` → staging
- `dev` → development

## Rollback Policy

Prisma does not support automatic down migrations in production.

**Recommended approach:**

1. Forward-fix with a new migration (preferred)
2. Restore from database backup (disaster recovery only)
3. Never use `migrate reset` in production

## Naming Convention

```
YYYYMMDDHHMMSS_descriptive_name
```

Examples:

- `20250607120000_init`
- `20250615100000_add_call_disposition_index`

## Future Considerations (Not Phase 1)

Documented in the architecture for scale:

- Monthly partitioning of `call_logs` and `call_transcripts` at 10M+ rows
- Read replica for analytics queries
- Connection pooling via PgBouncer or Neon pooler

## Checklist Before Deploying a Migration

- [ ] `npm run db:validate` passes
- [ ] Migration tested locally with `migrate dev`
- [ ] Seed still runs idempotently
- [ ] No breaking changes without a coordinated app deploy (Phase 2+)
- [ ] Backup taken in production before `migrate deploy`
