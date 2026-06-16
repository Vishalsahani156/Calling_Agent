export type CallStatus =
  | 'initiated'
  | 'ringing'
  | 'in_progress'
  | 'completed'
  | 'failed'
  | 'busy'
  | 'no_answer'
  | 'canceled';

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
  campaign: { id: string; name: string } | null;
  contact: {
    id: string;
    phone: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
  aiAgent: { id: string; name: string } | null;
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
}

export interface CallDetail extends CallSummary {
  sentiment: Record<string, unknown>;
  transcripts: CallTranscriptEntry[];
}

export interface TestCallResult {
  callId: string;
  exotelCallSid: string;
  status: CallStatus;
  agent: string;
  phone: string;
  message: string;
}
