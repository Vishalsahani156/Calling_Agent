import { Request, Response } from 'express';
import { contactsService } from './contacts.service';
import { sendSuccess } from '../../shared/utils/response';
import { asyncHandler } from '../../shared/utils/async-handler';
import { BadRequestError } from '../../shared/errors/app.error';

export class ContactsController {
  list = asyncHandler(async (req: Request, res: Response) => {
    const result = await contactsService.list(
      req.user!.organizationId,
      req.query as Record<string, string>,
    );
    sendSuccess(res, result.data, 200, result.meta as unknown as Record<string, unknown>);
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const result = await contactsService.getById(req.params.id, req.user!.organizationId);
    sendSuccess(res, result);
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const result = await contactsService.create(req.user!.organizationId, req.body);
    sendSuccess(res, result, 201);
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const result = await contactsService.update(
      req.params.id,
      req.user!.organizationId,
      req.body,
    );
    sendSuccess(res, result);
  });

  delete = asyncHandler(async (req: Request, res: Response) => {
    const result = await contactsService.delete(req.params.id, req.user!.organizationId);
    sendSuccess(res, result);
  });

  import = asyncHandler(async (req: Request, res: Response) => {
    if (!req.file?.buffer) {
      throw new BadRequestError('CSV file is required');
    }

    const result = await contactsService.importFromCsv(
      req.user!.organizationId,
      req.file.buffer,
      { skipDuplicates: req.body.skipDuplicates },
    );
    sendSuccess(res, result, 201);
  });

  export = asyncHandler(async (req: Request, res: Response) => {
    const csv = await contactsService.exportToCsv(
      req.user!.organizationId,
      req.query as Record<string, string>,
    );
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="contacts.csv"');
    res.status(200).send(csv);
  });

  addTags = asyncHandler(async (req: Request, res: Response) => {
    const result = await contactsService.addTags(
      req.params.id,
      req.user!.organizationId,
      req.body,
    );
    sendSuccess(res, result);
  });

  addNote = asyncHandler(async (req: Request, res: Response) => {
    const result = await contactsService.addNote(
      req.params.id,
      req.user!.organizationId,
      req.user!.id,
      req.body,
    );
    sendSuccess(res, result, 201);
  });

  listGroups = asyncHandler(async (req: Request, res: Response) => {
    const result = await contactsService.listGroups(
      req.user!.organizationId,
      req.query as Record<string, string>,
    );
    sendSuccess(res, result.data, 200, result.meta as unknown as Record<string, unknown>);
  });

  createGroup = asyncHandler(async (req: Request, res: Response) => {
    const result = await contactsService.createGroup(req.user!.organizationId, req.body);
    sendSuccess(res, result, 201);
  });
}

export const contactsController = new ContactsController();
