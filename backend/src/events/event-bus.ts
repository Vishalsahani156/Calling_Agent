import { EventEmitter } from 'events';

export enum AppEvents {
  USER_REGISTERED = 'user.registered',
  USER_LOGGED_IN = 'user.logged_in',
  USER_LOGGED_OUT = 'user.logged_out',
  CAMPAIGN_STARTED = 'campaign.started',
  CAMPAIGN_PAUSED = 'campaign.paused',
  CAMPAIGN_STOPPED = 'campaign.stopped',
  CALL_INITIATED = 'call.initiated',
  CALL_COMPLETED = 'call.completed',
  CONTACT_IMPORTED = 'contact.imported',
  KNOWLEDGE_REINDEXED = 'knowledge.reindexed',
  AUDIT_LOGGED = 'audit.logged',
}

export interface EventPayloads {
  [AppEvents.USER_REGISTERED]: { userId: string; organizationId: string; email: string };
  [AppEvents.USER_LOGGED_IN]: { userId: string; organizationId: string };
  [AppEvents.USER_LOGGED_OUT]: { userId: string };
  [AppEvents.CAMPAIGN_STARTED]: { campaignId: string; organizationId: string };
  [AppEvents.CAMPAIGN_PAUSED]: { campaignId: string; organizationId: string };
  [AppEvents.CAMPAIGN_STOPPED]: { campaignId: string; organizationId: string };
  [AppEvents.CALL_INITIATED]: {
    callId: string;
    organizationId: string;
    campaignId?: string;
  };
  [AppEvents.CALL_COMPLETED]: {
    callId: string;
    organizationId: string;
    status: string;
  };
  [AppEvents.CONTACT_IMPORTED]: { organizationId: string; count: number };
  [AppEvents.KNOWLEDGE_REINDEXED]: { knowledgeBaseId: string };
  [AppEvents.AUDIT_LOGGED]: Record<string, unknown>;
}

class TypedEventBus extends EventEmitter {
  emit<K extends keyof EventPayloads>(event: K, payload: EventPayloads[K]): boolean {
    return super.emit(event, payload);
  }

  on<K extends keyof EventPayloads>(
    event: K,
    listener: (payload: EventPayloads[K]) => void,
  ): this {
    return super.on(event, listener);
  }
}

export const eventBus = new TypedEventBus();
