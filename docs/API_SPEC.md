# 뚝딱동화 API 명세서

> 프론트엔드 연동용 API 명세 (프롱님 참고용)

**Base URL**: `http://localhost:4000/api` (개발)
**Swagger**: `http://localhost:4000/docs` (개발 환경에서만)

---

## 인증 방식

모든 인증이 필요한 API는 `Authorization` 헤더에 Supabase Auth JWT 토큰을 포함해야 합니다.

```
Authorization: Bearer <supabase_access_token>
```

**인증 레벨:**
- 🔓 공개 (Public) - 인증 불필요
- 🔒 인증 필요 (Auth Required) - JWT 토큰 필요
- 💎 구독 필요 (Subscription Required) - JWT + 활성 구독

---

## 응답 타입 정의

### Story

```typescript
interface Story {
  id: string;
  title: string;           // 제목 (한국어)
  titleEn: string;         // 제목 (영어)
  description: string;     // 설명 (한국어)
  descriptionEn: string;   // 설명 (영어)
  thumbnailUrl: string;
  category: 'adventure' | 'lesson' | 'emotion' | 'creativity';
  ageGroup: '3-5' | '5-7' | '7+';
  duration: number;        // 분 단위
  pageCount: number;
  isLocked: boolean;       // true = 구독 필요 콘텐츠
  createdAt: string;
}
```

### StoryPage

```typescript
interface StoryPage {
  id: string;
  pageNumber: number;
  imageUrl: string;
  textKo: string;
  textEn: string;
  audioUrlKo?: string;
  audioUrlEn?: string;
}
```

### User

```typescript
interface User {
  id: string;
  email: string;
  nickname?: string;
  avatarUrl?: string;
  provider: 'email' | 'kakao' | 'google' | 'apple';
  createdAt: string;
}
```

### Subscription

```typescript
interface Subscription {
  id: string;
  planType: 'monthly' | 'yearly';
  status: 'active' | 'cancelled' | 'expired';
  startedAt: string;
  expiresAt: string;
  autoRenew: boolean;
}
```

---

## API 엔드포인트

### 1. 사용자 (Users)

#### GET /api/users/me 🔒
내 프로필 조회

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "nickname": "동화아이",
  "avatarUrl": "https://...",
  "provider": "kakao",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

#### PATCH /api/users/me 🔒
프로필 수정

**Request Body:**
```json
{
  "nickname": "새이름",
  "avatarUrl": "https://..."
}
```

#### DELETE /api/users/me 🔒
회원 탈퇴

---

### 2. 동화 (Stories)

#### GET /api/stories 🔓
동화 목록 조회

**Query Parameters:**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| category | string | ❌ | adventure, lesson, emotion, creativity |
| ageGroup | string | ❌ | 3-5, 5-7, 7+ |
| page | number | ❌ | 페이지 번호 (기본값: 1) |
| limit | number | ❌ | 페이지당 개수 (기본값: 10) |

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "아기돼지 삼형제",
      "titleEn": "Three Little Pigs",
      "description": "세 마리 돼지의 지혜 이야기",
      "descriptionEn": "A story of three wise pigs",
      "thumbnailUrl": "https://...",
      "category": "lesson",
      "ageGroup": "3-5",
      "duration": 10,
      "pageCount": 12,
      "isLocked": false
    }
  ],
  "meta": {
    "total": 50,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

#### GET /api/stories/:id 🔓
동화 상세 조회

**Response:**
```json
{
  "id": "uuid",
  "title": "아기돼지 삼형제",
  "titleEn": "Three Little Pigs",
  "description": "세 마리 돼지의 지혜 이야기",
  "descriptionEn": "A story of three wise pigs",
  "thumbnailUrl": "https://...",
  "category": "lesson",
  "ageGroup": "3-5",
  "duration": 10,
  "pageCount": 12,
  "isLocked": false,
  "createdAt": "2024-01-01T00:00:00Z"
}
```

#### GET /api/stories/:id/pages 💎
동화 페이지 콘텐츠 조회 (뷰어용)

**Response:**
```json
{
  "storyId": "uuid",
  "pages": [
    {
      "id": "uuid",
      "pageNumber": 1,
      "imageUrl": "https://...",
      "textKo": "옛날 옛적에 아기돼지 삼형제가 살았어요.",
      "textEn": "Once upon a time, there were three little pigs.",
      "audioUrlKo": "https://...",
      "audioUrlEn": "https://..."
    }
  ]
}
```

---

### 3. 진행률 (Progress)

#### GET /api/progress 🔒
내 진행률 목록

**Response:**
```json
{
  "data": [
    {
      "storyId": "uuid",
      "storyTitle": "아기돼지 삼형제",
      "currentPage": 5,
      "totalPages": 12,
      "isCompleted": false,
      "lastReadAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### GET /api/progress/:storyId 🔒
특정 동화 진행률 조회

#### PUT /api/progress/:storyId 🔒
진행률 저장

**Request Body:**
```json
{
  "currentPage": 5,
  "isCompleted": false
}
```

---

### 4. 구독 (Subscriptions)

#### GET /api/subscriptions/plans 🔓
구독 플랜 목록

**Response:**
```json
{
  "plans": [
    {
      "id": "monthly",
      "name": "월간 구독",
      "price": 9900,
      "period": "monthly",
      "features": ["모든 동화 무제한", "오프라인 저장"]
    },
    {
      "id": "yearly",
      "name": "연간 구독",
      "price": 99000,
      "period": "yearly",
      "features": ["모든 동화 무제한", "오프라인 저장", "2개월 무료"]
    }
  ]
}
```

#### GET /api/subscriptions/me 🔒
내 구독 정보

**Response:**
```json
{
  "id": "uuid",
  "planType": "monthly",
  "status": "active",
  "startedAt": "2024-01-01T00:00:00Z",
  "expiresAt": "2024-02-01T00:00:00Z",
  "autoRenew": true
}
```

#### POST /api/subscriptions 🔒
구독 시작 (결제)

**Request Body:**
```json
{
  "planType": "monthly",
  "billingKey": "toss_billing_key"
}
```

#### DELETE /api/subscriptions/me 🔒
구독 해지

---

## 에러 응답

모든 에러는 다음 형식을 따릅니다:

```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Invalid or expired token"
}
```

**주요 에러 코드:**
| 코드 | 의미 |
|------|------|
| 400 | Bad Request - 잘못된 요청 |
| 401 | Unauthorized - 인증 실패 |
| 403 | Forbidden - 권한 없음 (구독 필요 등) |
| 404 | Not Found - 리소스 없음 |
| 500 | Internal Server Error - 서버 오류 |

---

## 개발 현황

| API | 상태 | 비고 |
|-----|------|------|
| GET /api/users/me | ✅ 완료 | |
| PATCH /api/users/me | ✅ 완료 | |
| DELETE /api/users/me | ✅ 완료 | |
| GET /api/stories | ⬜ 대기 | |
| GET /api/stories/:id | ⬜ 대기 | |
| GET /api/stories/:id/pages | ⬜ 대기 | |
| GET /api/progress | ⬜ 대기 | |
| GET /api/progress/:storyId | ⬜ 대기 | |
| PUT /api/progress/:storyId | ⬜ 대기 | |
| GET /api/subscriptions/plans | ⬜ 대기 | |
| GET /api/subscriptions/me | ⬜ 대기 | |
| POST /api/subscriptions | ⬜ 대기 | |
| DELETE /api/subscriptions/me | ⬜ 대기 | |

---

*마지막 업데이트: 2026-01-25*
