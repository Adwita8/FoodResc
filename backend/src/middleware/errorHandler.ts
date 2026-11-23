import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import { env } from '../config/env';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  let statusCode = 500;
  let message = 'Internal server error';
  let errorCode = 'INTERNAL_ERROR';
  let details: any = undefined;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    errorCode = err.errorCode;
    details = (err as any).details;
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid resource ID: ${err.value}`;
    errorCode = 'INVALID_ID';
  } else if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `Duplicate value for unique field: ${field}`;
    errorCode = 'DUPLICATE_KEY';
  } else if (err.name === 'ValidationError') {
    statusCode = 422;
    message = Object.values(err.errors || {})
      .map((val: any) => val.message)
      .join(', ');
    errorCode = 'DATABASE_VALIDATION_ERROR';
  }

  if (statusCode >= 500) {
    logger.error('Unhandled server exception', {
      error: err.message,
      stack: err.stack,
      path: req.originalUrl,
      method: req.method,
    });
  }

  return res.status(statusCode).json({
    success: false,
    message,
    errorCode,
    details: details || undefined,
    stack: env.NODE_ENV === 'development' && statusCode >= 500 ? err.stack : undefined,
  });
};
