# 동화 API (Story)

> `src/story/` — 동화 목록, 상세, 페이지 조회

---

## 엔드포인트 요약

| 메서드 | 경로 | 설명 | 인증 |
|--------|------|------|------|
| GET | `/api/stories` | 동화 목록 (필터, 페이지네이션) | 🔓 |
| GET | `/api/stories/:id` | 동화 상세 | 🔓 |
| GET | `/api/stories/:id/pages` | 동화 페이지 (뷰어용) | 💎 |

---

## GET /api/stories — 동화 목록 조회

카테고리, 연령대 필터와 페이지네이션을 지원합니다.

### API 흐름

```mermaid
flowchart TD
    A[Client 요청] --> B[공개 API - 인증 불필요]
    B --> C[쿼리 파라미터 검증]
    C --> D[필터 + 페이지네이션 적용]
    D --> E[200 OK - 목록 + 페이지 정보]

    style A fill:#2196f3,color:#fff
    style E fill:#4caf50,color:#fff
```

### 코드 흐름

```mermaid
flowchart TD
    A[StoryController.findAll] --> B[ValidationPipe — StoryQueryDto 검증]
    B --> C[StoryService.findAll]
    C --> D[SupabasePublic → stories 테이블 조회]
    D --> E[카테고리/연령대 필터 적용]
    E --> F[페이지네이션 계산]
    F --> G[StoryListResponseDto 반환]
```

### 요청

- **Headers**: 없음 (공개 API)
- **Parameters**:

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|---------|------|------|--------|------|
| `category` | enum | - | - | `folktale`, `lesson`, `family`, `adventure`, `creativity` |
| `ageGroup` | enum | - | - | `3-5`, `5-7`, `7+` |
| `page` | number | - | 1 | 최소 1 |
| `limit` | number | - | 10 | 최소 1, 최대 50 |

- **Body**: 없음

### 응답

```json
{
  "stories": [
    {
      "id": "uuid",
      "titleKo": "토끼와 거북이",
      "titleEn": "The Tortoise and the Hare",
      "descriptionKo": "...",
      "descriptionEn": "...",
      "thumbnailUrl": "https://...",
      "category": "lesson",
      "ageGroup": "3-5",
      "pageCount": 12,
      "durationMinutes": 5,
      "isFree": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

## GET /api/stories/:id — 동화 상세 조회

단일 동화의 상세 정보를 조회합니다.

### API 흐름

```mermaid
flowchart TD
    A[Client 요청] --> B[공개 API - 인증 불필요]
    B --> C{동화 존재?}
    C -- Yes --> D[200 OK]
    C -- No --> E[404 Not Found]

    style A fill:#2196f3,color:#fff
    style D fill:#4caf50,color:#fff
    style E fill:#f44336,color:#fff
```

### 코드 흐름

```mermaid
flowchart TD
    A[StoryController.findOne] --> B[StoryService.findOne]
    B --> C[SupabasePublic → stories 테이블 조회]
    C --> D{데이터 존재?}
    D -- Yes --> E[StoryResponseDto 반환]
    D -- No --> F[NotFoundException throw]
```

### 요청

- **Headers**: 없음 (공개 API)
- **Parameters**: `id` (UUID, path parameter)
- **Body**: 없음

### 응답

```json
{
  "id": "uuid",
  "titleKo": "토끼와 거북이",
  "titleEn": "The Tortoise and the Hare",
  "descriptionKo": "...",
  "descriptionEn": "...",
  "thumbnailUrl": "https://...",
  "category": "lesson",
  "ageGroup": "3-5",
  "pageCount": 12,
  "durationMinutes": 5,
  "isFree": true,
  "createdAt": "2026-01-01T00:00:00.000Z"
}
```

---

## GET /api/stories/:id/pages — 동화 페이지 조회

동화 뷰어용 페이지 데이터를 조회합니다. JWT 인증과 구독 검증이 필요하며, 무료 동화는 구독 없이도 접근 가능합니다.

### API 흐름

```mermaid
flowchart TD
    A[Client 요청] --> B[JWT 인증]
    B --> C{활성 구독 또는 무료 동화?}
    C -- No --> D[403 Forbidden]
    C -- Yes --> E{동화 존재?}
    E -- No --> F[404 Not Found]
    E -- Yes --> G[200 OK - 페이지 목록]

    style A fill:#2196f3,color:#fff
    style D fill:#f44336,color:#fff
    style F fill:#f44336,color:#fff
    style G fill:#4caf50,color:#fff
```

### 코드 흐름

```mermaid
flowchart TD
    A[JwtAuthGuard] --> B[SubscriptionGuard — 구독/무료 확인]
    B --> C[StoryController.findPages]
    C --> D[StoryService.findPages]
    D --> E[SupabasePublic → stories 존재 확인]
    E --> F["SupabasePublic → story_pages + story_page_sentences(*) 조회"]
    F --> G[sentence_index 오름차순 정렬]
    G --> H[StoryPagesResponseDto 반환]
```

### 요청

- **Headers**: `Authorization: Bearer <token>`
- **Parameters**: `id` (UUID, path parameter)
- **Body**: 없음

### 응답

```json
{
  "storyId": "uuid",
  "pages": [
    {
      "id": "uuid",
      "pageNumber": 1,
      "imageUrl": "https://...",
      "textKo": "옛날 옛적에...",
      "textEn": "Once upon a time...",
      "mediaType": "image",
      "videoUrl": null,
      "audioUrlKo": "https://...",
      "audioUrlEn": "https://...",
      "sentences": [
        {
          "sentenceIndex": 0,
          "textKo": "옛날 옛적에",
          "textEn": "Once upon a time,",
          "audioUrlKo": "https://..."
        }
      ]
    }
  ]
}
```

> `sentences`는 항상 배열. 없으면 `[]`. `audioUrlKo/En`은 Phase 2에서 제거 예정.

---

## 관련 DB 테이블

```sql
stories
├── id                UUID    PK
├── title_ko          TEXT
├── title_en          TEXT
├── description_ko    TEXT
├── description_en    TEXT
├── category          TEXT    -- 'folktale' | 'lesson' | 'family' | 'adventure' | 'creativity'
├── age_group         TEXT    -- '3-5' | '5-7' | '7+'
├── thumbnail_url     TEXT
├── is_free           BOOLEAN -- default false
├── page_count        INT
├── duration_minutes  INT
├── bgm_url           TEXT
└── created_at        TIMESTAMPTZ

story_pages
├── id            UUID    PK
├── story_id      UUID    FK → stories.id
├── page_number   INT
├── media_type    TEXT    -- 'image' | 'video' (DEFAULT 'image')
├── image_url     TEXT
├── video_url     TEXT    -- AI 영상 MP4 URL (nullable)
├── text_ko       TEXT    -- 페이지 전체 텍스트 (하위 호환)
├── text_en       TEXT
├── audio_url_ko  TEXT    -- Phase 2에서 제거 예정
└── audio_url_en  TEXT    -- Phase 2에서 제거 예정

story_page_sentences              -- 문장 단위 TTS
├── id              UUID    PK
├── page_id         UUID    FK → story_pages.id ON DELETE CASCADE
├── sentence_index  INT     -- 0-based, UNIQUE(page_id, sentence_index)
├── text_ko         TEXT
├── text_en         TEXT
├── audio_url_ko    TEXT
└── audio_url_en    TEXT
```
