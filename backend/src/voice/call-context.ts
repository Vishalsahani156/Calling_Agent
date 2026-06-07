import type { RetrievalResult } from '../modules/knowledge/knowledge.types';
import { knowledgeService } from '../modules/knowledge/knowledge.service';
import { callsRepository } from '../modules/calls/calls.repository';
import type { TranscriptSpeaker } from '@prisma/client';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface CampaignContext {
  name: string;
  description: string | null;
}

export interface RagRetriever {
  retrieve(query: string): Promise<RetrievalResult>;
}

export interface TranscriptWriter {
  append(speaker: TranscriptSpeaker, text: string, language?: string): Promise<void>;
}

export function buildCampaignPrompt(context: CampaignContext): string {
  const lines = [`Campaign: ${context.name}`];
  if (context.description?.trim()) {
    lines.push(`Offer context: ${context.description.trim()}`);
  }
  return lines.join('\n');
}

export function createRagRetriever(
  knowledgeBaseId: string,
  organizationId: string,
  language?: string,
): RagRetriever {
  return {
    async retrieve(query: string) {
      return knowledgeService.retrieveForQuery(knowledgeBaseId, organizationId, query, {
        language,
      });
    },
  };
}

export function createTranscriptWriter(callId: string): TranscriptWriter | null {
  if (!UUID_RE.test(callId)) {
    return null;
  }

  let sequence = -1;
  const callStartedAt = Date.now();

  return {
    async append(speaker: TranscriptSpeaker, text: string, language?: string) {
      const trimmed = text.trim();
      if (!trimmed) {
        return;
      }

      if (sequence < 0) {
        sequence = await callsRepository.getNextTranscriptSequence(callId);
      } else {
        sequence += 1;
      }

      const elapsedMs = Date.now() - callStartedAt;
      await callsRepository.createTranscript(callId, {
        speaker,
        text: trimmed,
        sequence,
        startMs: elapsedMs,
        endMs: elapsedMs,
        language,
      });
    },
  };
}

export function formatKbContext(retrieval: RetrievalResult): string | null {
  if (retrieval.chunks.length === 0) {
    return null;
  }

  return retrieval.chunks
    .map((chunk, index) => `[${index + 1}] ${chunk.content}`)
    .join('\n\n');
}
