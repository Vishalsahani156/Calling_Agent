'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Pencil } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ContactForm } from '@/features/contacts/components/ContactForm';
import { ContactNotesSection } from '@/features/contacts/components/ContactNotesSection';
import { ContactTagsSection } from '@/features/contacts/components/ContactTagsSection';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useContact } from '@/features/contacts/hooks/useContact';
import { hasPermission } from '@/lib/auth';

interface ContactDetailViewProps {
  contactId: string;
}

export function ContactDetailView({ contactId }: ContactDetailViewProps) {
  const { user } = useAuth();
  const { data: contact, isLoading, isError } = useContact(contactId);
  const [editOpen, setEditOpen] = useState(false);

  const canWrite = user ? hasPermission(user.permissions, 'contacts:write') : false;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (isError || !contact) {
    return <p className="text-destructive">Contact not found or failed to load.</p>;
  }

  const displayName = [contact.firstName, contact.lastName].filter(Boolean).join(' ') || contact.phone;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Button variant="ghost" size="sm" asChild className="-ml-2 w-fit">
            <Link href="/contacts">
              <ArrowLeft className="h-4 w-4" />
              Back to contacts
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight">{displayName}</h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>{contact.phone}</span>
            {contact.email ? <span>· {contact.email}</span> : null}
            <Badge variant={contact.optOut ? 'failed' : 'running'}>
              {contact.optOut ? 'Opted out' : 'Active'}
            </Badge>
          </div>
          {contact.groups.length ? (
            <div className="flex flex-wrap gap-1">
              {contact.groups.map((group) => (
                <Badge key={group.id} variant="outline">
                  {group.name}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>
        {canWrite ? (
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
        ) : null}
      </div>

      <ContactTagsSection contact={contact} canWrite={canWrite} />
      <ContactNotesSection contact={contact} canWrite={canWrite} />

      <ContactForm
        open={editOpen}
        onOpenChange={setEditOpen}
        contact={contact}
        canWrite={canWrite}
      />
    </div>
  );
}
