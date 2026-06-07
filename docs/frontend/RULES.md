# Frontend Rules

Coding standards for the Next.js admin dashboard.

## Folder Structure

Use feature-based architecture:

```
src/
  app/
  features/
  components/
  hooks/
  services/
  types/
  utils/
  providers/
  lib/
```

See [FOLDER-STRUCTURE.md](./FOLDER-STRUCTURE.md) for the full layout.

## React Query Rules

All server data must use TanStack React Query:

- `useQuery` for reads
- `useMutation` for writes
- Centralized query keys in `lib/query-keys.ts`

**Avoid direct fetch calls inside components.** Use `lib/api-client.ts` or feature `services/`.

## Form Rules

Use:

- React Hook Form
- Zod validation

Never use uncontrolled forms.

## Component Rules

Keep components:

- Small
- Reusable
- Fully typed

Avoid components larger than 300 lines.

## UI Rules

Use:

- Modern SaaS dashboard design
- Clean spacing and consistent typography
- Mobile responsive layouts
- Accessible components (ShadCN UI)

Follow ShadCN UI patterns and Tailwind best practices.

## Auth Flow

- JWT stored in HTTP-only cookies (refresh) + memory/header (access)
- Next.js middleware for route guards
- Role-based access on dashboard routes

## Related Docs

- [Frontend Architecture](./ARCHITECTURE.md)
- [UI Guidelines](./UI-GUIDELINES.md)
- [Backend API](../backend/API-ENDPOINTS.md)
