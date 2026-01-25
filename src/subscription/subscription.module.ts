import { Module } from '@nestjs/common';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from './subscription.service';
import { TossService } from './toss.service';

@Module({
  controllers: [SubscriptionController],
  providers: [SubscriptionService, TossService],
  exports: [SubscriptionService, TossService],
})
export class SubscriptionModule {}
