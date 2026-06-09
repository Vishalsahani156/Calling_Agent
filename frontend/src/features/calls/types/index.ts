import type { CallStatus } from '@/features/calls/schemas';

export interface CallCampaign {
  id: string;
  name: string;
}

export interface CallContact {
  id: string;
  phone: string;
  firstName: string | null;
  lastName: string | null;
}

export interface CallAgent {
  id: string;
  name: string;
}

export interface CallSummary {
  id: string;
  exotelCallSid: string | null;
  direction: string;
  status: CallStatus;
  startedAt: string | null;
  answeredAt: string | null;
  endedAt: string | null;
  durationSeconds: number | null;
  languageDetected: string | null;
  leadQualified: boolean;
  disposition: string | null;
  summary: string | null;
  campaign: CallCampaign | null;
  contact: CallContact | null;
  aiAgent: CallAgent | null;
  hasRecording: boolean;
  createdAt: string;
}

export interface CallTranscriptEntry {
  id: string;
  speaker: string;
  text: string;
  language: string | null;
  confidence: number | null;
  startMs: number;
  endMs: number;
  sequence: number;
  createdAt?: string;
}

export interface CallDetail extends CallSummary {
  sentiment: string | null;
  transcripts: CallTranscriptEntry[];
}

export interface CallTranscriptResponse {
  callId: string;
  transcripts: CallTranscriptEntry[];
}

export interface CallRecording {
  id: string;
  url: string | null;
  storageUrl: string | null;
  exotelRecordingUrl: string | null;
  durationSeconds: number | null;
  format: string | null;
}

export interface CallRecordingResponse {
  callId: string;
  recording: CallRecording;
}

export interface LiveCallsResponse {
  count: number;
  calls: CallSummary[];
}

export interface LiveCallsSnapshotMessage {
  type: 'snapshot';
  count: number;
  calls: CallSummary[];
}

export interface LiveCallsUpdateMessage {
  type: 'live_update';
  event: string;
  payload: unknown;
  count: number;
  calls: CallSummary[];
}

export type LiveCallsWsMessage = LiveCallsSnapshotMessage | LiveCallsUpdateMessage;
