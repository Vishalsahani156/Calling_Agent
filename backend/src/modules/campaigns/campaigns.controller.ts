import { Request, Response } from 'express';
import { campaignsService } from './campaigns.service';
import { sendSuccess } from '../../shared/utils/response';
import { asyncHandler } from '../../shared/utils/async-handler';

export class CampaignsController {
  list = asyncHandler(async (req: Request, res: Response) => {
    const result = await campaignsService.list(
      req.user!.organizationId,
      req.query as Record<string, string>,
    );
    sendSuccess(res, result.data, 200, result.meta as unknown as Record<string, unknown>);
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const result = await campaignsService.getById(req.params.id, req.user!.organizationId);
    sendSuccess(res, result);
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const result = await campaignsService.create(
      req.user!.organizationId,
      req.user!.id,
      req.body,
    );
    sendSuccess(res, result, 201);
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const result = await campaignsService.update(
      req.params.id,
      req.user!.organizationId,
      req.body,
    );
    sendSuccess(res, result);
  });

  delete = asyncHandler(async (req: Request, res: Response) => {
    const result = await campaignsService.delete(req.params.id, req.user!.organizationId);
    sendSuccess(res, result);
  });

  start = asyncHandler(async (req: Request, res: Response) => {
    const result = await campaignsService.start(req.params.id, req.user!.organizationId);
    sendSuccess(res, result);
  });

  pause = asyncHandler(async (req: Request, res: Response) => {
    const result = await campaignsService.pause(req.params.id, req.user!.organizationId);
    sendSuccess(res, result);
  });

  stop = asyncHandler(async (req: Request, res: Response) => {
    const result = await campaignsService.stop(req.params.id, req.user!.organizationId);
    sendSuccess(res, result);
  });

  importContacts = asyncHandler(async (req: Request, res: Response) => {
    const result = await campaignsService.importContacts(
      req.params.id,
      req.user!.organizationId,
      req.user!.id,
      req.body,
    );
    sendSuccess(res, result, 202);
  });

  getAnalytics = asyncHandler(async (req: Request, res: Response) => {
    const result = await campaignsService.getAnalytics(
      req.params.id,
      req.user!.organizationId,
    );
    sendSuccess(res, result);
  });

  getReport = asyncHandler(async (req: Request, res: Response) => {
    const result = await campaignsService.getReport(req.params.id, req.user!.organizationId);
    sendSuccess(res, result);
  });
}

export const campaignsController = new CampaignsController();
