import { Request, Response } from 'express';
import { analyticsService } from './analytics.service';
import { sendSuccess } from '../../shared/utils/response';
import { asyncHandler } from '../../shared/utils/async-handler';

export class AnalyticsController {
  getOverview = asyncHandler(async (req: Request, res: Response) => {
    const result = await analyticsService.getOverview(req.user!.organizationId);
    sendSuccess(res, result);
  });

  getCallStats = asyncHandler(async (req: Request, res: Response) => {
    const result = await analyticsService.getCallStats(
      req.user!.organizationId,
      req.query as Record<string, string>,
    );
    sendSuccess(res, result);
  });

  getCampaignStats = asyncHandler(async (req: Request, res: Response) => {
    const result = await analyticsService.getCampaignStats(
      req.params.id,
      req.user!.organizationId,
    );
    sendSuccess(res, result);
  });
}

export const analyticsController = new AnalyticsController();
