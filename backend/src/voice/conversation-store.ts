import { callsRepository } from '../modules/calls/calls.repository';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class ConversationStore {
  private readonly callId: string;
  private readonly enabled: boolean;

  constructor(callId: string) {
    this.callId = callId;
    this.enabled = UUID_RE.test(callId);
  }

  async setEscalationRequested(reason: string): Promise<void> {
    if (!this.enabled) {
      return;
    }

    await callsRepository.upsertConversationMemory(this.callId, 'escalation_requested', {
      requested: true,
      reason,
      requestedAt: new Date().toISOString(),
    });
  }

  async setLeadQualified(details: Record<string, unknown>): Promise<void> {
    if (!this.enabled) {
      return;
    }

    await Promise.all([
      callsRepository.upsertConversationMemory(this.callId, 'lead_qualification', {
        qualified: true,
        ...details,
        qualifiedAt: new Date().toISOString(),
      }),
      callsRepository.updateCallFields(this.callId, { leadQualified: true }),
    ]);
  }

  async setDetectedLanguage(language: string): Promise<void> {
    if (!this.enabled) {
      return;
    }

    await Promise.all([
      callsRepository.upsertConversationMemory(this.callId, 'detected_language', {
        language,
        detectedAt: new Date().toISOString(),
      }),
      callsRepository.updateCallFields(this.callId, { languageDetected: language }),
    ]);
  }
}

export async function isEscalationRequested(callId: string): Promise<boolean> {
  const memory = await callsRepository.getConversationMemory(callId, 'escalation_requested');
  if (!memory?.value || typeof memory.value !== 'object') {
    return false;
  }

  const value = memory.value as { requested?: boolean };
  return value.requested === true;
}
