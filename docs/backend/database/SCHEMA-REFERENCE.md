# Database Schema Reference

**Source of truth (implemented):** [`backend/prisma/schema.prisma`](../../../backend/prisma/schema.prisma)

Phase 1 implements 27 models with 10 enums, pgvector embeddings, and full RBAC.

## Entity Summary

### Multi-tenant Core

| Table | Purpose |
|---|---|
| `organizations` | Tenant root; slug, plan, settings JSONB |
| `settings` | Per-org Exotel config, feature flags, retention |

### RBAC

| Table | Purpose |
|---|---|
| `roles` | super_admin, org_admin, manager, agent, viewer |
| `permissions` | resource + action pairs |
| `role_permissions` | Composite PK (role_id, permission_id) |
| `users` | Email, password, org, role; soft delete via deleted_at |
| `refresh_tokens` | JWT refresh token hashes |
| `password_reset_tokens` | Forgot-password flow tokens |

### Campaigns and Contacts

| Table | Purpose |
|---|---|
| `campaigns` | Campaign config, schedule, retry policy, Exotel flow |
| `campaign_contacts` | Contact queue per campaign with status and retries |
| `contacts` | Phone (E.164), metadata, opt_out |
| `contact_tags` | Tags per organization |
| `contact_tag_map` | Composite PK (contact_id, tag_id) |
| `contact_groups` | Contact groups |
| `contact_group_map` | Composite PK (contact_id, group_id) |
| `contact_notes` | Notes with author |

### Calls and Media

| Table | Purpose |
|---|---|
| `calls` | Call record, Exotel SID, status, sentiment, disposition |
| `call_recordings` | Recording URLs |
| `call_transcripts` | Speaker, text, sequence, timestamps |
| `call_logs` | Technical event trail per call |
| `conversation_memory` | Structured per-call memory (call_id + key unique) |

### AI Configuration

| Table | Purpose |
|---|---|
| `ai_agents` | Voice profile, prompts, LLM config |
| `knowledge_bases` | KB per organization |
| `knowledge_documents` | Uploaded/manual documents |
| `knowledge_chunks` | Text chunks + vector(1536) embedding |
| `faqs` | Q&A pairs + vector(1536) embedding |

### Audit

| Table | Purpose |
|---|---|
| `audit_logs` | Admin action trail |

## Key Constraints

| Constraint | Tables |
|---|---|
| Composite PK | `role_permissions`, `contact_tag_map`, `contact_group_map` |
| Unique (org, phone) | `contacts` |
| Unique (org, tag name) | `contact_tags` |
| Unique (campaign, contact) | `campaign_contacts` |
| Unique (call, key) | `conversation_memory` |
| Unique exotel_call_sid | `calls` |

## pgvector

Extension enabled in migration. Embedding columns:

- `knowledge_chunks.embedding` — vector(1536)
- `faqs.embedding` — vector(1536)

HNSW indexes for cosine similarity on both columns.

## Cascade Policy

| Parent | Child | On delete |
|---|---|---|
| Organization | Most entities | Restrict |
| Campaign | campaign_contacts, calls | Cascade |
| Contact | maps, notes | Cascade |
| Call | recordings, transcripts, logs, memory | Cascade |
| User | refresh_tokens | Cascade |
| User | audit_logs.user_id | SetNull |

## Scalability Notes (Future)

- Partition `call_logs` and `call_transcripts` by month at 10M+ rows
- Read replica for analytics
- Batch insert campaign_contacts (1000-row chunks)
- Connection pooling via PgBouncer / Neon pooler

## Related Docs

- [Database Setup](./SETUP.md)
- [Migration Strategy](./MIGRATION-STRATEGY.md)
- [Seed Strategy](./SEED-STRATEGY.md)
- [Full architecture reference](../../shared/FULL-ARCHITECTURE-REFERENCE.md#3-complete-database-schema)
