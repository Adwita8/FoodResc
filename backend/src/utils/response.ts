import { Response } from 'express';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
}

export interface StandardApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  pagination?: PaginationMeta;
  errorCode?: string;
  errors?: unknown;
}

export const successResponse = <T>(
  res: Response,
  message: string,
  data?: T,
  statusCode: number = 200
): Response => {
  const payload: StandardApiResponse<T> = {
    success: true,
    message,
    ...(data !== undefined && { data }),
  };
  return res.status(statusCode).json(payload);
};

export const errorResponse = (
  res: Response,
  message: string,
  errorCode: string = 'ERROR',
  statusCode: number = 400,
  errors?: unknown
): Response => {
  const payload: StandardApiResponse = {
    success: false,
    message,
    errorCode,
    ...(errors !== undefined && { errors }),
  };
  return res.status(statusCode).json(payload);
};

export const paginatedResponse = <T>(
  res: Response,
  message: string,
  data: T[],
  pagination: PaginationMeta,
  statusCode: number = 200
): Response => {
  const hasNextPage = pagination.page < pagination.totalPages;
  const hasPrevPage = pagination.page > 1;

  const payload: StandardApiResponse<T[]> = {
    success: true,
    message,
    data,
    pagination: {
      ...pagination,
      hasNextPage: pagination.hasNextPage ?? hasNextPage,
      hasPrevPage: pagination.hasPrevPage ?? hasPrevPage,
    },
  };
  return res.status(statusCode).json(payload);
};
