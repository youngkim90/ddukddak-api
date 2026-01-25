import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import configuration from './config/configuration';
import { JwtAuthGuard, SubscriptionGuard } from './common/guards';
import { SupabaseModule } from './supabase/supabase.module';
import { UserModule } from './user/user.module';
import { StoryModule } from './story/story.module';
import { ProgressModule } from './progress/progress.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { WebhookModule } from './webhook/webhook.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    SupabaseModule,
    UserModule,
    StoryModule,
    ProgressModule,
    SubscriptionModule,
    WebhookModule,
  ],
  controllers: [],
  providers: [
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
