# API Endpoints

Base URL: `/api/v1`

## Auth

| Method | Path | Description |
|---|---|---|
| POST | `/auth/register` | Register new user + organization |
| POST | `/auth/login` | Login |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/logout` | Revoke refresh token |
| POST | `/auth/forgot-password` | Request password reset |
| POST | `/auth/reset-password` | Reset password with token |
| GET | `/auth/me` | Current user profile |

## Users and RBAC

| Method | Path | Description |
|---|---|---|
| GET | `/users` | List users (admin) |
| POST | `/users` | Create/invite user |
| GET | `/users/:id` | Get user |
| PATCH | `/users/:id` | Update user |
| DELETE | `/users/:id` | Delete user |
| GET | `/roles` | List roles |
| GET | `/permissions` | List permissions |

## Campaigns

| Method | Path | Description |
|---|---|---|
| GET | `/campaigns` | List campaigns |
| POST | `/campaigns` | Create campaign |
| GET | `/campaigns/:id` | Get campaign |
| PATCH | `/campaigns/:id` | Update campaign |
| DELETE | `/campaigns/:id` | Delete campaign |
| POST | `/campaigns/:id/contacts/import` | Import contacts to campaign |
| POST | `/campaigns/:id/start` | Start campaign |
| POST | `/campaigns/:id/pause` | Pause campaign |
| POST | `/campaigns/:id/stop` | Stop campaign |
| GET | `/campaigns/:id/analytics` | Campaign analytics |
| GET | `/campaigns/:id/report` | Campaign report |

## Contacts

| Method | Path | Description |
|---|---|---|
| GET | `/contacts` | List contacts |
| POST | `/contacts` | Create contact |
| GET | `/contacts/:id` | Get contact |
| PATCH | `/contacts/:id` | Update contact |
| DELETE | `/contacts/:id` | Delete contact |
| POST | `/contacts/import` | Bulk CSV import |
| GET | `/contacts/export` | Export contacts |
| POST | `/contacts/:id/tags` | Add tags |
| POST | `/contacts/:id/notes` | Add note |
| GET | `/groups` | List contact groups |
| POST | `/groups` | Create group |

## Calls

| Method | Path | Description |
|---|---|---|
| GET | `/calls` | List calls |
| GET | `/calls/:id` | Get call detail |
| GET | `/calls/:id/transcript` | Get transcript |
| GET | `/calls/:id/recording` | Get recording URL |
| GET | `/calls/live` | Active calls |
| WS | `/ws/calls/live` | Live call monitor |

## Knowledge Base

| Method | Path | Description |
|---|---|---|
| GET | `/knowledge-bases` | List knowledge bases |
| POST | `/knowledge-bases` | Create knowledge base |
| POST | `/knowledge-bases/:id/documents` | Add document |
| POST | `/knowledge-bases/:id/documents/upload` | Upload file |
| GET | `/knowledge-bases/:id/documents` | List documents |
| DELETE | `/knowledge-documents/:id` | Delete document |
| GET | `/knowledge-bases/:id/faqs` | List FAQs |
| POST | `/knowledge-bases/:id/faqs` | Create FAQ |
| POST | `/knowledge-bases/:id/reindex` | Reindex embeddings |

## AI Agents

| Method | Path | Description |
|---|---|---|
| GET | `/agents` | List agents |
| POST | `/agents` | Create agent |
| GET | `/agents/:id` | Get agent |
| PATCH | `/agents/:id` | Update agent |
| DELETE | `/agents/:id` | Delete agent |
| POST | `/agents/:id/test` | Sandbox text conversation |

## Analytics

| Method | Path | Description |
|---|---|---|
| GET | `/analytics/overview` | Dashboard overview |
| GET | `/analytics/calls` | Call analytics |
| GET | `/analytics/campaigns/:id` | Campaign analytics |

## Settings

| Method | Path | Description |
|---|---|---|
| GET | `/settings` | Get org settings |
| PATCH | `/settings` | Update org settings |

## Webhooks (Exotel)

| Method | Path | Description |
|---|---|---|
| POST | `/webhooks/exotel/status` | Call status callbacks |
| POST | `/webhooks/exotel/passthru` | Post-voicebot routing |
| GET | `/webhooks/exotel/passthru` | Escalation decision |

## Health

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Liveness check |
| GET | `/ready` | Readiness check |

## Related Docs

- [Backend Rules](./RULES.md)
- [Backend Architecture](./ARCHITECTURE.md)
