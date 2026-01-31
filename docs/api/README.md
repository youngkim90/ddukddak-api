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

```mermaid
flowchart TD
    A[Client 요청] --> B{@Public 라우트?}
    B -- Yes --> C[Guard 통과 ✅]
    B -- No --> D{Authorization 헤더 존재?}
    D -- No --> E[401 Unauthorized<br/>'Missing authorization token']
    D -- Yes --> F[Bearer 토큰 추출]
    F --> G[supabase.auth.getUser 호출]
    G --> H{토큰 유효?}
    H -- No --> I[401 Unauthorized<br/>'Invalid or expired token']
    H -- Yes --> J[request.user에 User 객체 저장]
    J --> C

    style E fill:#f44336,color:#fff
    style I fill:#f44336,color:#fff
    style C fill:#4caf50,color:#fff
```

---

## 구독 검증 흐름 — SubscriptionGuard

`JwtAuthGuard` 통과 후, `@RequireSubscription()` 데코레이터가 적용된 라우트에서 추가로 구독 상태를 검증합니다.

```mermaid
flowchart TD
    A[JwtAuthGuard 통과] --> B{@RequireSubscription 설정?}
    B -- No --> C[Guard 통과 ✅]
    B -- Yes --> D{request.user 존재?}
    D -- No --> E[403 Forbidden<br/>'Authentication required']
    D -- Yes --> F["subscriptions 테이블 조회<br/>WHERE user_id = ? AND status = 'active'"]
    F --> G{활성 구독 존재?<br/>expires_at > NOW}
    G -- Yes --> C
    G -- No --> H["stories 테이블 조회<br/>WHERE id = storyId"]
    H --> I{is_free = true?}
    I -- Yes --> C
    I -- No --> J[403 Forbidden<br/>'Active subscription required<br/>to access this content']

    style E fill:#f44336,color:#fff
    style J fill:#f44336,color:#fff
    style C fill:#4caf50,color:#fff
```

---

## 전체 요청 처리 흐름

```mermaid
flowchart TD
    A[Client 요청] --> B[NestJS Pipeline]
    B --> C[ValidationPipe<br/>DTO 검증 + 변환]
    C --> D[JwtAuthGuard]
    D --> E[SubscriptionGuard]
    E --> F[Controller]
    F --> G[Service]
    G --> H[(Supabase PostgreSQL)]
    H --> G
    G --> F
    F --> I[LoggingInterceptor<br/>요청/응답 로깅]
    I --> J[Client 응답]

    G -.-> K[TossService<br/>결제 API]
    K -.-> G

    style A fill:#2196f3,color:#fff
    style J fill:#2196f3,color:#fff
    style H fill:#ff9800,color:#fff
    style K fill:#ff9800,color:#fff
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
