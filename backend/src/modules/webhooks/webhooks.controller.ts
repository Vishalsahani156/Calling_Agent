import { Request, Response } from 'express';
import { webhooksService } from './webhooks.service';
import { sendSuccess } from '../../shared/utils/response';
import { asyncHandler } from '../../shared/utils/async-handler';

export class WebhooksController {
  exotelStatus = asyncHandler(async (req: Request, res: Response) => {
    const result = await webhooksService.handleExotelStatus(req.body);
    sendSuccess(res, result);
  });

  exotelPassthruGet = asyncHandler(async (req: Request, res: Response) => {
    const result = await webhooksService.handlePassthruGet(
      req.query as Record<string, unknown>,
    );
    sendSuccess(res, result);
  });

  exotelPassthruPost = asyncHandler(async (req: Request, res: Response) => {
    const result = await webhooksService.handlePassthruPost(req.body);
    sendSuccess(res, result);
  });
}

export const webhooksController = new WebhooksController();
