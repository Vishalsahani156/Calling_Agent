'use client';

import { use } from 'react';

import { PermissionGuard } from '@/components/shared/permission-guard';
import { ContactDetailView } from '@/features/contacts/components/ContactDetailView';

interface ContactDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function ContactDetailPage({ params }: ContactDetailPageProps) {
  const { id } = use(params);

  return (
    <PermissionGuard permission="contacts:read">
      <ContactDetailView contactId={id} />
    </PermissionGuard>
  );
}
