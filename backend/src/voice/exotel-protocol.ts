import { z } from 'zod';

const mediaFormatSchema = z.object({
  encoding: z.string().optional(),
  sample_rate: z.union([z.string(), z.number()]).optional(),
  bit_rate: z.union([z.string(), z.number()]).optional(),
});

const startPayloadSchema = z.object({
  stream_sid: z.string().optional(),
  call_sid: z.string().optional(),
  account_sid: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  custom_parameters: z.record(z.string()).optional(),
  media_format: mediaFormatSchema.optional(),
});

const mediaPayloadSchema = z.object({
  chunk: z.union([z.string(), z.number()]).optional(),
  timestamp: z.union([z.string(), z.number()]).optional(),
  payload: z.string(),
});

const stopPayloadSchema = z.object({
  reason: z.string().optional(),
});

const markPayloadSchema = z.object({
  name: z.string().optional(),
});

const dtmfPayloadSchema = z.object({
  digit: z.string().optional(),
  duration: z.union([z.string(), z.number()]).optional(),
});

const incomingFrameSchema = z.object({
  event: z.enum(['connected', 'start', 'media', 'stop', 'dtmf', 'mark', 'clear']),
  stream_sid: z.string().optional(),
  sequence_number: z.union([z.string(), z.number()]).optional(),
  start: startPayloadSchema.optional(),
  media: mediaPayloadSchema.optional(),
  stop: stopPayloadSchema.optional(),
  mark: markPayloadSchema.optional(),
  dtmf: dtmfPayloadSchema.optional(),
});

export type ExotelEventType = z.infer<typeof incomingFrameSchema>['event'];

export interface ExotelIncomingFrame {
  event: ExotelEventType;
  streamSid?: string;
  sequenceNumber?: string;
  start?: z.infer<typeof startPayloadSchema>;
  media?: z.infer<typeof mediaPayloadSchema>;
  stop?: z.infer<typeof stopPayloadSchema>;
  mark?: z.infer<typeof markPayloadSchema>;
  dtmf?: z.infer<typeof dtmfPayloadSchema>;
}

export interface ExotelOutgoingMediaFrame {
  event: 'media';
  stream_sid: string;
  media: {
    payload: string;
  };
}

export interface ExotelOutgoingMarkFrame {
  event: 'mark';
  stream_sid: string;
  mark: {
    name: string;
  };
}

export interface ExotelOutgoingClearFrame {
  event: 'clear';
  stream_sid: string;
}

export type ExotelOutgoingFrame =
  | ExotelOutgoingMediaFrame
  | ExotelOutgoingMarkFrame
  | ExotelOutgoingClearFrame;

export class ExotelProtocolError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ExotelProtocolError';
  }
}

export function parseExotelFrame(raw: string | Buffer): ExotelIncomingFrame {
  let json: unknown;

  try {
    json = JSON.parse(raw.toString());
  } catch {
    throw new ExotelProtocolError('Invalid JSON frame from Exotel');
  }

  const parsed = incomingFrameSchema.safeParse(json);
  if (!parsed.success) {
    throw new ExotelProtocolError(`Unsupported Exotel frame: ${parsed.error.message}`);
  }

  const frame = parsed.data;

  return {
    event: frame.event,
    streamSid: frame.stream_sid,
    sequenceNumber:
      frame.sequence_number !== undefined ? String(frame.sequence_number) : undefined,
    start: frame.start,
    media: frame.media,
    stop: frame.stop,
    mark: frame.mark,
    dtmf: frame.dtmf,
  };
}

export function buildMediaFrame(streamSid: string, audio: Buffer): ExotelOutgoingMediaFrame {
  return {
    event: 'media',
    stream_sid: streamSid,
    media: {
      payload: audio.toString('base64'),
    },
  };
}

export function buildMarkFrame(streamSid: string, name: string): ExotelOutgoingMarkFrame {
  return {
    event: 'mark',
    stream_sid: streamSid,
    mark: { name },
  };
}

export function buildClearFrame(streamSid: string): ExotelOutgoingClearFrame {
  return {
    event: 'clear',
    stream_sid: streamSid,
  };
}

export function serializeExotelFrame(frame: ExotelOutgoingFrame): string {
  return JSON.stringify(frame);
}

export function decodeMediaPayload(payload: string): Buffer {
  return Buffer.from(payload, 'base64');
}
