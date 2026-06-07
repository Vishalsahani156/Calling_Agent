import { DocumentSourceType, DocumentStatus, Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import {
  CreateDocumentInput,
  CreateFaqInput,
  CreateKnowledgeBaseInput,
  UpdateDocumentInput,
  UpdateFaqInput,
  UpdateKnowledgeBaseInput,
} from './knowledge.types';

export class KnowledgeRepository {
  findManyKnowledgeBases(organizationId: string, skip: number, limit: number, search?: string) {
    return prisma.knowledgeBase.findMany({
      where: {
        organizationId,
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }

  countKnowledgeBases(organizationId: string, search?: string) {
    return prisma.knowledgeBase.count({
      where: {
        organizationId,
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
    });
  }

  findKnowledgeBaseById(id: string, organizationId: string) {
    return prisma.knowledgeBase.findFirst({
      where: { id, organizationId },
    });
  }

  createKnowledgeBase(organizationId: string, input: CreateKnowledgeBaseInput) {
    return prisma.knowledgeBase.create({
      data: {
        organizationId,
        name: input.name,
        description: input.description,
        defaultLanguage: input.defaultLanguage ?? 'en',
      },
    });
  }

  updateKnowledgeBase(id: string, organizationId: string, input: UpdateKnowledgeBaseInput) {
    return prisma.knowledgeBase.update({
      where: { id, organizationId },
      data: input,
    });
  }

  deleteKnowledgeBase(id: string, organizationId: string) {
    return prisma.knowledgeBase.delete({
      where: { id, organizationId },
    });
  }

  findManyDocuments(knowledgeBaseId: string, organizationId: string, skip: number, limit: number) {
    return prisma.knowledgeDocument.findMany({
      where: {
        knowledgeBaseId,
        knowledgeBase: { organizationId },
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }

  countDocuments(knowledgeBaseId: string, organizationId: string) {
    return prisma.knowledgeDocument.count({
      where: {
        knowledgeBaseId,
        knowledgeBase: { organizationId },
      },
    });
  }

  findDocumentById(documentId: string, organizationId: string) {
    return prisma.knowledgeDocument.findFirst({
      where: {
        id: documentId,
        knowledgeBase: { organizationId },
      },
    });
  }

  createDocument(knowledgeBaseId: string, input: CreateDocumentInput) {
    return prisma.knowledgeDocument.create({
      data: {
        knowledgeBaseId,
        title: input.title,
        rawContent: input.rawContent,
        sourceType: input.sourceType ?? DocumentSourceType.manual,
        status: DocumentStatus.processing,
        metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
      },
    });
  }

  updateDocument(documentId: string, input: UpdateDocumentInput) {
    const data: Prisma.KnowledgeDocumentUpdateInput = {};

    if (input.title !== undefined) data.title = input.title;
    if (input.rawContent !== undefined) {
      data.rawContent = input.rawContent;
      data.status = DocumentStatus.processing;
    }
    if (input.metadata !== undefined) data.metadata = input.metadata as Prisma.InputJsonValue;

    return prisma.knowledgeDocument.update({
      where: { id: documentId },
      data,
    });
  }

  deleteDocument(documentId: string) {
    return prisma.knowledgeDocument.delete({
      where: { id: documentId },
    });
  }

  findManyFaqs(knowledgeBaseId: string, organizationId: string, skip: number, limit: number) {
    return prisma.faq.findMany({
      where: {
        knowledgeBaseId,
        knowledgeBase: { organizationId },
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }

  countFaqs(knowledgeBaseId: string, organizationId: string) {
    return prisma.faq.count({
      where: {
        knowledgeBaseId,
        knowledgeBase: { organizationId },
      },
    });
  }

  findFaqById(faqId: string, organizationId: string) {
    return prisma.faq.findFirst({
      where: {
        id: faqId,
        knowledgeBase: { organizationId },
      },
    });
  }

  createFaq(knowledgeBaseId: string, input: CreateFaqInput) {
    return prisma.faq.create({
      data: {
        knowledgeBaseId,
        question: input.question,
        answer: input.answer,
        language: input.language ?? 'en',
      },
    });
  }

  updateFaq(faqId: string, input: UpdateFaqInput) {
    return prisma.faq.update({
      where: { id: faqId },
      data: input,
    });
  }

  deleteFaq(faqId: string) {
    return prisma.faq.delete({
      where: { id: faqId },
    });
  }

  findDocumentsForReindex(knowledgeBaseId: string, organizationId: string) {
    return prisma.knowledgeDocument.findMany({
      where: {
        knowledgeBaseId,
        knowledgeBase: { organizationId },
        rawContent: { not: null },
      },
    });
  }

  findFaqsForReindex(knowledgeBaseId: string, organizationId: string) {
    return prisma.faq.findMany({
      where: {
        knowledgeBaseId,
        knowledgeBase: { organizationId },
      },
    });
  }

  deleteChunksByDocumentId(documentId: string) {
    return prisma.knowledgeChunk.deleteMany({
      where: { documentId },
    });
  }

  createChunk(documentId: string, content: string, chunkIndex: number) {
    return prisma.knowledgeChunk.create({
      data: {
        documentId,
        content,
        chunkIndex,
        tokenCount: Math.ceil(content.length / 4),
      },
    });
  }

  updateDocumentStatus(documentId: string, status: DocumentStatus) {
    return prisma.knowledgeDocument.update({
      where: { id: documentId },
      data: { status },
    });
  }

  setChunkEmbedding(chunkId: string, embedding: number[]) {
    const vectorLiteral = `[${embedding.join(',')}]`;
    return prisma.$executeRawUnsafe(
      `UPDATE knowledge_chunks SET embedding = $1::vector, updated_at = NOW() WHERE id = $2::uuid`,
      vectorLiteral,
      chunkId,
    );
  }

  setFaqEmbedding(faqId: string, embedding: number[]) {
    const vectorLiteral = `[${embedding.join(',')}]`;
    return prisma.$executeRawUnsafe(
      `UPDATE faqs SET embedding = $1::vector, updated_at = NOW() WHERE id = $2::uuid`,
      vectorLiteral,
      faqId,
    );
  }

  searchChunksByVector(
    knowledgeBaseId: string,
    organizationId: string,
    embedding: number[],
    limit: number,
  ) {
    const vectorLiteral = `[${embedding.join(',')}]`;
    return prisma.$queryRawUnsafe<
      Array<{ id: string; content: string; similarity: number }>
    >(
      `SELECT kc.id, kc.content,
              1 - (kc.embedding <=> $1::vector) AS similarity
       FROM knowledge_chunks kc
       INNER JOIN knowledge_documents kd ON kd.id = kc.document_id
       INNER JOIN knowledge_bases kb ON kb.id = kd.knowledge_base_id
       WHERE kd.knowledge_base_id = $2::uuid
         AND kb.organization_id = $3::uuid
         AND kc.embedding IS NOT NULL
       ORDER BY kc.embedding <=> $1::vector
       LIMIT $4`,
      vectorLiteral,
      knowledgeBaseId,
      organizationId,
      limit,
    );
  }

  searchChunksByKeyword(
    knowledgeBaseId: string,
    organizationId: string,
    query: string,
    limit: number,
  ) {
    return prisma.$queryRawUnsafe<
      Array<{ id: string; content: string; rank: number }>
    >(
      `SELECT kc.id, kc.content,
              ts_rank(to_tsvector('english', kc.content), plainto_tsquery('english', $1)) AS rank
       FROM knowledge_chunks kc
       INNER JOIN knowledge_documents kd ON kd.id = kc.document_id
       INNER JOIN knowledge_bases kb ON kb.id = kd.knowledge_base_id
       WHERE kd.knowledge_base_id = $2::uuid
         AND kb.organization_id = $3::uuid
         AND to_tsvector('english', kc.content) @@ plainto_tsquery('english', $1)
       ORDER BY rank DESC
       LIMIT $4`,
      query,
      knowledgeBaseId,
      organizationId,
      limit,
    );
  }

  searchFaqsByVector(
    knowledgeBaseId: string,
    organizationId: string,
    embedding: number[],
    limit: number,
    language?: string,
  ) {
    const vectorLiteral = `[${embedding.join(',')}]`;

    if (language) {
      return prisma.$queryRawUnsafe<
        Array<{ id: string; question: string; answer: string; similarity: number }>
      >(
        `SELECT f.id, f.question, f.answer,
                1 - (f.embedding <=> $1::vector) AS similarity
         FROM faqs f
         INNER JOIN knowledge_bases kb ON kb.id = f.knowledge_base_id
         WHERE f.knowledge_base_id = $2::uuid
           AND kb.organization_id = $3::uuid
           AND f.embedding IS NOT NULL
           AND f.language = $5
         ORDER BY f.embedding <=> $1::vector
         LIMIT $4`,
        vectorLiteral,
        knowledgeBaseId,
        organizationId,
        limit,
        language,
      );
    }

    return prisma.$queryRawUnsafe<
      Array<{ id: string; question: string; answer: string; similarity: number }>
    >(
      `SELECT f.id, f.question, f.answer,
              1 - (f.embedding <=> $1::vector) AS similarity
       FROM faqs f
       INNER JOIN knowledge_bases kb ON kb.id = f.knowledge_base_id
       WHERE f.knowledge_base_id = $2::uuid
         AND kb.organization_id = $3::uuid
         AND f.embedding IS NOT NULL
       ORDER BY f.embedding <=> $1::vector
       LIMIT $4`,
      vectorLiteral,
      knowledgeBaseId,
      organizationId,
      limit,
    );
  }
}

export const knowledgeRepository = new KnowledgeRepository();
