'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useRoles } from '@/features/users/hooks/useRoles';

interface RoleSelectProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  assignableOnly?: boolean;
}

export function RoleSelect({ value, onChange, disabled, assignableOnly = true }: RoleSelectProps) {
  const { data: roles, isLoading } = useRoles(assignableOnly);

  if (isLoading) {
    return <Skeleton className="h-9 w-full" />;
  }

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled || !roles?.length}>
      <SelectTrigger>
        <SelectValue placeholder="Select a role" />
      </SelectTrigger>
      <SelectContent>
        {roles?.map((role) => (
          <SelectItem key={role.id} value={role.id}>
            {role.name.replace(/_/g, ' ')}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
