import { Request, Response } from 'express';
import { usersService } from './users.service';
import { sendSuccess } from '../../shared/utils/response';
import { asyncHandler } from '../../shared/utils/async-handler';

export class UsersController {
  list = asyncHandler(async (req: Request, res: Response) => {
    const result = await usersService.list(req.user!.roleName, req.query as Record<string, string>);
    sendSuccess(res, result.data, 200, result.meta as unknown as Record<string, unknown>);
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const result = await usersService.getById(req.params.id, req.user!.roleName);
    sendSuccess(res, result);
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const result = await usersService.create(req.body, req.user!.roleName);
    sendSuccess(res, result, 201);
  });

  invite = asyncHandler(async (req: Request, res: Response) => {
    const result = await usersService.invite(req.body, req.user!.roleName);
    sendSuccess(res, result, 202);
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const result = await usersService.update(req.params.id, req.body, req.user!.roleName);
    sendSuccess(res, result);
  });

  delete = asyncHandler(async (req: Request, res: Response) => {
    const result = await usersService.delete(
      req.params.id,
      req.user!.id,
      req.user!.roleName,
    );
    sendSuccess(res, result);
  });

  listRoles = asyncHandler(async (req: Request, res: Response) => {
    const assignableOnly = req.query.assignable === 'true';
    const result = await usersService.listRoles(req.user!.roleName, assignableOnly);
    sendSuccess(res, result);
  });

  listPermissions = asyncHandler(async (req: Request, res: Response) => {
    const result = await usersService.listPermissions(req.user!.roleName);
    sendSuccess(res, result);
  });
}

export const usersController = new UsersController();
