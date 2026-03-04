import { applyDecorators } from '@nestjs/common';
import { SkipThrottle, Throttle } from '@nestjs/throttler';

export const ThrottleFeedback = () =>
  applyDecorators(SkipThrottle({ strict: true }), Throttle({ feedback: { limit: 3, ttl: 60000 } }));
