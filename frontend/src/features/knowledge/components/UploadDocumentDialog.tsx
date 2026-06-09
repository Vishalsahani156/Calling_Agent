'use client';

import { useState } from 'react';
import { Loader2, Upload } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUploadDocument } from '@/features/knowledge/hooks/useUploadDocument';

interface UploadDocumentDialogProps {
  knowledgeBaseId: string;
  canWrite: boolean;
}

export function UploadDocumentDialog({ knowledgeBaseId, canWrite }: UploadDocumentDialogProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const uploadMutation = useUploadDocument(knowledgeBaseId);

  if (!canWrite) return null;

  function handleUpload() {
    if (!file) return;
    uploadMutation.mutate(
      { file, title: title.trim() || undefined },
      {
        onSuccess: () => {
          setOpen(false);
          setFile(null);
          setTitle('');
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="h-4 w-4" />
          Upload file
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload document</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="kb-file">File (PDF or text)</Label>
            <Input
              id="kb-file"
              type="file"
              accept=".pdf,.txt,.md,text/plain,application/pdf"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="kb-title">Title (optional)</Label>
            <Input
              id="kb-title"
              placeholder="Defaults to filename"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleUpload} disabled={!file || uploadMutation.isPending}>
            {uploadMutation.isPending ? <Loader2 className="animate-spin" /> : 'Upload'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
