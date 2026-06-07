import { createApp } from './app';
import { env } from './config/env';
import { prisma } from './config/database';
import { closeRedis } from './config/redis';
import { attachLiveCallsGateway } from './ws/live-calls.gateway';

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(`API server running on http://localhost:${env.PORT}`);
  console.log(`Environment: ${env.NODE_ENV}`);
});

const liveCallsGateway = attachLiveCallsGateway(server);

async function shutdown(signal: string): Promise<void> {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  await liveCallsGateway.close();
  server.close(async () => {
    await prisma.$disconnect();
    await closeRedis();
    process.exit(0);
  });
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));

export default app;
