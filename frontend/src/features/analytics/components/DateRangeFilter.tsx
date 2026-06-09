'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface DateRangeFilterProps {
  fromLocal: string;
  toLocal: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
}

export function DateRangeFilter({
  fromLocal,
  toLocal,
  onFromChange,
  onToChange,
}: DateRangeFilterProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="analytics-from">From</Label>
        <Input
          id="analytics-from"
          type="datetime-local"
          value={fromLocal}
          onChange={(event) => onFromChange(event.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="analytics-to">To</Label>
        <Input
          id="analytics-to"
          type="datetime-local"
          value={toLocal}
          onChange={(event) => onToChange(event.target.value)}
        />
      </div>
    </div>
  );
}
