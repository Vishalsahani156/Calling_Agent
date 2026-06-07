import type { CallStatus } from '@prisma/client';
import { prisma } from '../../config/database';
import { eventBus, AppEvents } from '../../events/event-bus';
import {
  enqueuePostCall,
  enqueueRecordingSync,
} from '../../jobs/queues';
import { scheduleRetryForCall } from '../campaigns/call-retry.service';

const TERMINAL_STATUSES: CallStatus[] = [
  'completed',
  'failed',
  'busy',
  'no_answer',
  'canceled',
];

interface CallCompletionInput {
  callId: string;
  organizationId: string;
  status: CallStatus;
}

export class CallCompletionService {
  async handleCallEnded(input: CallCompletionInput): Promise<{
    postCallEnqueued: boolean;
    recordingSyncEnqueued: boolean;
    retryScheduled: boolean;
  }> {
    if (!TERMINAL_STATUSES.includes(input.status)) {
      return {
        postCallEnqueued: false,
        recordingSyncEnqueued: false,
        retryScheduled: false,
      };
    }

    const call = await prisma.call.findFirst({
      where: { id: input.callId, organizationId: input.organizationId },
      include: { recording: true },
    });

    if (!call) {
      return {
        postCallEnqueued: false,
        recordingSyncEnqueued: false,
        retryScheduled: false,
      };
    }

    await enqueuePostCall({
      callId: call.id,
      organizationId: call.organizationId,
    });

    let recordingSyncEnqueued = false;
    if (call.recording?.exotelRecordingUrl && !call.recording.storageUrl) {
      await enqueueRecordingSync({
        callId: call.id,
        organizationId: call.organizationId,
      });
      recordingSyncEnqueued = true;
    }

    const retryResult = await scheduleRetryForCall({
      callId: call.id,
      organizationId: call.organizationId,
      status: call.status,
    });

    eventBus.emit(AppEvents.CALL_COMPLETED, { callId: call.id, status: call.status });

    return {
      postCallEnqueued: true,
      recordingSyncEnqueued,
      retryScheduled: retryResult.action === 'scheduled',
    };
  }
}

export const callCompletionService = new CallCompletionService();
