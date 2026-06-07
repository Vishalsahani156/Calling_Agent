import { Request, Response } from 'express';
import { settingsService } from './settings.service';
import { sendSuccess } from '../../shared/utils/response';
import { asyncHandler } from '../../shared/utils/async-handler';

export class SettingsController {
  get = asyncHandler(async (req: Request, res: Response) => {
    const result = await settingsService.get(req.user!.organizationId);
    sendSuccess(res, result);
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const result = await settingsService.update(req.user!.organizationId, req.body);
    sendSuccess(res, result);
  });
}

export const settingsController = new SettingsController();
