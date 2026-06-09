'use client';

import { useState } from 'react';
import { Loader2, Upload } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useGroups } from '@/features/contacts/hooks/useGroups';
import { useImportContacts } from '@/features/contacts/hooks/useImportContacts';

interface ImportContactsDialogProps {
  canWrite: boolean;
}

export function ImportContactsDialog({ canWrite }: ImportContactsDialogProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [groupId, setGroupId] = useState<string>('none');

  const importMutation = useImportContacts();
  const { data: groupsData } = useGroups({ limit: '100' });

  if (!canWrite) return null;

  function handleImport() {
    if (!file) return;
    importMutation.mutate(
      {
        file,
        options: {
          skipDuplicates,
          groupId: groupId !== 'none' ? groupId : undefined,
        },
      },
      {
        onSuccess: () => {
          setOpen(false);
          setFile(null);
          setGroupId('none');
          setSkipDuplicates(true);
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="h-4 w-4" />
          Import CSV
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import contacts</DialogTitle>
          <DialogDescription>
            Upload a CSV with columns: phone, first_name, last_name, email, opt_out
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="csv-file">CSV file</Label>
            <Input
              id="csv-file"
              type="file"
              accept=".csv,text/csv"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <Label htmlFor="skip-duplicates">Skip duplicate phones</Label>
            <Switch id="skip-duplicates" checked={skipDuplicates} onCheckedChange={setSkipDuplicates} />
          </div>

          <div className="space-y-2">
            <Label>Assign to group (optional)</Label>
            <Select value={groupId} onValueChange={setGroupId}>
              <SelectTrigger>
                <SelectValue placeholder="No group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No group</SelectItem>
                {groupsData?.data.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleImport} disabled={!file || importMutation.isPending}>
            {importMutation.isPending ? <Loader2 className="animate-spin" /> : 'Import'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
