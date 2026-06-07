import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { CreateAgentInput, UpdateAgentInput } from './agents.types';

export class AgentsRepository {
  findMany(organizationId: string, skip: number, limit: number, search?: string) {
    return prisma.aiAgent.findMany({
      where: {
        organizationId,
        ...(search
          ? {
              OR: [{ name: { contains: search, mode: 'insensitive' } }],
            }
          : {}),
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }

  count(organizationId: string, search?: string) {
    return prisma.aiAgent.count({
      where: {
        organizationId,
        ...(search
          ? {
              OR: [{ name: { contains: search, mode: 'insensitive' } }],
            }
          : {}),
      },
    });
  }

  findById(id: string, organizationId: string) {
    return prisma.aiAgent.findFirst({
      where: { id, organizationId },
    });
  }

  create(organizationId: string, input: CreateAgentInput) {
    return prisma.aiAgent.create({
      data: {
        organizationId,
        name: input.name,
        personalityPrompt: input.personalityPrompt,
        voiceProfile: (input.voiceProfile ?? {}) as Prisma.InputJsonValue,
        greetingScript: (input.greetingScript ?? { en: 'Hello! How can I help you today?' }) as Prisma.InputJsonValue,
        interruptionEnabled: input.interruptionEnabled ?? true,
        maxSilenceSeconds: input.maxSilenceSeconds ?? 15,
        llmConfig: (input.llmConfig ?? {}) as Prisma.InputJsonValue,
        toolsEnabled: (input.toolsEnabled ?? {}) as Prisma.InputJsonValue,
      },
    });
  }

  update(id: string, organizationId: string, input: UpdateAgentInput) {
    const data: Prisma.AiAgentUpdateInput = {};

    if (input.name !== undefined) data.name = input.name;
    if (input.personalityPrompt !== undefined) data.personalityPrompt = input.personalityPrompt;
    if (input.voiceProfile !== undefined) data.voiceProfile = input.voiceProfile as Prisma.InputJsonValue;
    if (input.greetingScript !== undefined) data.greetingScript = input.greetingScript as Prisma.InputJsonValue;
    if (input.interruptionEnabled !== undefined) data.interruptionEnabled = input.interruptionEnabled;
    if (input.maxSilenceSeconds !== undefined) data.maxSilenceSeconds = input.maxSilenceSeconds;
    if (input.llmConfig !== undefined) data.llmConfig = input.llmConfig as Prisma.InputJsonValue;
    if (input.toolsEnabled !== undefined) data.toolsEnabled = input.toolsEnabled as Prisma.InputJsonValue;

    return prisma.aiAgent.update({
      where: { id, organizationId },
      data,
    });
  }

  delete(id: string, organizationId: string) {
    return prisma.aiAgent.delete({
      where: { id, organizationId },
    });
  }
}

export const agentsRepository = new AgentsRepository();
