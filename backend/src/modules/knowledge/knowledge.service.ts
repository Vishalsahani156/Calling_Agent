import OpenAI from 'openai';
import pdfParse from 'pdf-parse';
import { DocumentSourceType, DocumentStatus, Prisma } from '@prisma/client';
import { knowledgeRepository } from './knowledge.repository';
import {
  CreateDocumentInput,
  CreateFaqInput,
  CreateKnowledgeBaseInput,
  UpdateDocumentInput,
  UpdateFaqInput,
  UpdateKnowledgeBaseInput,
} from './knowledge.types';
import { BadRequestError, ConflictError, NotFoundError } from '../../shared/errors/app.error';
import { getPagination, buildPaginatedMeta } from '../../shared/utils/response';
import { env } from '../../config/env';
import { eventBus, AppEvents } from '../../events/event-bus';

const CHUNK_SIZE = 500;

function formatKnowledgeBase(kb: {
  id: string;
  name: string;
  description: string | null;
  defaultLanguage: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: kb.id,
    name: kb.name,
    description: kb.description,
    defaultLanguage: kb.defaultLanguage,
    createdAt: kb.createdAt,
    updatedAt: kb.updatedAt,
  };
}

function formatDocument(doc: {
  id: string;
  knowledgeBaseId: string;
  title: string;
  sourceType: DocumentSourceType;
  rawContent: string | null;
  fileUrl: string | null;
  status: DocumentStatus;
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: doc.id,
    knowledgeBaseId: doc.knowledgeBaseId,
    title: doc.title,
    sourceType: doc.sourceType,
    rawContent: doc.rawContent,
    fileUrl: doc.fileUrl,
    status: doc.status,
    metadata: doc.metadata,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function formatFaq(faq: {
  id: string;
  knowledgeBaseId: string;
  question: string;
  answer: string;
  language: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: faq.id,
    knowledgeBaseId: faq.knowledgeBaseId,
    question: faq.question,
    answer: faq.answer,
    language: faq.language,
    createdAt: faq.createdAt,
    updatedAt: faq.updatedAt,
  };
}

function chunkText(text: string, chunkSize = CHUNK_SIZE): string[] {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) return [];

  const chunks: string[] = [];
  for (let i = 0; i < normalized.length; i += chunkSize) {
    chunks.push(normalized.slice(i, i + chunkSize));
  }
  return chunks;
}

async function generateEmbedding(text: string): Promise<number[] | null> {
  if (!env.OPENAI_API_KEY) return null;

  const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  const response = await client.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });

  return response.data[0]?.embedding ?? null;
}

async function assertKnowledgeBase(id: string, organizationId: string) {
  const kb = await knowledgeRepository.findKnowledgeBaseById(id, organizationId);
  if (!kb) throw new NotFoundError('Knowledge base not found');
  return kb;
}

export class KnowledgeService {
  async listKnowledgeBases(
    organizationId: string,
    query: { page?: string; limit?: string; search?: string },
  ) {
    const { page, limit, skip } = getPagination(query);
    const [items, total] = await Promise.all([
      knowledgeRepository.findManyKnowledgeBases(organizationId, skip, limit, query.search),
      knowledgeRepository.countKnowledgeBases(organizationId, query.search),
    ]);

    return {
      data: items.map(formatKnowledgeBase),
      meta: buildPaginatedMeta(total, page, limit),
    };
  }

  async getKnowledgeBaseById(id: string, organizationId: string) {
    const kb = await assertKnowledgeBase(id, organizationId);
    return formatKnowledgeBase(kb);
  }

  async createKnowledgeBase(organizationId: string, input: CreateKnowledgeBaseInput) {
    const kb = await knowledgeRepository.createKnowledgeBase(organizationId, input);
    return formatKnowledgeBase(kb);
  }

  async updateKnowledgeBase(id: string, organizationId: string, input: UpdateKnowledgeBaseInput) {
    await assertKnowledgeBase(id, organizationId);
    const kb = await knowledgeRepository.updateKnowledgeBase(id, organizationId, input);
    return formatKnowledgeBase(kb);
  }

  async deleteKnowledgeBase(id: string, organizationId: string) {
    await assertKnowledgeBase(id, organizationId);

    try {
      await knowledgeRepository.deleteKnowledgeBase(id, organizationId);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        throw new ConflictError('Knowledge base is in use by one or more campaigns');
      }
      throw error;
    }

    return { message: 'Knowledge base deleted successfully' };
  }

  async listDocuments(
    knowledgeBaseId: string,
    organizationId: string,
    query: { page?: string; limit?: string },
  ) {
    await assertKnowledgeBase(knowledgeBaseId, organizationId);
    const { page, limit, skip } = getPagination(query);
    const [items, total] = await Promise.all([
      knowledgeRepository.findManyDocuments(knowledgeBaseId, organizationId, skip, limit),
      knowledgeRepository.countDocuments(knowledgeBaseId, organizationId),
    ]);

    return {
      data: items.map(formatDocument),
      meta: buildPaginatedMeta(total, page, limit),
    };
  }

  async getDocumentById(knowledgeBaseId: string, documentId: string, organizationId: string) {
    await assertKnowledgeBase(knowledgeBaseId, organizationId);
    const doc = await knowledgeRepository.findDocumentById(documentId, organizationId);
    if (!doc || doc.knowledgeBaseId !== knowledgeBaseId) {
      throw new NotFoundError('Document not found');
    }
    return formatDocument(doc);
  }

  async createDocument(
    knowledgeBaseId: string,
    organizationId: string,
    input: CreateDocumentInput,
  ) {
    await assertKnowledgeBase(knowledgeBaseId, organizationId);
    const doc = await knowledgeRepository.createDocument(knowledgeBaseId, input);
    return formatDocument(doc);
  }

  async updateDocument(
    knowledgeBaseId: string,
    documentId: string,
    organizationId: string,
    input: UpdateDocumentInput,
  ) {
    await this.getDocumentById(knowledgeBaseId, documentId, organizationId);
    const doc = await knowledgeRepository.updateDocument(documentId, input);
    return formatDocument(doc);
  }

  async deleteDocument(knowledgeBaseId: string, documentId: string, organizationId: string) {
    await this.getDocumentById(knowledgeBaseId, documentId, organizationId);
    await knowledgeRepository.deleteDocument(documentId);
    return { message: 'Document deleted successfully' };
  }

  async deleteDocumentById(documentId: string, organizationId: string) {
    const doc = await knowledgeRepository.findDocumentById(documentId, organizationId);
    if (!doc) throw new NotFoundError('Document not found');
    await knowledgeRepository.deleteDocument(documentId);
    return { message: 'Document deleted successfully' };
  }

  async uploadDocument(
    knowledgeBaseId: string,
    organizationId: string,
    file: { buffer: Buffer; originalname: string; mimetype: string; size: number },
    title?: string,
    metadata?: Record<string, unknown>,
  ) {
    await assertKnowledgeBase(knowledgeBaseId, organizationId);

    const rawContent = await this.extractTextFromFile(file);
    if (!rawContent.trim()) {
      throw new BadRequestError('Uploaded file contains no extractable text');
    }

    const doc = await knowledgeRepository.createDocument(knowledgeBaseId, {
      title: title ?? file.originalname,
      rawContent,
      sourceType: DocumentSourceType.upload,
      metadata: {
        ...(metadata ?? {}),
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
      },
    });

    return formatDocument(doc);
  }

  async listFaqs(
    knowledgeBaseId: string,
    organizationId: string,
    query: { page?: string; limit?: string },
  ) {
    await assertKnowledgeBase(knowledgeBaseId, organizationId);
    const { page, limit, skip } = getPagination(query);
    const [items, total] = await Promise.all([
      knowledgeRepository.findManyFaqs(knowledgeBaseId, organizationId, skip, limit),
      knowledgeRepository.countFaqs(knowledgeBaseId, organizationId),
    ]);

    return {
      data: items.map(formatFaq),
      meta: buildPaginatedMeta(total, page, limit),
    };
  }

  async getFaqById(knowledgeBaseId: string, faqId: string, organizationId: string) {
    await assertKnowledgeBase(knowledgeBaseId, organizationId);
    const faq = await knowledgeRepository.findFaqById(faqId, organizationId);
    if (!faq || faq.knowledgeBaseId !== knowledgeBaseId) {
      throw new NotFoundError('FAQ not found');
    }
    return formatFaq(faq);
  }

  async createFaq(knowledgeBaseId: string, organizationId: string, input: CreateFaqInput) {
    await assertKnowledgeBase(knowledgeBaseId, organizationId);
    const faq = await knowledgeRepository.createFaq(knowledgeBaseId, input);
    return formatFaq(faq);
  }

  async updateFaq(
    knowledgeBaseId: string,
    faqId: string,
    organizationId: string,
    input: UpdateFaqInput,
  ) {
    await this.getFaqById(knowledgeBaseId, faqId, organizationId);
    const faq = await knowledgeRepository.updateFaq(faqId, input);
    return formatFaq(faq);
  }

  async deleteFaq(knowledgeBaseId: string, faqId: string, organizationId: string) {
    await this.getFaqById(knowledgeBaseId, faqId, organizationId);
    await knowledgeRepository.deleteFaq(faqId);
    return { message: 'FAQ deleted successfully' };
  }

  async reindex(knowledgeBaseId: string, organizationId: string) {
    await assertKnowledgeBase(knowledgeBaseId, organizationId);

    const documents = await knowledgeRepository.findDocumentsForReindex(
      knowledgeBaseId,
      organizationId,
    );
    const faqs = await knowledgeRepository.findFaqsForReindex(knowledgeBaseId, organizationId);

    let chunksCreated = 0;
    let embeddingsGenerated = 0;
    const embeddingEnabled = Boolean(env.OPENAI_API_KEY);

    for (const document of documents) {
      const content = document.rawContent ?? '';
      await knowledgeRepository.deleteChunksByDocumentId(document.id);

      const chunks = chunkText(content);
      if (chunks.length === 0) {
        await knowledgeRepository.updateDocumentStatus(document.id, DocumentStatus.failed);
        continue;
      }

      for (let index = 0; index < chunks.length; index += 1) {
        const chunk = await knowledgeRepository.createChunk(document.id, chunks[index], index);
        chunksCreated += 1;

        if (embeddingEnabled) {
          const embedding = await generateEmbedding(chunks[index]);
          if (embedding) {
            await knowledgeRepository.setChunkEmbedding(chunk.id, embedding);
            embeddingsGenerated += 1;
          }
        }
      }

      await knowledgeRepository.updateDocumentStatus(document.id, DocumentStatus.ready);
    }

    if (embeddingEnabled) {
      for (const faq of faqs) {
        const embedding = await generateEmbedding(`${faq.question}\n${faq.answer}`);
        if (embedding) {
          await knowledgeRepository.setFaqEmbedding(faq.id, embedding);
          embeddingsGenerated += 1;
        }
      }
    }

    eventBus.emit(AppEvents.KNOWLEDGE_REINDEXED, { knowledgeBaseId });

    return {
      knowledgeBaseId,
      documentsProcessed: documents.length,
      faqsProcessed: faqs.length,
      chunksCreated,
      embeddingsGenerated,
      embeddingEnabled,
      message: embeddingEnabled
        ? 'Knowledge base reindexed with embeddings'
        : 'Knowledge base reindexed without embeddings. Set OPENAI_API_KEY to enable vector embeddings.',
    };
  }

  private async extractTextFromFile(file: {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
  }): Promise<string> {
    if (file.mimetype === 'application/pdf') {
      const parsed = await pdfParse(file.buffer);
      return parsed.text;
    }

    if (
      file.mimetype.startsWith('text/') ||
      file.originalname.endsWith('.md') ||
      file.originalname.endsWith('.txt')
    ) {
      return file.buffer.toString('utf-8');
    }

    throw new BadRequestError('Unsupported file type. Upload PDF or plain text files.');
  }
}

export const knowledgeService = new KnowledgeService();
