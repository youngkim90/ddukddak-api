import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';
import { throwError } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const { method, originalUrl, body, ip } = request;
    const userAgent = request.get('user-agent') || '';
    const userId = (request as unknown as { user?: { id: string } }).user?.id || 'anonymous';

    const now = Date.now();

    // 요청 로깅
    this.logger.log(
      `[REQ] ${method} ${originalUrl} - User: ${userId} - IP: ${ip} - UA: ${userAgent.substring(0, 50)}`,
    );

    // Body 로깅 (민감 정보 마스킹)
    if (body && Object.keys(body).length > 0) {
      const sanitizedBody = this.sanitizeBody(body);
      this.logger.debug(`[REQ BODY] ${JSON.stringify(sanitizedBody)}`);
    }

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - now;
        const { statusCode } = response;

        this.logger.log(`[RES] ${method} ${originalUrl} - ${statusCode} - ${duration}ms`);
      }),
      catchError((error: Error & { status?: number }) => {
        const duration = Date.now() - now;
        const status = error.status || 500;
        const message = error.message || 'Internal server error';

        this.logger.error(
          `[ERR] ${method} ${originalUrl} - ${status} - ${duration}ms - ${message}`,
        );

        if (process.env.NODE_ENV !== 'production') {
          this.logger.debug(`[ERR STACK] ${error.stack}`);
        }

        return throwError(() => error);
      }),
    );
  }

  private sanitizeBody(body: Record<string, unknown>): Record<string, unknown> {
    const sensitiveFields = ['password', 'token', 'billingKey', 'secret', 'authorization'];
    const sanitized = { ...body };

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '***MASKED***';
      }
    }

    return sanitized;
  }
}
