import { Request, Response } from 'express';
import { knowledgeService } from './knowledge.service';
import { sendSuccess } from '../../shared/utils/response';
import { asyncHandler } from '../../shared/utils/async-handler';
import { BadRequestError } from '../../shared/errors/app.error';

export class KnowledgeController {
  listKnowledgeBases = asyncHandler(async (req: Request, res: Response) => {
    const result = await knowledgeService.listKnowledgeBases(
      req.user!.organizationId,
      req.query as Record<string, string>,
    );
    sendSuccess(res, result.data, 200, result.meta as unknown as Record<string, unknown>);
  });

  getKnowledgeBaseById = asyncHandler(async (req: Request, res: Response) => {
    const result = await knowledgeService.getKnowledgeBaseById(req.params.id, req.user!.organizationId);
    sendSuccess(res, result);
  });

  createKnowledgeBase = asyncHandler(async (req: Request, res: Response) => {
    const result = await knowledgeService.createKnowledgeBase(req.user!.organizationId, req.body);
    sendSuccess(res, result, 201);
  });

  updateKnowledgeBase = asyncHandler(async (req: Request, res: Response) => {
    const result = await knowledgeService.updateKnowledgeBase(
      req.params.id,
      req.user!.organizationId,
      req.body,
    );
    sendSuccess(res, result);
  });

  deleteKnowledgeBase = asyncHandler(async (req: Request, res: Response) => {
    const result = await knowledgeService.deleteKnowledgeBase(req.params.id, req.user!.organizationId);
    sendSuccess(res, result);
  });

  listDocuments = asyncHandler(async (req: Request, res: Response) => {
    const result = await knowledgeService.listDocuments(
      req.params.id,
      req.user!.organizationId,
      req.query as Record<string, string>,
    );
    sendSuccess(res, result.data, 200, result.meta as unknown as Record<string, unknown>);
  });

  getDocumentById = asyncHandler(async (req: Request, res: Response) => {
    const result = await knowledgeService.getDocumentById(
      req.params.id,
      req.params.documentId,
      req.user!.organizationId,
    );
    sendSuccess(res, result);
  });

  createDocument = asyncHandler(async (req: Request, res: Response) => {
    const result = await knowledgeService.createDocument(
      req.params.id,
      req.user!.organizationId,
      req.body,
    );
    sendSuccess(res, result, 201);
  });

  updateDocument = asyncHandler(async (req: Request, res: Response) => {
    const result = await knowledgeService.updateDocument(
      req.params.id,
      req.params.documentId,
      req.user!.organizationId,
      req.body,
    );
    sendSuccess(res, result);
  });

  deleteDocument = asyncHandler(async (req: Request, res: Response) => {
    const result = await knowledgeService.deleteDocument(
      req.params.id,
      req.params.documentId,
      req.user!.organizationId,
    );
    sendSuccess(res, result);
  });

  deleteDocumentById = asyncHandler(async (req: Request, res: Response) => {
    const result = await knowledgeService.deleteDocumentById(req.params.id, req.user!.organizationId);
    sendSuccess(res, result);
  });

  uploadDocument = asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      throw new BadRequestError('File is required');
    }

    let metadata: Record<string, unknown> | undefined;
    if (req.body.metadata) {
      try {
        metadata = JSON.parse(req.body.metadata) as Record<string, unknown>;
      } catch {
        throw new BadRequestError('metadata must be valid JSON');
      }
    }

    const result = await knowledgeService.uploadDocument(
      req.params.id,
      req.user!.organizationId,
      req.file,
      req.body.title,
      metadata,
    );
    sendSuccess(res, result, 201);
  });

  listFaqs = asyncHandler(async (req: Request, res: Response) => {
    const result = await knowledgeService.listFaqs(
      req.params.id,
      req.user!.organizationId,
      req.query as Record<string, string>,
    );
    sendSuccess(res, result.data, 200, result.meta as unknown as Record<string, unknown>);
  });

  getFaqById = asyncHandler(async (req: Request, res: Response) => {
    const result = await knowledgeService.getFaqById(
      req.params.id,
      req.params.faqId,
      req.user!.organizationId,
    );
    sendSuccess(res, result);
  });

  createFaq = asyncHandler(async (req: Request, res: Response) => {
    const result = await knowledgeService.createFaq(req.params.id, req.user!.organizationId, req.body);
    sendSuccess(res, result, 201);
  });

  updateFaq = asyncHandler(async (req: Request, res: Response) => {
    const result = await knowledgeService.updateFaq(
      req.params.id,
      req.params.faqId,
      req.user!.organizationId,
      req.body,
    );
    sendSuccess(res, result);
  });

  deleteFaq = asyncHandler(async (req: Request, res: Response) => {
    const result = await knowledgeService.deleteFaq(
      req.params.id,
      req.params.faqId,
      req.user!.organizationId,
    );
    sendSuccess(res, result);
  });

  reindex = asyncHandler(async (req: Request, res: Response) => {
    const result = await knowledgeService.reindex(req.params.id, req.user!.organizationId);
    sendSuccess(res, result);
  });
}

export const knowledgeController = new KnowledgeController();
