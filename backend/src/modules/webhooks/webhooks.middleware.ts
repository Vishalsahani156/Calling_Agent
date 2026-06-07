import { RequestHandler } from 'express';
import { env } from '../../config/env';
import { UnauthorizedError } from '../../shared/errors/app.error';

export const validateExotelWebhookSecret: RequestHandler = (req, _res, next) => {
  const secret = env.EXOTEL_WEBHOOK_SECRET;
  if (!secret) {
    next();
    return;
  }

  const headerSecret = req.headers['x-exotel-webhook-secret'];
  const querySecret = req.query.secret;
  const provided =
    (typeof headerSecret === 'string' ? headerSecret : undefined) ??
    (typeof querySecret === 'string' ? querySecret : undefined);

  if (provided !== secret) {
    next(new UnauthorizedError('Invalid webhook secret'));
    return;
  }

  next();
};
