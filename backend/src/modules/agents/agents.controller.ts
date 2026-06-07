import { Request, Response } from 'express';
import { agentsService } from './agents.service';
import { sendSuccess } from '../../shared/utils/response';
import { asyncHandler } from '../../shared/utils/async-handler';

export class AgentsController {
  list = asyncHandler(async (req: Request, res: Response) => {
    const result = await agentsService.list(req.user!.organizationId, req.query as Record<string, string>);
    sendSuccess(res, result.data, 200, result.meta as unknown as Record<string, unknown>);
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const result = await agentsService.getById(req.params.id, req.user!.organizationId);
    sendSuccess(res, result);
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const result = await agentsService.create(req.user!.organizationId, req.body);
    sendSuccess(res, result, 201);
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const result = await agentsService.update(req.params.id, req.user!.organizationId, req.body);
    sendSuccess(res, result);
  });

  delete = asyncHandler(async (req: Request, res: Response) => {
    const result = await agentsService.delete(req.params.id, req.user!.organizationId);
    sendSuccess(res, result);
  });

  test = asyncHandler(async (req: Request, res: Response) => {
    const result = await agentsService.test(req.params.id, req.user!.organizationId, req.body);
    sendSuccess(res, result);
  });
}

export const agentsController = new AgentsController();
