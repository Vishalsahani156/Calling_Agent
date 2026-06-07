import { Router, Request, Response } from 'express';
import { checkDatabaseConnection } from '../../config/database';
import { checkRedisConnection } from '../../config/redis';
import { asyncHandler } from '../../shared/utils/async-handler';
import { sendSuccess } from '../../shared/utils/response';

const router = Router();

router.get(
  '/health',
  asyncHandler(async (_req: Request, res: Response) => {
    sendSuccess(res, { status: 'ok', timestamp: new Date().toISOString() });
  }),
);

router.get(
  '/ready',
  asyncHandler(async (_req: Request, res: Response) => {
    const dbOk = await checkDatabaseConnection();
    const redisOk = await checkRedisConnection();

    if (!dbOk) {
      res.status(503).json({
        success: false,
        message: 'Database unavailable',
        code: 'SERVICE_UNAVAILABLE',
      });
      return;
    }

    sendSuccess(res, {
      status: 'ready',
      database: dbOk,
      redis: redisOk,
      timestamp: new Date().toISOString(),
    });
  }),
);

export default router;
