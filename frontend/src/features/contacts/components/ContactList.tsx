'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Eye, Loader2, Pencil, Plus, Search, Trash2 } from 'lucide-react';

import { TablePagination } from '@/components/shared/table-pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ContactForm } from '@/features/contacts/components/ContactForm';
import { ExportContactsButton } from '@/features/contacts/components/ExportContactsButton';
import { ImportContactsDialog } from '@/features/contacts/components/ImportContactsDialog';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useContactTagOptions } from '@/features/contacts/hooks/useContactTagOptions';
import { useContacts } from '@/features/contacts/hooks/useContacts';
import { useDeleteContact } from '@/features/contacts/hooks/useDeleteContact';
import { useGroups } from '@/features/contacts/hooks/useGroups';
import type { Contact } from '@/features/contacts/types';
import { hasPermission } from '@/lib/auth';
import type { ListContactsQuery } from '@/features/contacts/schemas';

function contactName(contact: Contact): string {
  const name = [contact.firstName, contact.lastName].filter(Boolean).join(' ');
  return name || '—';
}

export function ContactList() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [tagId, setTagId] = useState<string>('all');
  const [groupId, setGroupId] = useState<string>('all');
  const [optOut, setOptOut] = useState<string>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [deletingContact, setDeletingContact] = useState<Contact | null>(null);

  const canWrite = user ? hasPermission(user.permissions, 'contacts:write') : false;
  const canDelete = user ? hasPermission(user.permissions, 'contacts:delete') : false;
  const canRead = user ? hasPermission(user.permissions, 'contacts:read') : false;

  const deleteMutation = useDeleteContact();
  const { data: tagOptions } = useContactTagOptions();
  const { data: groupsData } = useGroups({ limit: '100' });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const query: ListContactsQuery = {
    page: String(page),
    limit: '20',
    search: debouncedSearch || undefined,
    tagId: tagId !== 'all' ? tagId : undefined,
    groupId: groupId !== 'all' ? groupId : undefined,
    optOut: optOut === 'all' ? undefined : (optOut as 'true' | 'false'),
  };

  const { data, isLoading, isError } = useContacts(query);

  const exportFilters = {
    search: query.search,
    tagId: query.tagId,
    groupId: query.groupId,
    optOut: query.optOut,
  };

  function handleDeleteConfirm() {
    if (!deletingContact) return;
    deleteMutation.mutate(deletingContact.id, {
      onSuccess: () => setDeletingContact(null),
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {canWrite ? (
            <Button
              onClick={() => {
                setEditingContact(null);
                setFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Add contact
            </Button>
          ) : null}
          <ImportContactsDialog canWrite={canWrite} />
          <ExportContactsButton filters={exportFilters} canRead={canRead} />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Select
          value={tagId}
          onValueChange={(value) => {
            setTagId(value);
            setPage(1);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="All tags" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All tags</SelectItem>
            {tagOptions?.map((tag) => (
              <SelectItem key={tag.id} value={tag.id}>
                {tag.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={groupId}
          onValueChange={(value) => {
            setGroupId(value);
            setPage(1);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="All groups" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All groups</SelectItem>
            {groupsData?.data.map((group) => (
              <SelectItem key={group.id} value={group.id}>
                {group.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={optOut}
          onValueChange={(value) => {
            setOptOut(value);
            setPage(1);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Opt-out status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All contacts</SelectItem>
            <SelectItem value="false">Not opted out</SelectItem>
            <SelectItem value="true">Opted out</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  {Array.from({ length: 6 }).map((__, cellIndex) => (
                    <TableCell key={cellIndex}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-destructive">
                  Failed to load contacts.
                </TableCell>
              </TableRow>
            ) : !data?.data.length ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No contacts found.
                </TableCell>
              </TableRow>
            ) : (
              data.data.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell className="font-medium">{contactName(contact)}</TableCell>
                  <TableCell>{contact.phone}</TableCell>
                  <TableCell>{contact.email ?? '—'}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {contact.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag.id} variant="secondary">
                          {tag.name}
                        </Badge>
                      ))}
                      {contact.tags.length > 3 ? (
                        <Badge variant="outline">+{contact.tags.length - 3}</Badge>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={contact.optOut ? 'failed' : 'running'}>
                      {contact.optOut ? 'Opted out' : 'Active'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" asChild aria-label="View contact">
                        <Link href={`/contacts/${contact.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      {canWrite ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Edit contact"
                          onClick={() => {
                            setEditingContact(contact);
                            setFormOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      ) : null}
                      {canDelete ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Delete contact"
                          onClick={() => setDeletingContact(contact)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {data?.meta ? <TablePagination meta={data.meta} onPageChange={setPage} /> : null}

      <ContactForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingContact(null);
        }}
        contact={editingContact}
        canWrite={canWrite}
      />

      <Dialog open={!!deletingContact} onOpenChange={(open) => !open && setDeletingContact(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete contact</DialogTitle>
            <DialogDescription>
              Delete <strong>{deletingContact?.phone}</strong>? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingContact(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? <Loader2 className="animate-spin" /> : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
