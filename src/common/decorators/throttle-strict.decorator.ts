import { Throttle } from '@nestjs/throttler';

export const ThrottleStrict = () => Throttle({ strict: { limit: 10, ttl: 60000 } });
