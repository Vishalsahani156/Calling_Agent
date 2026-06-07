import { eventBus, AppEvents } from '../event-bus';

eventBus.on(AppEvents.USER_REGISTERED, (payload) => {
  console.log(`[event] User registered: ${payload.email} (${payload.userId})`);
});

eventBus.on(AppEvents.CAMPAIGN_STARTED, (payload) => {
  console.log(`[event] Campaign started: ${payload.campaignId}`);
});

eventBus.on(AppEvents.CALL_COMPLETED, (payload) => {
  console.log(`[event] Call completed: ${payload.callId} → ${payload.status}`);
});

eventBus.on(AppEvents.AUDIT_LOGGED, (payload) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[audit] ${payload.action} on ${payload.resourceType}`);
  }
});

export function registerEventHandlers(): void {
  // Handlers registered on import; extend here for Redis pub/sub at scale
}
