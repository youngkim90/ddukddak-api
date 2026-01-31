# 뚝딱동화 API 문서

> 전체 API 개요 및 공통 인증 흐름

---

## API 엔드포인트 목록

| 메서드 | 엔드포인트 | 설명 | 인증 | 문서 |
|--------|-----------|------|------|------|
| GET | `/api/health` | 헬스 체크 | 🔓 | - |
| GET | `/api/users/me` | 내 프로필 조회 | 🔒 | [user-api.md](./user-api.md) |
| PATCH | `/api/users/me` | 프로필 수정 | 🔒 | [user-api.md](./user-api.md) |
| DELETE | `/api/users/me` | 회원 탈퇴 | 🔒 | [user-api.md](./user-api.md) |
| GET | `/api/stories` | 동화 목록 조회 | 🔓 | [story-api.md](./story-api.md) |
| GET | `/api/stories/:id` | 동화 상세 조회 | 🔓 | [story-api.md](./story-api.md) |
| GET | `/api/stories/:id/pages` | 동화 페이지 조회 | 💎 | [story-api.md](./story-api.md) |
| GET | `/api/progress` | 내 진행률 목록 | 🔒 | [progress-api.md](./progress-api.md) |
| GET | `/api/progress/:storyId` | 특정 동화 진행률 | 🔒 | [progress-api.md](./progress-api.md) |
| PUT | `/api/progress/:storyId` | 진행률 저장 | 🔒 | [progress-api.md](./progress-api.md) |
| GET | `/api/subscriptions/plans` | 구독 플랜 목록 | 🔓 | [subscription-api.md](./subscription-api.md) |
| GET | `/api/subscriptions/me` | 내 구독 정보 | 🔒 | [subscription-api.md](./subscription-api.md) |
| POST | `/api/subscriptions` | 구독 시작 | 🔒 | [subscription-api.md](./subscription-api.md) |
| DELETE | `/api/subscriptions/me` | 구독 해지 | 🔒 | [subscription-api.md](./subscription-api.md) |
| POST | `/api/webhooks/toss` | 토스페이먼츠 웹훅 | 🔐 | [webhook-api.md](./webhook-api.md) |

**인증 구분**: 🔓 공개 | 🔒 로그인 필요 | 💎 구독 필요 | 🔐 내부용 (시크릿 키)

---

## 공통 인증 흐름 — JwtAuthGuard

모든 요청은 전역 `JwtAuthGuard`를 거칩니다. `@Public()` 데코레이터가 적용된 라우트는 검증을 건너뜁니다.

### API 흐름

```mermaid
flowchart TD
    A[Client 요청] --> B{공개 라우트?}
    B -- Yes --> C[인증 없이 통과]
    B -- No --> D{JWT 토큰 존재?}
    D -- No --> E[401 Unauthorized]
    D -- Yes --> F{토큰 유효?}
    F -- No --> G[401 Unauthorized]
    F -- Yes --> H[인증 통과]

    style E fill:#f44336,color:#fff
    style G fill:#f44336,color:#fff
    style C fill:#4caf50,color:#fff
    style H fill:#4caf50,color:#fff
```

### 코드 흐름

```mermaid
flowchart TD
    A[JwtAuthGuard.canActivate] --> B[Reflector — @Public 메타데이터 확인]
    B --> C{IS_PUBLIC_KEY?}
    C -- Yes --> D[return true]
    C -- No --> E[Authorization 헤더에서 Bearer 토큰 추출]
    E --> F[supabase.auth.getUser — 토큰 검증]
    F --> G[request.user에 User 객체 저장]
    G --> H[return true]
```

---

## 구독 검증 흐름 — SubscriptionGuard

`JwtAuthGuard` 통과 후, `@RequireSubscription()` 데코레이터가 적용된 라우트에서 추가로 구독 상태를 검증합니다.

### API 흐름

```mermaid
flowchart TD
    A[JWT 인증 통과] --> B{구독 검증 필요?}
    B -- No --> C[통과]
    B -- Yes --> D{활성 구독 존재?}
    D -- Yes --> C
    D -- No --> E{무료 콘텐츠?}
    E -- Yes --> C
    E -- No --> F[403 Forbidden]

    style C fill:#4caf50,color:#fff
    style F fill:#f44336,color:#fff
```

### 코드 흐름

```mermaid
flowchart TD
    A[SubscriptionGuard.canActivate] --> B[Reflector — @RequireSubscription 메타데이터 확인]
    B --> C{REQUIRE_SUBSCRIPTION_KEY?}
    C -- No --> D[return true]
    C -- Yes --> E[checkSubscription — subscriptions 테이블 조회]
    E --> F{활성 구독?}
    F -- Yes --> D
    F -- No --> G[checkFreeContent — stories.is_free 확인]
    G --> H{무료?}
    H -- Yes --> D
    H -- No --> I[ForbiddenException throw]
```

---

## 전체 요청 처리 파이프라인

```mermaid
flowchart TD
    A[Client 요청] --> B[ValidationPipe — DTO 검증]
    B --> C[JwtAuthGuard — 인증]
    C --> D[SubscriptionGuard — 구독 검증]
    D --> E[Controller — 요청 처리]
    E --> F[Service — 비즈니스 로직]
    F --> G[(Supabase DB)]
    G --> F
    F --> E
    E --> H[LoggingInterceptor — 로깅]
    H --> I[Client 응답]

    F -.-> J[TossService — 결제 API]
    J -.-> F

    style A fill:#2196f3,color:#fff
    style I fill:#2196f3,color:#fff
    style G fill:#ff9800,color:#fff
    style J fill:#ff9800,color:#fff
```

---

## 공통 에러 응답 형식

`HttpExceptionFilter`가 모든 에러를 표준화된 형식으로 변환합니다.

```json
{
  "statusCode": 401,
  "message": "Invalid or expired token",
  "timestamp": "2026-01-31T12:00:00.000Z",
  "path": "/api/users/me"
}
```

---

## Supabase 클라이언트 사용 구분

| 클라이언트 | 사용처 | 특징 |
|-----------|--------|------|
| **Public Client** | 동화 목록/상세 조회 | RLS 정책 적용 |
| **Admin Client** | 사용자, 진행률, 구독 관리 | RLS 우회, 백엔드 전용 |
