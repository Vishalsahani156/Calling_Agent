import { CallStatus, Prisma } from '@prisma/client';
import { webhooksRepository } from './webhooks.repository';
import { NotFoundError } from '../../shared/errors/app.error';
import { eventBus, AppEvents } from '../../events/event-bus';
import { enqueuePostCall } from '../../jobs/queues';
import { isEscalationRequested } from '../../voice/conversation-store';

const TERMINAL_STATUSES: CallStatus[] = [
  CallStatus.completed,
  CallStatus.failed,
  CallStatus.busy,
  CallStatus.no_answer,
  CallStatus.canceled,
];

function mapExotelStatus(status: string): CallStatus | null {
  const normalized = status.toLowerCase().replace(/-/g, '_');
  const mapping: Record<string, CallStatus> = {
    queued: CallStatus.initiated,
    initiated: CallStatus.initiated,
    ringing: CallStatus.ringing,
    in_progress: CallStatus.in_progress,
    inprogress: CallStatus.in_progress,
    completed: CallStatus.completed,
    busy: CallStatus.busy,
    failed: CallStatus.failed,
    no_answer: CallStatus.no_answer,
    noanswer: CallStatus.no_answer,
    canceled: CallStatus.canceled,
    cancelled: CallStatus.canceled,
  };
  return mapping[normalized] ?? null;
}

function parseDuration(value: string | number | undefined): number | undefined {
  if (value === undefined) return undefined;
  const parsed = typeof value === 'number' ? value : parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export class WebhooksService {
  async handleExotelStatus(payload: Record<string, unknown>) {
    const callSid = String(payload.CallSid ?? '');
    const rawStatus = String(payload.Status ?? '');

    if (!callSid || !rawStatus) {
      return { acknowledged: false, message: 'Missing CallSid or Status' };
    }

    const call = await webhooksRepository.findCallByExotelSid(callSid);
    if (!call) {
      throw new NotFoundError('Call not found for CallSid');
    }

    const status = mapExotelStatus(rawStatus);
    if (!status) {
      await webhooksRepository.createCallLog(
        call.id,
        'exotel.status.unmapped',
        payload as Prisma.InputJsonValue,
      );
      return { acknowledged: true, callId: call.id, message: `Unmapped status: ${rawStatus}` };
    }

    const now = new Date();
    const durationSeconds = parseDuration(
      payload.Duration as string | number | undefined,
    );
    const updateData: {
      status: CallStatus;
      endedAt?: Date;
      durationSeconds?: number;
      answeredAt?: Date;
      startedAt?: Date;
    } = { status };

    if (status === CallStatus.ringing && !call.startedAt) {
      updateData.startedAt = now;
    }
    if (status === CallStatus.in_progress && !call.answeredAt) {
      updateData.answeredAt = now;
    }
    if (TERMINAL_STATUSES.includes(status)) {
      updateData.endedAt = now;
      if (durationSeconds !== undefined) {
        updateData.durationSeconds = durationSeconds;
      }
    }

    const updated = await webhooksRepository.updateCallStatus(call.id, updateData);

    if (typeof payload.RecordingUrl === 'string') {
      await webhooksRepository.upsertRecording(call.id, {
        exotelRecordingUrl: payload.RecordingUrl,
        durationSeconds,
      });
    }

    await webhooksRepository.createCallLog(
      call.id,
      'exotel.status',
      payload as Prisma.InputJsonValue,
    );

    if (TERMINAL_STATUSES.includes(status)) {
      eventBus.emit(AppEvents.CALL_COMPLETED, { callId: call.id, status });
      await enqueuePostCall({
        callId: call.id,
        organizationId: call.organizationId,
      });
    }

    return {
      acknowledged: true,
      callId: updated.id,
      status: updated.status,
    };
  }

  async handlePassthruGet(query: Record<string, unknown>) {
    const callSid = query.CallSid ? String(query.CallSid) : undefined;

    if (callSid) {
      const call = await webhooksRepository.findCallByExotelSid(callSid);
      if (call) {
        const escalate = await isEscalationRequested(call.id);
        if (escalate) {
          return {
            action: 'escalate',
            escalate: true,
            callSid,
            callId: call.id,
            message: 'Escalation requested during AI conversation',
          };
        }
      }
    }

    return {
      action: 'continue',
      escalate: false,
      callSid,
      message: 'No escalation required',
    };
  }

  async handlePassthruPost(payload: Record<string, unknown>) {
    const callSid = payload.CallSid ? String(payload.CallSid) : undefined;

    if (callSid) {
      const call = await webhooksRepository.findCallByExotelSid(callSid);
      if (call) {
        await webhooksRepository.createCallLog(
          call.id,
          'exotel.passthru',
          payload as Prisma.InputJsonValue,
        );
      }
    }

    return {
      acknowledged: true,
      action: 'continue',
      callSid,
    };
  }
}

export const webhooksService = new WebhooksService();
