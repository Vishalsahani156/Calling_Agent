import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import { env } from './config/env';
import { requestId } from './middleware/request-id';
import { globalRateLimit } from './middleware/rate-limit';
import { errorHandler, notFoundHandler } from './middleware/error-handler';
import { registerEventHandlers } from './events/handlers';
import healthRoutes from './modules/health/health.routes';
import authRoutes from './modules/auth/auth.routes';
import usersRoutes from './modules/users/users.routes';
import settingsRoutes from './modules/settings/settings.routes';
import contactsRoutes, { groupsRouter } from './modules/contacts/contacts.routes';
import agentsRoutes from './modules/agents/agents.routes';
import knowledgeRoutes, { documentRouter as knowledgeDocumentRoutes } from './modules/knowledge/knowledge.routes';
import campaignsRoutes from './modules/campaigns/campaigns.routes';
import callsRoutes from './modules/calls/calls.routes';
import analyticsRoutes from './modules/analytics/analytics.routes';
import webhooksRoutes from './modules/webhooks/webhooks.routes';

registerEventHandlers();

export function createApp(): express.Application {
  const app = express();

  app.set('trust proxy', 1);

  app.use(requestId);
  app.use(
    pinoHttp({
      customProps: (req) => ({ requestId: req.requestId }),
    }),
  );
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(globalRateLimit);

  app.use(healthRoutes);
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/users', usersRoutes);
  app.use('/api/v1/settings', settingsRoutes);
  app.use('/api/v1/contacts', contactsRoutes);
  app.use('/api/v1/groups', groupsRouter);
  app.use('/api/v1/agents', agentsRoutes);
  app.use('/api/v1/knowledge-bases', knowledgeRoutes);
  app.use('/api/v1/knowledge-documents', knowledgeDocumentRoutes);
  app.use('/api/v1/campaigns', campaignsRoutes);
  app.use('/api/v1/calls', callsRoutes);
  app.use('/api/v1/analytics', analyticsRoutes);
  app.use('/api/v1/webhooks', webhooksRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
