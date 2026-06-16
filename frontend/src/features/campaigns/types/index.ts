export type CampaignStatus =
  | 'draft'
  | 'scheduled'
  | 'running'
  | 'paused'
  | 'stopped'
  | 'completed';

export interface Campaign {
  id: string;
  name: string;
  description: string | null;
  status: CampaignStatus;
  callerPhone: string;
  exotelFlowUrl: string | null;
  scheduleStart: string | null;
  scheduleEnd: string | null;
  timezone: string;
  maxConcurrentCalls: number;
  retryPolicy: Record<string, unknown> | null;
  aiAgent: { id: string; name: string };
  knowledgeBase: { id: string; name: string } | null;
  createdBy: { id: string; firstName: string; lastName: string; email: string };
  contactCount: number;
  callCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ImportContactsResult {
  message: string;
  campaignId: string;
  attached?: number;
  jobId?: string;
}
