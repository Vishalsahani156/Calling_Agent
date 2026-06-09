'use client';

import { useState } from 'react';

import { PermissionGuard } from '@/components/shared/permission-guard';
import { ContactList } from '@/features/contacts/components/ContactList';
import { GroupsManagement } from '@/features/contacts/components/GroupsManagement';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { hasPermission } from '@/lib/auth';
import { cn } from '@/lib/utils';

type Tab = 'contacts' | 'groups';

export function ContactsPageContent() {
  const [tab, setTab] = useState<Tab>('contacts');
  const { user } = useAuth();
  const canWrite = user ? hasPermission(user.permissions, 'contacts:write') : false;

  return (
    <PermissionGuard permission="contacts:read">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Contacts</h1>
          <p className="text-sm text-muted-foreground">
            Manage contacts, groups, tags, and import/export lists.
          </p>
        </div>

        <div className="flex gap-2 border-b">
          {(['contacts', 'groups'] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setTab(value)}
              className={cn(
                'border-b-2 px-4 py-2 text-sm font-medium capitalize transition-colors',
                tab === value
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {value}
            </button>
          ))}
        </div>

        {tab === 'contacts' ? <ContactList /> : <GroupsManagement canWrite={canWrite} />}
      </div>
    </PermissionGuard>
  );
}
