'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { FileText, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useCreateDocument } from '@/features/knowledge/hooks/useCreateDocument';
import { createDocumentSchema } from '@/features/knowledge/schemas';

const manualDocumentSchema = createDocumentSchema.extend({
  sourceType: z.literal('manual'),
});

type ManualDocumentFormValues = z.infer<typeof manualDocumentSchema>;

interface CreateManualDocumentDialogProps {
  knowledgeBaseId: string;
  canWrite: boolean;
}

export function CreateManualDocumentDialog({
  knowledgeBaseId,
  canWrite,
}: CreateManualDocumentDialogProps) {
  const [open, setOpen] = useState(false);
  const createMutation = useCreateDocument(knowledgeBaseId);

  const form = useForm<ManualDocumentFormValues>({
    resolver: zodResolver(manualDocumentSchema),
    defaultValues: {
      title: '',
      rawContent: '',
      sourceType: 'manual',
    },
  });

  if (!canWrite) return null;

  function onSubmit(values: ManualDocumentFormValues) {
    createMutation.mutate(values, {
      onSuccess: () => {
        setOpen(false);
        form.reset();
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <FileText className="h-4 w-4" />
          Add text
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add manual document</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="rawContent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <Textarea rows={10} placeholder="Paste document text..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? <Loader2 className="animate-spin" /> : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
