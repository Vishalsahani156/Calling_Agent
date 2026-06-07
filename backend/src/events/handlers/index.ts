import pino from 'pino';
import { eventBus, AppEvents, type EventPayloads } from '../event-bus';
import { publishOrgEvent } from '../redis-pubsub';

const logger = pino({ name: 'event-handlers' });

function extractOrganizationId(
  event: AppEvents,
  payload: EventPayloads[AppEvents],
): string | null {
  if ('organizationId' in payload && typeof payload.organizationId === 'string') {
    return payload.organizationId;
  }

  if (event === AppEvents.KNOWLEDGE_REINDEXED) {
    return null;
  }

  return null;
}

function registerHandler<K extends AppEvents>(
  event: K,
  handler?: (payload: EventPayloads[K]) => void,
): void {
  eventBus.on(event, (payload) => {
    logger.info({ event, payload }, 'Application event');

    const organizationId = extractOrganizationId(event, payload);
    if (organizationId) {
      void publishOrgEvent(organizationId, event, payload);
    }

    handler?.(payload);
  });
}

registerHandler(AppEvents.USER_REGISTERED);
registerHandler(AppEvents.USER_LOGGED_IN);
registerHandler(AppEvents.USER_LOGGED_OUT);
registerHandler(AppEvents.CAMPAIGN_STARTED);
registerHandler(AppEvents.CAMPAIGN_PAUSED);
registerHandler(AppEvents.CAMPAIGN_STOPPED);
registerHandler(AppEvents.CALL_INITIATED);
registerHandler(AppEvents.CALL_COMPLETED);
registerHandler(AppEvents.CONTACT_IMPORTED);
registerHandler(AppEvents.KNOWLEDGE_REINDEXED);
registerHandler(AppEvents.AUDIT_LOGGED, (payload) => {
  if (process.env.NODE_ENV === 'development') {
    logger.debug({ payload }, 'Audit event');
  }
});

export function registerEventHandlers(): void {
  // Handlers registered on import
}
