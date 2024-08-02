import {
  HttpException,
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { systemLoggerInstance } from './logger';

export const BAD_REQUEST = HttpStatus.BAD_REQUEST;
export const UNAUTHORIZED = HttpStatus.UNAUTHORIZED;
export const FORBIDDEN = HttpStatus.FORBIDDEN;
export const NOT_FOUND = HttpStatus.NOT_FOUND;
export const SERVER_ERROR = HttpStatus.INTERNAL_SERVER_ERROR;

export const errorResponse = (
  statusCode: number,
  res: Response,
  errCode = '',
  errMessage = '',
) => {
  const message = { error: { code: errCode, message: errMessage } };
  switch (statusCode) {
    case BAD_REQUEST:
      res.status(BAD_REQUEST).json(message || 'Bad Request.\n');
      break;
    case UNAUTHORIZED:
      res.status(UNAUTHORIZED).json(message || 'Unauthorized.\n');
      break;
    case FORBIDDEN:
      res.status(FORBIDDEN).json(message || 'Forbidden.\n');
      break;
    case NOT_FOUND:
      res.status(NOT_FOUND).json(message || 'Not Found.\n');
      break;
    case SERVER_ERROR:
      res.status(SERVER_ERROR).json(message || 'Internal Server Error.\n');
      break;
  }
};

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException ? exception.getResponse() : exception;

    systemLoggerInstance.error(
      JSON.stringify(exception, Object.getOwnPropertyNames(exception)),
    );

    errorResponse(status, response, 'ERROR_CODE', JSON.stringify(message));
  }
}
