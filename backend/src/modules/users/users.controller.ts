import { Request, Response } from 'express';
import { usersService } from './users.service';
import { sendSuccess } from '../../shared/utils/response';
import { asyncHandler } from '../../shared/utils/async-handler';

export class UsersController {
  list = asyncHandler(async (req: Request, res: Response) => {
    const result = await usersService.list(req.user!.organizationId, req.query as Record<string, string>);
    sendSuccess(res, result.data, 200, result.meta as unknown as Record<string, unknown>);
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const result = await usersService.getById(req.params.id, req.user!.organizationId);
    sendSuccess(res, result);
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const result = await usersService.create(
      req.user!.organizationId,
      req.body,
      req.user!.roleName,
    );
    sendSuccess(res, result, 201);
  });

  invite = asyncHandler(async (req: Request, res: Response) => {
    const result = await usersService.invite(
      req.user!.organizationId,
      req.body,
      req.user!.roleName,
    );
    sendSuccess(res, result, 202);
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const result = await usersService.update(
      req.params.id,
      req.user!.organizationId,
      req.body,
      req.user!.roleName,
    );
    sendSuccess(res, result);
  });

  delete = asyncHandler(async (req: Request, res: Response) => {
    const result = await usersService.delete(
      req.params.id,
      req.user!.organizationId,
      req.user!.id,
      req.user!.roleName,
    );
    sendSuccess(res, result);
  });

  listRoles = asyncHandler(async (_req: Request, res: Response) => {
    const result = await usersService.listRoles();
    sendSuccess(res, result);
  });

  listPermissions = asyncHandler(async (_req: Request, res: Response) => {
    const result = await usersService.listPermissions();
    sendSuccess(res, result);
  });
}

export const usersController = new UsersController();
