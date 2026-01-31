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

### Flowchart

```mermaid
flowchart TD
    A[Client] -->|"GET /api/stories?category=adventure&page=1&limit=10"| B["@Public — JwtAuthGuard 스킵"]
    B --> C["ValidationPipe<br/>StoryQueryDto 검증/변환"]
    C --> D[StoryController.findAll]
    D --> E[StoryService.findAll]
    E --> F{category 필터?}
    F -- Yes --> G["쿼리에 .eq('category', value) 추가"]
    F -- No --> G2[필터 없이 진행]
    G --> H{ageGroup 필터?}
    G2 --> H
    H -- Yes --> I["쿼리에 .eq('age_group', value) 추가"]
    H -- No --> I2[필터 없이 진행]
    I --> J["Public Client<br/>SELECT *, count<br/>FROM stories<br/>ORDER BY created_at DESC<br/>RANGE(offset, offset+limit-1)"]
    I2 --> J
    J --> K[페이지네이션 계산<br/>totalPages, hasNext, hasPrev]
    K --> L["200 OK<br/>StoryListResponseDto"]

    style A fill:#2196f3,color:#fff
    style L fill:#4caf50,color:#fff
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

### Flowchart

```mermaid
flowchart TD
    A[Client] -->|"GET /api/stories/:id"| B["@Public — JwtAuthGuard 스킵"]
    B --> C[StoryController.findOne]
    C --> D[StoryService.findOne]
    D --> E["Public Client<br/>SELECT * FROM stories<br/>WHERE id = :id"]
    E --> F{동화 존재?}
    F -- Yes --> G["200 OK<br/>StoryResponseDto"]
    F -- No --> H["404 Not Found"]

    style A fill:#2196f3,color:#fff
    style G fill:#4caf50,color:#fff
    style H fill:#f44336,color:#fff
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

동화 뷰어용 페이지 데이터를 조회합니다. JWT 인증과 구독 검증(`@RequireSubscription`)이 필요합니다. 무료 동화(`is_free = true`)는 구독 없이도 접근 가능합니다.

### Flowchart

```mermaid
flowchart TD
    A[Client] -->|"GET /api/stories/:id/pages<br/>Authorization: Bearer token"| B[JwtAuthGuard]
    B --> C["SubscriptionGuard<br/>(@RequireSubscription)"]
    C --> D{활성 구독 또는<br/>무료 동화?}
    D -- No --> E["403 Forbidden<br/>'Active subscription required<br/>to access this content'"]
    D -- Yes --> F[StoryController.findPages]
    F --> G[StoryService.findPages]
    G --> H["Public Client<br/>SELECT id FROM stories<br/>WHERE id = :id"]
    H --> I{동화 존재?}
    I -- No --> J["404 Not Found"]
    I -- Yes --> K["Public Client<br/>SELECT * FROM story_pages<br/>WHERE story_id = :id<br/>ORDER BY page_number ASC"]
    K --> L["200 OK<br/>StoryPagesResponseDto"]

    style A fill:#2196f3,color:#fff
    style E fill:#f44336,color:#fff
    style J fill:#f44336,color:#fff
    style L fill:#4caf50,color:#fff
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
      "audioUrlKo": "https://...",
      "audioUrlEn": "https://..."
    }
  ]
}
```

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
└── created_at        TIMESTAMPTZ

story_pages
├── id            UUID    PK
├── story_id      UUID    FK → stories.id
├── page_number   INT
├── image_url     TEXT
├── text_ko       TEXT
├── text_en       TEXT
├── audio_url_ko  TEXT
└── audio_url_en  TEXT
```
