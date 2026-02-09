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
  titleKo: string;         // 제목 (한국어)
  titleEn: string;         // 제목 (영어)
  descriptionKo: string;   // 설명 (한국어)
  descriptionEn: string;   // 설명 (영어)
  thumbnailUrl: string;
  category: 'folktale' | 'lesson' | 'family' | 'adventure' | 'creativity';
  ageGroup: '3-5' | '5-7' | '7+';
  durationMinutes: number; // 재생 시간 (분)
  pageCount: number;
  isFree: boolean;         // true = 무료 콘텐츠
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
  mediaType: 'image' | 'video';
  videoUrl?: string;
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
| category | string | ❌ | folktale, lesson, family, adventure, creativity |
| ageGroup | string | ❌ | 3-5, 5-7, 7+ |
| page | number | ❌ | 페이지 번호 (기본값: 1) |
| limit | number | ❌ | 페이지당 개수 (기본값: 10) |

**Response:**
```json
{
  "stories": [
    {
      "id": "uuid",
      "titleKo": "아기돼지 삼형제",
      "titleEn": "Three Little Pigs",
      "descriptionKo": "세 마리 돼지의 지혜 이야기",
      "descriptionEn": "A story of three wise pigs",
      "thumbnailUrl": "https://...",
      "category": "lesson",
      "ageGroup": "3-5",
      "durationMinutes": 10,
      "pageCount": 12,
      "isFree": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

#### GET /api/stories/:id 🔓
동화 상세 조회

**Response:**
```json
{
  "id": "uuid",
  "titleKo": "아기돼지 삼형제",
  "titleEn": "Three Little Pigs",
  "descriptionKo": "세 마리 돼지의 지혜 이야기",
  "descriptionEn": "A story of three wise pigs",
  "thumbnailUrl": "https://...",
  "category": "lesson",
  "ageGroup": "3-5",
  "durationMinutes": 10,
  "pageCount": 12,
  "isFree": true,
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
      "mediaType": "image",
      "videoUrl": null,
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

#### DELETE /api/progress 🔒
전체 진행률 초기화 (로그인 시 호출용)

**Response:**
```json
{
  "message": "All progress reset successfully"
}
```

> 인증된 사용자의 모든 동화 읽기 진행률을 삭제합니다. 프론트에서 로그인 성공 후 호출하면 모든 동화가 1페이지부터 다시 시작됩니다.

---

### 4. 구독 (Subscriptions)

#### GET /api/subscriptions/plans 🔓
구독 플랜 목록

**Response:**
```json
{
  "plans": [
    {
      "id": "free",
      "name": "무료",
      "price": 0,
      "period": null,
      "features": ["동화 5편 이용"]
    },
    {
      "id": "monthly",
      "name": "월 구독",
      "price": 4900,
      "period": "month",
      "features": ["모든 동화 무제한", "오프라인 저장", "광고 제거"]
    },
    {
      "id": "yearly",
      "name": "연 구독",
      "price": 39000,
      "period": "year",
      "features": ["모든 동화 무제한", "오프라인 저장", "광고 제거", "2개월 무료"]
    }
  ]
}
```

#### GET /api/subscriptions/me 🔒
내 구독 정보

**Response (구독 있는 경우):**
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

**Response (구독 없는 경우):**
```json
{
  "subscription": null
}
```

> ℹ️ 구독이 없으면 404가 아닌 `{ subscription: null }`을 반환합니다.

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

## 프론트엔드 연동 가이드

### axios 설정 예시

```typescript
// lib/api.ts
import axios from 'axios';
import { supabase } from './supabase';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api',
});

// 요청 인터셉터: 토큰 자동 추가
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

// 응답 인터셉터: 에러 처리
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 로그인 페이지로 리다이렉트
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### 환경 변수

```env
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

---

## 구독/결제 플로우

### 빌링키 발급 (프론트에서 처리)

```typescript
// 토스페이먼츠 SDK로 카드 등록 → 빌링키 발급
// 1. 토스페이먼츠 결제창 호출
// 2. 사용자가 카드 정보 입력
// 3. 성공 시 billingKey 반환
// 4. billingKey를 POST /api/subscriptions에 전달
```

> ⚠️ **현재 상태**: 토스페이먼츠 실제 연동은 스켈레톤 구현입니다.
> 프론트 UI 완성 후 실제 API 연동 예정입니다.

---

## 개발 현황

| API | 상태 | 프론트 연동 | 비고 |
|-----|------|------------|------|
| GET /api/users/me | ✅ 완료 | ✅ 완료 | |
| PATCH /api/users/me | ✅ 완료 | ✅ 완료 | |
| DELETE /api/users/me | ✅ 완료 | ✅ 완료 | |
| GET /api/stories | ✅ 완료 | ✅ 완료 | 필터, 페이지네이션 |
| GET /api/stories/:id | ✅ 완료 | ✅ 완료 | |
| GET /api/stories/:id/pages | ✅ 완료 | ✅ 완료 | 무료 동화는 구독 없이 접근 가능 |
| GET /api/progress | ✅ 완료 | ✅ 완료 | |
| GET /api/progress/:storyId | ✅ 완료 | ✅ 완료 | 진행률 없으면 404 |
| PUT /api/progress/:storyId | ✅ 완료 | ✅ 완료 | upsert 방식 |
| DELETE /api/progress | ✅ 완료 | ⏳ 대기 | 전체 진행률 초기화 (로그인 시) |
| GET /api/subscriptions/plans | ✅ 완료 | ✅ 완료 | |
| GET /api/subscriptions/me | ✅ 완료 | ✅ 완료 | 구독 없으면 `{ subscription: null }` |
| POST /api/subscriptions | 🔄 스켈레톤 | ⏳ 대기 | 토스 실제 연동 대기 |
| DELETE /api/subscriptions/me | ✅ 완료 | ✅ 완료 | |

---

## 주의사항

1. **인증 토큰 만료**: Supabase 토큰 만료 시 401 응답. 프론트에서 자동 갱신 처리 필요.

2. **구독 체크**: `GET /api/stories/:id/pages` 호출 시
   - `isFree: true` 동화 → 바로 접근 가능
   - `isFree: false` 동화 → 활성 구독 필요 (403 반환)

3. **에러 메시지 형식**: `message`는 `string` 또는 `string[]`일 수 있음
   ```typescript
   // validation 에러 시
   { message: ["nickname must be shorter than 50 characters"] }

   // 일반 에러 시
   { message: "Not found" }
   ```

4. **날짜 형식**: 모든 날짜는 ISO 8601 형식 (`2024-01-25T10:30:00.000Z`)

---

*마지막 업데이트: 2026-02-09*
