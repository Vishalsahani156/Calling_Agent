'use client';

import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

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
import { Switch } from '@/components/ui/switch';
import { useCreateContact } from '@/features/contacts/hooks/useCreateContact';
import { useGroups } from '@/features/contacts/hooks/useGroups';
import { useUpdateContact } from '@/features/contacts/hooks/useUpdateContact';
import { createContactSchema, updateContactSchema } from '@/features/contacts/schemas';
import type { Contact } from '@/features/contacts/types';

const createFormSchema = createContactSchema
  .extend({
    tagsInput: z.string().optional(),
  })
  .extend({
    email: z.union([z.string().email().max(255), z.literal('')]).optional(),
  });

type CreateFormValues = z.infer<typeof createFormSchema>;
type UpdateFormValues = z.infer<typeof updateContactSchema>;

interface ContactFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact?: Contact | null;
  canWrite: boolean;
}

export function ContactForm({ open, onOpenChange, contact, canWrite }: ContactFormProps) {
  const isEdit = !!contact;
  const createMutation = useCreateContact();
  const updateMutation = useUpdateContact();
  const { data: groupsData } = useGroups({ limit: '100' });

  const createForm = useForm<CreateFormValues>({
    resolver: zodResolver(createFormSchema),
    defaultValues: {
      phone: '',
      firstName: '',
      lastName: '',
      email: '',
      optOut: false,
      tagsInput: '',
      groupIds: [],
    },
  });

  const updateForm = useForm<UpdateFormValues>({
    resolver: zodResolver(updateContactSchema),
    defaultValues: {
      phone: '',
      firstName: '',
      lastName: '',
      email: '',
      optOut: false,
    },
  });

  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);

  useEffect(() => {
    if (contact && open) {
      updateForm.reset({
        phone: contact.phone,
        firstName: contact.firstName ?? '',
        lastName: contact.lastName ?? '',
        email: contact.email ?? '',
        optOut: contact.optOut,
      });
    }
    if (!contact && open) {
      createForm.reset();
      setSelectedGroups([]);
    }
  }, [contact, open, createForm, updateForm]);

  function handleOpenChange(next: boolean) {
    onOpenChange(next);
    if (!next) {
      createForm.reset();
      updateForm.reset();
      setSelectedGroups([]);
    }
  }

  function onCreateSubmit(values: CreateFormValues) {
    const tags = values.tagsInput
      ? values.tagsInput.split(',').map((t) => t.trim()).filter(Boolean)
      : undefined;

    createMutation.mutate(
      {
        phone: values.phone,
        firstName: values.firstName || undefined,
        lastName: values.lastName || undefined,
        email: values.email || undefined,
        optOut: values.optOut,
        tags,
        groupIds: selectedGroups.length ? selectedGroups : undefined,
      },
      { onSuccess: () => handleOpenChange(false) },
    );
  }

  function onUpdateSubmit(values: UpdateFormValues) {
    if (!contact) return;
    updateMutation.mutate(
      {
        id: contact.id,
        input: {
          phone: values.phone,
          firstName: values.firstName === '' ? null : values.firstName,
          lastName: values.lastName === '' ? null : values.lastName,
          email: values.email === '' ? null : values.email,
          optOut: values.optOut,
        },
      },
      { onSuccess: () => handleOpenChange(false) },
    );
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit contact' : 'Add contact'}</DialogTitle>
        </DialogHeader>

        {isEdit ? (
          <Form {...updateForm}>
            <form onSubmit={updateForm.handleSubmit(onUpdateSubmit)} className="space-y-4">
              <FormField
                control={updateForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input disabled={!canWrite} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={updateForm.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First name</FormLabel>
                      <FormControl>
                        <Input disabled={!canWrite} {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={updateForm.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last name</FormLabel>
                      <FormControl>
                        <Input disabled={!canWrite} {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={updateForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" disabled={!canWrite} {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={updateForm.control}
                name="optOut"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <FormLabel>Opted out</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} disabled={!canWrite} />
                    </FormControl>
                  </FormItem>
                )}
              />
              {canWrite ? (
                <DialogFooter>
                  <Button type="submit" disabled={isPending}>
                    {isPending ? <Loader2 className="animate-spin" /> : 'Save changes'}
                  </Button>
                </DialogFooter>
              ) : null}
            </form>
          </Form>
        ) : (
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
              <FormField
                control={createForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="+91XXXXXXXXXX" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={createForm.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={createForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="tagsInput"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags (comma-separated)</FormLabel>
                    <FormControl>
                      <Input placeholder="lead, vip, follow-up" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {groupsData?.data.length ? (
                <FormItem>
                  <FormLabel>Groups</FormLabel>
                  <div className="max-h-32 space-y-2 overflow-y-auto rounded-md border p-3">
                    {groupsData.data.map((group) => (
                      <label key={group.id} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={selectedGroups.includes(group.id)}
                          onChange={(event) => {
                            setSelectedGroups((prev) =>
                              event.target.checked
                                ? [...prev, group.id]
                                : prev.filter((id) => id !== group.id),
                            );
                          }}
                        />
                        {group.name}
                      </label>
                    ))}
                  </div>
                </FormItem>
              ) : null}
              <FormField
                control={createForm.control}
                name="optOut"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <FormLabel>Opted out</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={isPending}>
                  {isPending ? <Loader2 className="animate-spin" /> : 'Create contact'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
