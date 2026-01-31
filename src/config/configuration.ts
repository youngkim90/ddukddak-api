export default () => ({
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  supabase: {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },

  toss: {
    secretKey: process.env.TOSS_SECRET_KEY || '',
    webhookSecret: process.env.TOSS_WEBHOOK_SECRET || '',
  },

  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },

  // MVP 무료 모드: true이면 SubscriptionGuard가 구독 체크를 스킵합니다
  enableFreeMode: process.env.ENABLE_FREE_MODE !== 'false',
});
