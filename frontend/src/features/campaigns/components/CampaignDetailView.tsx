'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, Pause, Play, Square, UserPlus } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useCampaign } from '@/features/campaigns/hooks/useCampaign';
import { useCampaignAction } from '@/features/campaigns/hooks/useCampaignAction';
import { useImportCampaignContacts } from '@/features/campaigns/hooks/useImportCampaignContacts';
import { useContacts } from '@/features/contacts/hooks/useContacts';

interface CampaignDetailViewProps {
  campaignId: string;
  canWrite: boolean;
}

export function CampaignDetailView({ campaignId, canWrite }: CampaignDetailViewProps) {
  const { data: campaign, isLoading, isError } = useCampaign(campaignId);
  const { data: contacts } = useContacts({ limit: '100' });
  const actionMutation = useCampaignAction();
  const importMutation = useImportCampaignContacts(campaignId);
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (isError || !campaign) {
    return <p className="text-destructive">Campaign not found or failed to load.</p>;
  }

  function toggleContact(contactId: string, checked: boolean) {
    setSelectedContactIds((prev) =>
      checked ? [...prev, contactId] : prev.filter((id) => id !== contactId),
    );
  }

  function handleImportContacts() {
    if (selectedContactIds.length === 0) return;
    importMutation.mutate(
      { contactIds: selectedContactIds },
      { onSuccess: () => setSelectedContactIds([]) },
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <Button variant="ghost" size="sm" asChild className="-ml-2 w-fit">
            <Link href="/campaigns">
              <ArrowLeft className="h-4 w-4" />
              Back to campaigns
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight">{campaign.name}</h1>
          <div className="flex flex-wrap gap-2">
            <Badge className="capitalize">{campaign.status}</Badge>
            <Badge variant="outline">{campaign.contactCount} contacts</Badge>
            <Badge variant="outline">{campaign.callCount} calls</Badge>
          </div>
        </div>

        {canWrite ? (
          <div className="flex flex-wrap gap-2">
            {['draft', 'scheduled', 'paused', 'stopped'].includes(campaign.status) ? (
              <Button
                onClick={() => actionMutation.mutate({ id: campaignId, action: 'start' })}
                disabled={actionMutation.isPending}
              >
                {actionMutation.isPending ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                Start campaign
              </Button>
            ) : null}
            {campaign.status === 'running' ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => actionMutation.mutate({ id: campaignId, action: 'pause' })}
                  disabled={actionMutation.isPending}
                >
                  <Pause className="h-4 w-4" />
                  Pause
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => actionMutation.mutate({ id: campaignId, action: 'stop' })}
                  disabled={actionMutation.isPending}
                >
                  <Square className="h-4 w-4" />
                  Stop
                </Button>
              </>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Campaign details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              <span className="font-medium">Agent:</span> {campaign.aiAgent.name}
            </p>
            <p>
              <span className="font-medium">Caller ID:</span> {campaign.callerPhone}
            </p>
            <p>
              <span className="font-medium">Max concurrent:</span> {campaign.maxConcurrentCalls}
            </p>
            {campaign.description ? (
              <p className="whitespace-pre-wrap text-muted-foreground">{campaign.description}</p>
            ) : null}
          </CardContent>
        </Card>

        {canWrite ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Add contacts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="max-h-64 space-y-2 overflow-y-auto rounded-md border p-3">
                {contacts?.data.length ? (
                  contacts.data.map((contact) => (
                    <label
                      key={contact.id}
                      className="flex cursor-pointer items-center gap-3 rounded-md p-2 hover:bg-muted"
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border border-input"
                        checked={selectedContactIds.includes(contact.id)}
                        onChange={(event) =>
                          toggleContact(contact.id, event.target.checked)
                        }
                      />
                      <span className="text-sm">
                        {contact.firstName || contact.lastName
                          ? `${contact.firstName ?? ''} ${contact.lastName ?? ''}`.trim()
                          : contact.phone}
                        <span className="ml-2 text-muted-foreground">{contact.phone}</span>
                      </span>
                    </label>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No contacts yet.{' '}
                    <Link href="/contacts" className="text-primary underline">
                      Add contacts
                    </Link>{' '}
                    first.
                  </p>
                )}
              </div>
              <Button
                onClick={handleImportContacts}
                disabled={importMutation.isPending || selectedContactIds.length === 0}
              >
                {importMutation.isPending ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
                Add {selectedContactIds.length || ''} contact
                {selectedContactIds.length === 1 ? '' : 's'}
              </Button>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
