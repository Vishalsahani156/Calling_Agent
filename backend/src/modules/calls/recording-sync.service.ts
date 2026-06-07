import fs from 'fs/promises';
import path from 'path';
import { env } from '../../config/env';
import { callsRepository } from './calls.repository';
import { NotFoundError } from '../../shared/errors/app.error';

function resolveRecordingExtension(contentType: string | null): string {
  if (!contentType) {
    return 'mp3';
  }

  if (contentType.includes('wav')) return 'wav';
  if (contentType.includes('mpeg') || contentType.includes('mp3')) return 'mp3';
  if (contentType.includes('ogg')) return 'ogg';
  return 'mp3';
}

export class RecordingSyncService {
  async syncCallRecording(callId: string, organizationId: string): Promise<{
    callId: string;
    storageUrl: string;
    format: string;
  }> {
    const recording = await callsRepository.findRecording(callId, organizationId);
    if (!recording) {
      throw new NotFoundError('Recording not found');
    }

    if (recording.storageUrl) {
      return {
        callId,
        storageUrl: recording.storageUrl,
        format: recording.format ?? 'mp3',
      };
    }

    if (!recording.exotelRecordingUrl) {
      throw new NotFoundError('Exotel recording URL not available');
    }

    const response = await fetch(recording.exotelRecordingUrl);
    if (!response.ok) {
      throw new Error(`Failed to download recording (${response.status})`);
    }

    const contentType = response.headers.get('content-type');
    const format = resolveRecordingExtension(contentType);
    const buffer = Buffer.from(await response.arrayBuffer());

    const storageDir = path.join(env.UPLOAD_DIR, 'recordings', organizationId);
    await fs.mkdir(storageDir, { recursive: true });

    const filename = `${callId}.${format}`;
    const absolutePath = path.join(storageDir, filename);
    await fs.writeFile(absolutePath, buffer);

    const storageUrl = `${env.API_BASE_URL}/uploads/recordings/${organizationId}/${filename}`;
    await callsRepository.updateRecordingStorage(callId, {
      storageUrl,
      format,
    });

    return { callId, storageUrl, format };
  }
}

export const recordingSyncService = new RecordingSyncService();
