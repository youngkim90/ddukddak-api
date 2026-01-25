import { SetMetadata } from '@nestjs/common';
import { REQUIRE_SUBSCRIPTION_KEY } from '../guards/subscription.guard';

export const RequireSubscription = () =>
  SetMetadata(REQUIRE_SUBSCRIPTION_KEY, true);
