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
import { Switch } from '@/components/ui/switch';
import { RoleSelect } from '@/features/users/components/RoleSelect';
import { useRoles } from '@/features/users/hooks/useRoles';
import { useUpdateUser } from '@/features/users/hooks/useUpdateUser';
import { updateUserSchema } from '@/features/users/schemas';
import type { UpdateUserInput } from '@/features/users/schemas';
import type { UserListItem } from '@/features/users/types';

interface EditUserDialogProps {
  user: UserListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canUpdate: boolean;
}

export function EditUserDialog({ user, open, onOpenChange, canUpdate }: EditUserDialogProps) {
  const updateMutation = useUpdateUser();
  const { data: roles } = useRoles();

  const form = useForm<UpdateUserInput>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      phone: '',
      roleId: '',
      isActive: true,
    },
  });

  useEffect(() => {
    if (user && roles) {
      const matchedRole = roles.find((role) => role.name === user.role.name);
      form.reset({
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone ?? '',
        roleId: matchedRole?.id ?? '',
        isActive: user.isActive,
      });
    }
  }, [user, roles, form]);

  if (!user) return null;

  function onSubmit(values: UpdateUserInput) {
    updateMutation.mutate(
      {
        id: user!.id,
        input: {
          firstName: values.firstName,
          lastName: values.lastName,
          phone: values.phone?.trim() || undefined,
          roleId: values.roleId || undefined,
          isActive: values.isActive,
        },
      },
      { onSuccess: () => onOpenChange(false) },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit user</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First name</FormLabel>
                    <FormControl>
                      <Input disabled={!canUpdate} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last name</FormLabel>
                    <FormControl>
                      <Input disabled={!canUpdate} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input type="tel" disabled={!canUpdate} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="roleId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <FormControl>
                    <RoleSelect value={field.value ?? ''} onChange={field.onChange} disabled={!canUpdate} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <FormLabel>Active</FormLabel>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={!canUpdate}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {canUpdate ? (
              <DialogFooter>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? <Loader2 className="animate-spin" /> : 'Save changes'}
                </Button>
              </DialogFooter>
            ) : null}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
