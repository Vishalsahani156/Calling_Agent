export type {
  CreateContactInput,
  UpdateContactInput,
  ListContactsQuery,
  ExportContactsQuery,
  ImportContactsInput,
  CreateNoteInput,
  CreateTagInput,
  CreateGroupInput,
  ListGroupsQuery,
} from '@/features/contacts/schemas';

export interface ContactTag {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContactGroup {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ContactNote {
  id: string;
  note: string;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  id: string;
  phone: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  metadata: Record<string, unknown>;
  optOut: boolean;
  tags: ContactTag[];
  groups: ContactGroup[];
  notes?: ContactNote[];
  createdAt: string;
  updatedAt: string;
}

export interface ImportContactsResponse {
  jobId: string;
  status: string;
  message: string;
}
