# Frontend UI Guidelines

Design and interaction standards for the admin dashboard.

## Design Principles

The dashboard should feel comparable to modern SaaS products:

- CRM platforms (HubSpot, Salesforce)
- Call center platforms (Aircall, Exotel dashboard)
- AI SaaS platforms (clean, data-dense, professional)

**Avoid outdated UI patterns** — no cluttered tables, inconsistent spacing, or unstyled forms.

## Visual Standards

| Element | Guideline |
|---|---|
| Layout | Sidebar + top header; responsive collapse on mobile |
| Spacing | Consistent Tailwind scale (4, 6, 8, 12) |
| Typography | Clear hierarchy: page title → section → body |
| Colors | ShadCN theme tokens; status colors for call/campaign states |
| Tables | Sortable, paginated, filterable; skeleton loading states |
| Forms | Label + input + inline validation error |
| Feedback | Toast notifications for success/error |

## Component Patterns

### Data Tables

- Use ShadCN `Table` + React Query loading/error states
- Row actions in dropdown menu
- Bulk actions where applicable (contacts, campaigns)

### Forms

- React Hook Form + Zod resolver
- Submit button disabled while loading
- Field-level error messages

### Dashboard Cards

- KPI cards on overview page (total calls, active campaigns, conversion rate)
- Charts for analytics (Recharts or similar)

### Status Badges

Campaign and call statuses should use consistent color-coded badges:

| Status | Color hint |
|---|---|
| running / in_progress | green |
| paused / ringing | yellow |
| failed / stopped | red |
| completed | blue |
| draft / pending | gray |

## Accessibility

- Keyboard navigable forms and menus
- ARIA labels on icon-only buttons
- Sufficient color contrast (WCAG AA)
- Focus visible states on interactive elements

## Mobile Responsive

- Sidebar collapses to hamburger menu
- Tables scroll horizontally or switch to card layout
- Touch-friendly tap targets (min 44px)

## Related Docs

- [Frontend Rules](./RULES.md)
- [Frontend Architecture](./ARCHITECTURE.md)
- [Backend API](../backend/API-ENDPOINTS.md)
