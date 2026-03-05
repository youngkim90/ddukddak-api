import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import configuration from './config/configuration';
import { JwtAuthGuard, SubscriptionGuard } from './common/guards';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { SupabaseModule } from './supabase/supabase.module';
import { HealthModule } from './health/health.module';
import { UserModule } from './user/user.module';
import { StoryModule } from './story/story.module';
import { ProgressModule } from './progress/progress.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { WebhookModule } from './webhook/webhook.module';
import { FeedbackModule } from './feedback/feedback.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    ThrottlerModule.forRoot([
      { name: 'default', ttl: 60000, limit: 60 }, // 일반: 60req/분
      { name: 'strict', ttl: 60000, limit: 10 }, // 민감: 10req/분 (write 작업용)
      { name: 'feedback', ttl: 60000, limit: 3 }, // 피드백: 3req/분 (중복 제출 방지)
    ]),
    SupabaseModule,
    HealthModule,
    UserModule,
    StoryModule,
    ProgressModule,
    SubscriptionModule,
    WebhookModule,
    FeedbackModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: SubscriptionGuard,
    },
  ],
})
export class AppModule {}
