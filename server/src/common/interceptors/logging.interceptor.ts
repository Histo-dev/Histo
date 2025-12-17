import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, params, query, body } = request;
    const now = Date.now();

    // 요청 로그
    this.logger.log('━━━━━━━━━━ 요청 시작 ━━━━━━━━━━');
    this.logger.log(`📍 경로: ${method} ${url}`);

    if (Object.keys(params).length > 0) {
      this.logger.log(`📦 파라미터: ${JSON.stringify(params)}`);
    }

    if (Object.keys(query).length > 0) {
      this.logger.log(`🔍 쿼리: ${JSON.stringify(query)}`);
    }

    if (body && Object.keys(body).length > 0) {
      // 민감한 정보는 마스킹 처리
      const sanitizedBody = this.sanitizeBody(body);
      this.logger.log(`📄 요청 본문: ${JSON.stringify(sanitizedBody, null, 2)}`);
    }

    return next.handle().pipe(
      tap({
        next: (data) => {
          const responseTime = Date.now() - now;
          const response = context.switchToHttp().getResponse();

          // 응답 로그
          this.logger.log('━━━━━━━━━━ 응답 완료 ━━━━━━━━━━');
          this.logger.log(`✅ 상태 코드: ${response.statusCode}`);

          if (data) {
            // 응답 데이터가 너무 크면 요약
            const responseData = this.truncateResponse(data);
            this.logger.log(`📤 응답 본문: ${JSON.stringify(responseData, null, 2)}`);
          }

          this.logger.log(`⏱️  응답 시간: ${responseTime}ms`);
          this.logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        },
        error: (error) => {
          const responseTime = Date.now() - now;

          // 에러 로그
          this.logger.error('━━━━━━━━━━ 에러 발생 ━━━━━━━━━━');
          this.logger.error(`❌ 상태 코드: ${error.status || 500}`);
          this.logger.error(`❌ 에러 메시지: ${error.message}`);
          this.logger.error(`⏱️  응답 시간: ${responseTime}ms`);
          this.logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        },
      }),
    );
  }

  private sanitizeBody(body: any): any {
    const sanitized = { ...body };
    const sensitiveFields = ['password', 'accessToken', 'token', 'secret'];

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '***';
      }
    }

    return sanitized;
  }

  private truncateResponse(data: any): any {
    const str = JSON.stringify(data);

    // 응답이 1000자 이상이면 요약
    if (str.length > 1000) {
      if (Array.isArray(data)) {
        return {
          type: 'Array',
          length: data.length,
          sample: data.slice(0, 2),
        };
      }

      return {
        ...data,
        _note: '(응답이 너무 커서 일부만 표시)',
      };
    }

    return data;
  }
}
