'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, MessageSquare } from 'lucide-react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useAddContactNote } from '@/features/contacts/hooks/useAddContactNote';
import { createNoteSchema, type CreateNoteInput } from '@/features/contacts/schemas';
import type { Contact } from '@/features/contacts/types';

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface ContactNotesSectionProps {
  contact: Contact;
  canWrite: boolean;
}

export function ContactNotesSection({ contact, canWrite }: ContactNotesSectionProps) {
  const addNoteMutation = useAddContactNote(contact.id);

  const form = useForm<CreateNoteInput>({
    resolver: zodResolver(createNoteSchema),
    defaultValues: { note: '' },
  });

  function onSubmit(values: CreateNoteInput) {
    addNoteMutation.mutate(values, { onSuccess: () => form.reset() });
  }

  return (
    <section className="space-y-4 rounded-lg border p-6">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-4 w-4" />
        <h2 className="text-lg font-semibold">Notes</h2>
      </div>

      <div className="space-y-3">
        {contact.notes?.length ? (
          contact.notes.map((note) => (
            <div key={note.id} className="rounded-md border bg-muted/30 p-4">
              <p className="text-sm">{note.note}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {note.author.firstName} {note.author.lastName} · {formatDateTime(note.createdAt)}
              </p>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No notes yet.</p>
        )}
      </div>

      {canWrite ? (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Add note</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Write a note about this contact..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={addNoteMutation.isPending}>
              {addNoteMutation.isPending ? <Loader2 className="animate-spin" /> : 'Add note'}
            </Button>
          </form>
        </Form>
      ) : null}
    </section>
  );
}
