'use client';

import { useState } from 'react';
import { Loader2, Tag } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAddContactTags } from '@/features/contacts/hooks/useAddContactTags';
import type { Contact } from '@/features/contacts/types';

interface ContactTagsSectionProps {
  contact: Contact;
  canWrite: boolean;
}

export function ContactTagsSection({ contact, canWrite }: ContactTagsSectionProps) {
  const [tagInput, setTagInput] = useState('');
  const addTagsMutation = useAddContactTags(contact.id);

  function handleAddTags() {
    const tags = tagInput
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
    if (!tags.length) return;

    addTagsMutation.mutate({ tags }, { onSuccess: () => setTagInput('') });
  }

  return (
    <section className="space-y-4 rounded-lg border p-6">
      <div className="flex items-center gap-2">
        <Tag className="h-4 w-4" />
        <h2 className="text-lg font-semibold">Tags</h2>
      </div>

      <div className="flex flex-wrap gap-2">
        {contact.tags.length ? (
          contact.tags.map((tag) => (
            <Badge key={tag.id} variant="secondary">
              {tag.name}
            </Badge>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No tags yet.</p>
        )}
      </div>

      {canWrite ? (
        <div className="flex gap-2">
          <Input
            placeholder="Add tags (comma-separated)"
            value={tagInput}
            onChange={(event) => setTagInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                handleAddTags();
              }
            }}
          />
          <Button onClick={handleAddTags} disabled={addTagsMutation.isPending}>
            {addTagsMutation.isPending ? <Loader2 className="animate-spin" /> : 'Add'}
          </Button>
        </div>
      ) : null}
    </section>
  );
}
