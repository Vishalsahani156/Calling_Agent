import OpenAI from 'openai';
import { Prisma } from '@prisma/client';
import { agentsRepository } from './agents.repository';
import { CreateAgentInput, TestAgentInput, UpdateAgentInput } from './agents.types';
import { ConflictError, NotFoundError } from '../../shared/errors/app.error';
import { getPagination, buildPaginatedMeta } from '../../shared/utils/response';
import { env } from '../../config/env';

function formatAgent(agent: {
  id: string;
  name: string;
  voiceProfile: unknown;
  personalityPrompt: string;
  greetingScript: unknown;
  interruptionEnabled: boolean;
  maxSilenceSeconds: number;
  llmConfig: unknown;
  toolsEnabled: unknown;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: agent.id,
    name: agent.name,
    voiceProfile: agent.voiceProfile,
    personalityPrompt: agent.personalityPrompt,
    greetingScript: agent.greetingScript,
    interruptionEnabled: agent.interruptionEnabled,
    maxSilenceSeconds: agent.maxSilenceSeconds,
    llmConfig: agent.llmConfig,
    toolsEnabled: agent.toolsEnabled,
    createdAt: agent.createdAt,
    updatedAt: agent.updatedAt,
  };
}

export class AgentsService {
  async list(organizationId: string, query: { page?: string; limit?: string; search?: string }) {
    const { page, limit, skip } = getPagination(query);
    const [agents, total] = await Promise.all([
      agentsRepository.findMany(organizationId, skip, limit, query.search),
      agentsRepository.count(organizationId, query.search),
    ]);
    return {
      data: agents.map(formatAgent),
      meta: buildPaginatedMeta(total, page, limit),
    };
  }

  async getById(id: string, organizationId: string) {
    const agent = await agentsRepository.findById(id, organizationId);
    if (!agent) throw new NotFoundError('Agent not found');
    return formatAgent(agent);
  }

  async create(organizationId: string, input: CreateAgentInput) {
    const agent = await agentsRepository.create(organizationId, input);
    return formatAgent(agent);
  }

  async update(id: string, organizationId: string, input: UpdateAgentInput) {
    const agent = await agentsRepository.findById(id, organizationId);
    if (!agent) throw new NotFoundError('Agent not found');

    const updated = await agentsRepository.update(id, organizationId, input);
    return formatAgent(updated);
  }

  async delete(id: string, organizationId: string) {
    const agent = await agentsRepository.findById(id, organizationId);
    if (!agent) throw new NotFoundError('Agent not found');

    try {
      await agentsRepository.delete(id, organizationId);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        throw new ConflictError('Agent is in use by one or more campaigns or calls');
      }
      throw error;
    }

    return { message: 'Agent deleted successfully' };
  }

  async test(id: string, organizationId: string, input: TestAgentInput) {
    const agent = await agentsRepository.findById(id, organizationId);
    if (!agent) throw new NotFoundError('Agent not found');

    if (!env.OPENAI_API_KEY) {
      return {
        mock: true,
        message:
          'OpenAI API key is not configured. Set OPENAI_API_KEY in the environment to enable live agent testing.',
        agent: {
          id: agent.id,
          name: agent.name,
        },
        input: {
          message: input.message,
        },
        simulatedResponse: `[Mock] Agent "${agent.name}" would respond to: "${input.message}"`,
      };
    }

    const llmConfig = (agent.llmConfig ?? {}) as { model?: string; temperature?: number };
    const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: agent.personalityPrompt },
      ...(input.conversationHistory ?? []).map((entry) => ({
        role: entry.role,
        content: entry.content,
      })),
      { role: 'user', content: input.message },
    ];

    const completion = await client.chat.completions.create({
      model: llmConfig.model ?? 'gpt-4o-mini',
      temperature: llmConfig.temperature ?? 0.7,
      messages,
    });

    return {
      mock: false,
      agent: {
        id: agent.id,
        name: agent.name,
      },
      response: completion.choices[0]?.message?.content ?? '',
      usage: completion.usage,
    };
  }
}

export const agentsService = new AgentsService();
