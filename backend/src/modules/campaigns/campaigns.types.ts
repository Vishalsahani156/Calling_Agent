import { z } from 'zod';
import {
  createCampaignSchema,
  updateCampaignSchema,
  importContactsSchema,
} from './campaigns.validator';

export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;
export type UpdateCampaignInput = z.infer<typeof updateCampaignSchema>;
export type ImportContactsInput = z.infer<typeof importContactsSchema>;
