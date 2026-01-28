import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('HTTP');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException ? exception.getResponse() : 'Internal server error';

    const errorMessage =
      typeof message === 'string'
        ? message
        : (message as { message?: string | string[] }).message || 'Unknown error';

    const { method, originalUrl, ip } = request;
    const userId = (request as unknown as { user?: { id: string } }).user?.id || 'anonymous';

    // 에러 로깅
    this.logger.error(
      `[ERR] ${method} ${originalUrl} - ${status} - User: ${userId} - IP: ${ip} - ${JSON.stringify(errorMessage)}`,
    );

    // 스택 트레이스 (개발 환경)
    if (process.env.NODE_ENV !== 'production' && exception instanceof Error) {
      this.logger.debug(`[ERR STACK] ${exception.stack}`);
    }

    // 응답 반환
    response.status(status).json({
      statusCode: status,
      message: errorMessage,
      timestamp: new Date().toISOString(),
      path: originalUrl,
    });
  }
}
