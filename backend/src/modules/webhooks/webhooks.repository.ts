import { CallStatus, Prisma } from '@prisma/client';
import { prisma } from '../../config/database';

export class WebhooksRepository {
  findCallByExotelSid(exotelCallSid: string) {
    return prisma.call.findUnique({
      where: { exotelCallSid },
      include: { recording: true },
    });
  }

  updateCallStatus(
    callId: string,
    data: {
      status: CallStatus;
      endedAt?: Date;
      durationSeconds?: number;
      answeredAt?: Date;
      startedAt?: Date;
    },
  ) {
    return prisma.call.update({
      where: { id: callId },
      data,
    });
  }

  upsertRecording(
    callId: string,
    data: { exotelRecordingUrl?: string; durationSeconds?: number },
  ) {
    return prisma.callRecording.upsert({
      where: { callId },
      create: {
        callId,
        exotelRecordingUrl: data.exotelRecordingUrl,
        durationSeconds: data.durationSeconds,
      },
      update: {
        exotelRecordingUrl: data.exotelRecordingUrl,
        durationSeconds: data.durationSeconds,
      },
    });
  }

  createCallLog(callId: string, eventType: string, payload: Prisma.InputJsonValue) {
    return prisma.callLog.create({
      data: { callId, eventType, payload },
    });
  }
}

export const webhooksRepository = new WebhooksRepository();
