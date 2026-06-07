import { z } from 'zod';

export const exotelStatusWebhookSchema = z
  .object({
    CallSid: z.string().min(1),
    Status: z.string().min(1),
    DateUpdated: z.string().optional(),
    RecordingUrl: z.string().url().optional(),
    Duration: z.union([z.string(), z.number()]).optional(),
    CustomField: z.string().optional(),
  })
  .passthrough();

export const exotelPassthruQuerySchema = z
  .object({
    CallSid: z.string().optional(),
    From: z.string().optional(),
    To: z.string().optional(),
    secret: z.string().optional(),
  })
  .passthrough();
