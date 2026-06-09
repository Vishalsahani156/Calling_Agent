'use client';

import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { useCreateFaq } from '@/features/knowledge/hooks/useCreateFaq';
import { useUpdateFaq } from '@/features/knowledge/hooks/useUpdateFaq';
import { createFaqSchema, updateFaqSchema } from '@/features/knowledge/schemas';
import type { CreateFaqInput, UpdateFaqInput } from '@/features/knowledge/schemas';
import type { Faq } from '@/features/knowledge/types';

interface FaqFormDialogProps {
  knowledgeBaseId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  faq?: Faq | null;
  defaultLanguage?: string;
}

export function FaqFormDialog({
  knowledgeBaseId,
  open,
  onOpenChange,
  faq,
  defaultLanguage = 'en',
}: FaqFormDialogProps) {
  const isEdit = !!faq;
  const createMutation = useCreateFaq(knowledgeBaseId);
  const updateMutation = useUpdateFaq(knowledgeBaseId);

  const createForm = useForm<CreateFaqInput>({
    resolver: zodResolver(createFaqSchema),
    defaultValues: { question: '', answer: '', language: defaultLanguage },
  });

  const updateForm = useForm<UpdateFaqInput>({
    resolver: zodResolver(updateFaqSchema),
    defaultValues: { question: '', answer: '', language: defaultLanguage },
  });

  useEffect(() => {
    if (faq && open) {
      updateForm.reset({
        question: faq.question,
        answer: faq.answer,
        language: faq.language,
      });
    }
    if (!faq && open) {
      createForm.reset({ question: '', answer: '', language: defaultLanguage });
    }
  }, [faq, open, createForm, updateForm, defaultLanguage]);

  function handleClose() {
    onOpenChange(false);
    createForm.reset();
    updateForm.reset();
  }

  function onCreateSubmit(values: CreateFaqInput) {
    createMutation.mutate(values, { onSuccess: handleClose });
  }

  function onUpdateSubmit(values: UpdateFaqInput) {
    if (!faq) return;
    updateMutation.mutate({ faqId: faq.id, input: values }, { onSuccess: handleClose });
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit FAQ' : 'Add FAQ'}</DialogTitle>
        </DialogHeader>

        {isEdit ? (
          <Form {...updateForm}>
            <form onSubmit={updateForm.handleSubmit(onUpdateSubmit)} className="space-y-4">
              <FormField
                control={updateForm.control}
                name="question"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Question</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={updateForm.control}
                name="answer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Answer</FormLabel>
                    <FormControl>
                      <Textarea rows={5} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={updateForm.control}
                name="language"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Language</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={isPending}>
                  {isPending ? <Loader2 className="animate-spin" /> : 'Save'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        ) : (
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
              <FormField
                control={createForm.control}
                name="question"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Question</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="answer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Answer</FormLabel>
                    <FormControl>
                      <Textarea rows={5} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="language"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Language</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={isPending}>
                  {isPending ? <Loader2 className="animate-spin" /> : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
