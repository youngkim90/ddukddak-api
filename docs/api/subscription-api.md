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

### Flowchart

```mermaid
flowchart TD
    A[Client] -->|"GET /api/subscriptions/plans"| B["@Public — JwtAuthGuard 스킵"]
    B --> C[SubscriptionController.getPlans]
    C --> D[SubscriptionService.getPlans]
    D --> E["하드코딩된 SUBSCRIPTION_PLANS 반환"]
    E --> F["200 OK<br/>SubscriptionPlansResponseDto"]

    style A fill:#2196f3,color:#fff
    style F fill:#4caf50,color:#fff
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

### Flowchart

```mermaid
flowchart TD
    A[Client] -->|"GET /api/subscriptions/me<br/>Authorization: Bearer token"| B[JwtAuthGuard]
    B --> C[SubscriptionController.getMySubscription]
    C --> D[SubscriptionService.getMySubscription]
    D --> E["Admin Client<br/>SELECT * FROM subscriptions<br/>WHERE user_id = user.id<br/>ORDER BY created_at DESC<br/>LIMIT 1"]
    E --> F{구독 레코드 존재?}
    F -- Yes --> G["200 OK<br/>SubscriptionResponseDto"]
    F -- No --> H["200 OK<br/>{ subscription: null }"]

    style A fill:#2196f3,color:#fff
    style G fill:#4caf50,color:#fff
    style H fill:#4caf50,color:#fff
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

### Flowchart

```mermaid
flowchart TD
    A[Client] -->|"POST /api/subscriptions<br/>Authorization: Bearer token<br/>Body: CreateSubscriptionDto"| B[JwtAuthGuard]
    B --> C["ValidationPipe<br/>planType, billingKey 검증"]
    C --> D[SubscriptionController.createSubscription]
    D --> E[SubscriptionService.createSubscription]
    E --> F["1. 기존 활성 구독 확인<br/>getMySubscription(user)"]
    F --> G{활성 구독 존재?}
    G -- Yes --> H["409 Conflict<br/>'Already has an active subscription'"]
    G -- No --> I{플랜 존재?<br/>SUBSCRIPTION_PLANS에서 확인}
    I -- No --> J["404 Not Found"]
    I -- Yes --> K["2. TossService.requestBilling()<br/>POST /billing/{billingKey}"]
    K --> L{결제 성공?}
    L -- No --> M["500 Error<br/>결제 실패"]
    L -- Yes --> N["3. 구독 레코드 생성<br/>INSERT INTO subscriptions<br/>(user_id, plan_type, status='active',<br/>started_at, expires_at,<br/>auto_renew=true, toss_billing_key)"]
    N --> O["201 Created<br/>SubscriptionResponseDto"]

    style A fill:#2196f3,color:#fff
    style H fill:#f44336,color:#fff
    style J fill:#f44336,color:#fff
    style M fill:#f44336,color:#fff
    style O fill:#4caf50,color:#fff
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

### 토스페이먼츠 결제 요청 상세

```mermaid
flowchart TD
    A[SubscriptionService] --> B["TossService.requestBilling()"]
    B --> C["POST https://api.tosspayments.com/v1/billing/{billingKey}"]
    C --> D["Headers:<br/>Authorization: Basic base64(secretKey:)<br/>Content-Type: application/json"]
    D --> E["Body:<br/>customerKey: user.id<br/>amount: plan.price<br/>orderId: sub_{userId}_{timestamp}<br/>orderName: '뚝딱동화 {planName}'"]
    E --> F{응답 성공?}
    F -- Yes --> G[TossPaymentResponse 반환]
    F -- No --> H[Error throw]

    style A fill:#2196f3,color:#fff
    style G fill:#4caf50,color:#fff
    style H fill:#f44336,color:#fff
```

---

## DELETE /api/subscriptions/me — 구독 해지

활성 구독의 상태를 `cancelled`로 변경하고 자동 갱신을 비활성화합니다. 구독은 만료일까지 유지됩니다.

### Flowchart

```mermaid
flowchart TD
    A[Client] -->|"DELETE /api/subscriptions/me<br/>Authorization: Bearer token"| B[JwtAuthGuard]
    B --> C[SubscriptionController.cancelSubscription]
    C --> D[SubscriptionService.cancelSubscription]
    D --> E["1. 구독 조회<br/>getMySubscription(user)"]
    E --> F{구독 존재?}
    F -- No --> G["404 Not Found"]
    F -- Yes --> H{status = 'active'?}
    H -- No --> I["409 Conflict<br/>'구독이 활성 상태가 아님'"]
    H -- Yes --> J["2. Admin Client<br/>UPDATE subscriptions<br/>SET status = 'cancelled',<br/>auto_renew = false<br/>WHERE id = subscription.id"]
    J --> K["204 No Content"]

    style A fill:#2196f3,color:#fff
    style G fill:#f44336,color:#fff
    style I fill:#f44336,color:#fff
    style K fill:#4caf50,color:#fff
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

```mermaid
flowchart TD
    A["WebhookController<br/>(BILLING_STATUS_CHANGED)"] --> B[SubscriptionService.renewSubscription]
    B --> C["Admin Client<br/>SELECT * FROM subscriptions<br/>WHERE user_id = ? AND status = 'active'<br/>AND auto_renew = true"]
    C --> D{갱신 대상 존재?}
    D -- No --> E[조용히 종료]
    D -- Yes --> F["TossService.requestBilling()<br/>orderId: renew_{userId}_{timestamp}<br/>orderName: '뚝딱동화 {planName} 갱신'"]
    F --> G{결제 성공?}
    G -- Yes --> H["UPDATE subscriptions<br/>SET expires_at += durationDays"]
    G -- No --> I["UPDATE subscriptions<br/>SET status = 'expired',<br/>auto_renew = false"]

    style A fill:#ff9800,color:#fff
    style H fill:#4caf50,color:#fff
    style I fill:#f44336,color:#fff
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
