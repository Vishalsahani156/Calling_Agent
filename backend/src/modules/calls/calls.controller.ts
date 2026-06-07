import { Request, Response } from 'express';
import { callsService } from './calls.service';
import { sendSuccess } from '../../shared/utils/response';
import { asyncHandler } from '../../shared/utils/async-handler';

export class CallsController {
  list = asyncHandler(async (req: Request, res: Response) => {
    const result = await callsService.list(
      req.user!.organizationId,
      req.query as Record<string, string>,
    );
    sendSuccess(res, result.data, 200, result.meta as unknown as Record<string, unknown>);
  });

  getLive = asyncHandler(async (req: Request, res: Response) => {
    const result = await callsService.getLive(req.user!.organizationId);
    sendSuccess(res, result);
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const result = await callsService.getById(req.params.id, req.user!.organizationId);
    sendSuccess(res, result);
  });

  getTranscript = asyncHandler(async (req: Request, res: Response) => {
    const result = await callsService.getTranscript(req.params.id, req.user!.organizationId);
    sendSuccess(res, result);
  });

  getRecording = asyncHandler(async (req: Request, res: Response) => {
    const result = await callsService.getRecording(req.params.id, req.user!.organizationId);
    sendSuccess(res, result);
  });
}

export const callsController = new CallsController();
