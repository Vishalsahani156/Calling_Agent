import { Router } from 'express';
import { webhooksController } from './webhooks.controller';
import { webhookRateLimit } from '../../middleware/rate-limit';
import { validate } from '../../middleware/validate';
import { validateExotelWebhookSecret } from './webhooks.middleware';
import {
  exotelStatusWebhookSchema,
  exotelPassthruQuerySchema,
} from './webhooks.validator';

const router = Router();

router.use(webhookRateLimit);
router.use(validateExotelWebhookSecret);

router.post(
  '/exotel/status',
  validate({ body: exotelStatusWebhookSchema }),
  webhooksController.exotelStatus,
);

router.get(
  '/exotel/passthru',
  validate({ query: exotelPassthruQuerySchema }),
  webhooksController.exotelPassthruGet,
);

router.post(
  '/exotel/passthru',
  webhooksController.exotelPassthruPost,
);

export default router;
