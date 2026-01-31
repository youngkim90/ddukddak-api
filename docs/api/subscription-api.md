# 구독 API (Subscription)

> `src/subscription/` — 구독 플랜, 구독 관리, 토스페이먼츠 결제

---

## 엔드포인트 요약

| 메서드 | 경로 | 설명 | 인증 |
|--------|------|------|------|
| GET | `/api/subscriptions/plans` | 구독 플랜 목록 | 🔓 |
| GET | `/api/subscriptions/me` | 내 구독 정보 | 🔒 |
| POST | `/api/subscriptions` | 구독 시작 (결제) | 🔒 |
| DELETE | `/api/subscriptions/me` | 구독 해지 | 🔒 |

---

## GET /api/subscriptions/plans — 구독 플랜 목록

하드코딩된 구독 플랜 정보를 반환합니다.

### API 흐름

```mermaid
flowchart TD
    A[Client 요청] --> B[공개 API - 인증 불필요]
    B --> C[플랜 목록 반환]
    C --> D[200 OK]

    style A fill:#2196f3,color:#fff
    style D fill:#4caf50,color:#fff
```

### 코드 흐름

```mermaid
flowchart TD
    A[SubscriptionController.getPlans] --> B[SubscriptionService.getPlans]
    B --> C[하드코딩된 SUBSCRIPTION_PLANS 반환]
    C --> D[SubscriptionPlansResponseDto 반환]
```

### 요청

- **Headers**: 없음 (공개 API)
- **Parameters**: 없음
- **Body**: 없음

### 응답

```json
{
  "plans": [
    {
      "id": "monthly",
      "name": "월간 구독",
      "price": 4900,
      "period": "monthly",
      "features": ["모든 동화 무제한", "오프라인 저장"]
    },
    {
      "id": "yearly",
      "name": "연간 구독",
      "price": 39000,
      "period": "yearly",
      "features": ["모든 동화 무제한", "오프라인 저장", "2개월 무료"]
    }
  ]
}
```

---

## GET /api/subscriptions/me — 내 구독 정보

현재 사용자의 가장 최근 구독 정보를 조회합니다.

### API 흐름

```mermaid
flowchart TD
    A[Client 요청] --> B[JWT 인증]
    B --> C{구독 존재?}
    C -- Yes --> D[200 OK - 구독 정보]
    C -- No --> E["200 OK - { subscription: null }"]

    style A fill:#2196f3,color:#fff
    style D fill:#4caf50,color:#fff
    style E fill:#4caf50,color:#fff
```

### 코드 흐름

```mermaid
flowchart TD
    A[SubscriptionController.getMySubscription] --> B[SubscriptionService.getMySubscription]
    B --> C[SupabaseAdmin → subscriptions 테이블 조회]
    C --> D{데이터 존재?}
    D -- Yes --> E[SubscriptionResponseDto 반환]
    D -- No --> F[null 반환]
```

### 요청

- **Headers**: `Authorization: Bearer <token>`
- **Parameters**: 없음
- **Body**: 없음

### 응답

```json
{
  "id": "uuid",
  "planType": "monthly",
  "status": "active",
  "startedAt": "2026-01-01T00:00:00.000Z",
  "expiresAt": "2026-01-31T00:00:00.000Z",
  "autoRenew": true
}
```

---

## POST /api/subscriptions — 구독 시작

빌링키로 토스페이먼츠 결제를 진행하고, 구독 레코드를 생성합니다.

### API 흐름

```mermaid
flowchart TD
    A[Client 요청] --> B[JWT 인증]
    B --> C[입력값 검증]
    C --> D{기존 활성 구독?}
    D -- Yes --> E[409 Conflict]
    D -- No --> F{플랜 존재?}
    F -- No --> G[404 Not Found]
    F -- Yes --> H[토스 결제 요청]
    H --> I{결제 성공?}
    I -- No --> J[500 Error]
    I -- Yes --> K[구독 생성]
    K --> L[201 Created]

    style A fill:#2196f3,color:#fff
    style E fill:#f44336,color:#fff
    style G fill:#f44336,color:#fff
    style J fill:#f44336,color:#fff
    style L fill:#4caf50,color:#fff
```

### 코드 흐름

```mermaid
flowchart TD
    A[SubscriptionController.createSubscription] --> B[ValidationPipe — CreateSubscriptionDto 검증]
    B --> C[SubscriptionService.createSubscription]
    C --> D[기존 활성 구독 확인]
    D --> E[SUBSCRIPTION_PLANS에서 플랜 검증]
    E --> F[TossService.requestBilling — 빌링키 결제]
    F --> G[SupabaseAdmin → subscriptions 레코드 생성]
    G --> H[SubscriptionResponseDto 반환]
```

### 요청

- **Headers**: `Authorization: Bearer <token>`
- **Parameters**: 없음
- **Body**:

```json
{
  "planType": "monthly",
  "billingKey": "billing_key_from_toss"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `planType` | enum | ✅ | `monthly` 또는 `yearly` |
| `billingKey` | string | ✅ | 토스페이먼츠 빌링키 |

### 응답

```json
{
  "id": "uuid",
  "planType": "monthly",
  "status": "active",
  "startedAt": "2026-01-31T00:00:00.000Z",
  "expiresAt": "2026-03-02T00:00:00.000Z",
  "autoRenew": true
}
```

---

## DELETE /api/subscriptions/me — 구독 해지

활성 구독의 상태를 `cancelled`로 변경하고 자동 갱신을 비활성화합니다. 구독은 만료일까지 유지됩니다.

### API 흐름

```mermaid
flowchart TD
    A[Client 요청] --> B[JWT 인증]
    B --> C{구독 존재?}
    C -- No --> D[404 Not Found]
    C -- Yes --> E{활성 상태?}
    E -- No --> F[409 Conflict]
    E -- Yes --> G[구독 해지 처리]
    G --> H[204 No Content]

    style A fill:#2196f3,color:#fff
    style D fill:#f44336,color:#fff
    style F fill:#f44336,color:#fff
    style H fill:#4caf50,color:#fff
```

### 코드 흐름

```mermaid
flowchart TD
    A[SubscriptionController.cancelSubscription] --> B[SubscriptionService.cancelSubscription]
    B --> C[구독 조회 — getMySubscription]
    C --> D[상태 검증 — active 확인]
    D --> E["SupabaseAdmin → subscriptions 업데이트<br/>(status=cancelled, auto_renew=false)"]
    E --> F[204 No Content]
```

### 요청

- **Headers**: `Authorization: Bearer <token>`
- **Parameters**: 없음
- **Body**: 없음

### 응답

- **204 No Content** (성공 시 Body 없음)

---

## 구독 자동 갱신 흐름 (내부)

웹훅에서 호출되는 자동 갱신 로직입니다. 직접 API로 노출되지 않습니다.

### API 흐름

```mermaid
flowchart TD
    A[웹훅 이벤트 수신] --> B{갱신 대상 존재?}
    B -- No --> C[조용히 종료]
    B -- Yes --> D[토스 재결제 요청]
    D --> E{결제 성공?}
    E -- Yes --> F[만료일 연장]
    E -- No --> G[구독 만료 처리]

    style A fill:#ff9800,color:#fff
    style F fill:#4caf50,color:#fff
    style G fill:#f44336,color:#fff
```

### 코드 흐름

```mermaid
flowchart TD
    A[SubscriptionService.renewSubscription] --> B["SupabaseAdmin → 활성+자동갱신 구독 조회"]
    B --> C[TossService.requestBilling — 빌링키 재결제]
    C --> D{성공?}
    D -- Yes --> E[expires_at 연장]
    D -- No --> F["status=expired, auto_renew=false 업데이트"]
```

---

## 관련 DB 테이블

```sql
subscriptions
├── id                UUID    PK
├── user_id           UUID    FK → users.id
├── plan_type         TEXT    -- 'monthly' | 'yearly'
├── status            TEXT    -- 'active' | 'cancelled' | 'expired'
├── started_at        TIMESTAMPTZ
├── expires_at        TIMESTAMPTZ
├── auto_renew        BOOLEAN
├── toss_billing_key  TEXT
└── created_at        TIMESTAMPTZ
```
