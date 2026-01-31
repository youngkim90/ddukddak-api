# 진행률 API (Progress)

> `src/progress/` — 읽기 진행률 목록, 조회, 저장

---

## 엔드포인트 요약

| 메서드 | 경로 | 설명 | 인증 |
|--------|------|------|------|
| GET | `/api/progress` | 내 진행률 목록 | 🔒 |
| GET | `/api/progress/:storyId` | 특정 동화 진행률 | 🔒 |
| PUT | `/api/progress/:storyId` | 진행률 저장 (upsert) | 🔒 |

---

## GET /api/progress — 전체 진행률 목록

사용자의 모든 읽기 진행률을 동화 제목, 전체 페이지 수와 함께 반환합니다.

### API 흐름

```mermaid
flowchart TD
    A[Client 요청] --> B[JWT 인증]
    B --> C[진행률 목록 조회]
    C --> D[200 OK - 진행률 + 동화 정보]

    style A fill:#2196f3,color:#fff
    style D fill:#4caf50,color:#fff
```

### 코드 흐름

```mermaid
flowchart TD
    A[ProgressController.findAll] --> B[ProgressService.findAll]
    B --> C[SupabaseAdmin → reading_progress + stories JOIN 조회]
    C --> D[last_read_at 기준 내림차순 정렬]
    D --> E[ProgressListResponseDto 반환]
```

### 요청

- **Headers**: `Authorization: Bearer <token>`
- **Parameters**: 없음
- **Body**: 없음

### 응답

```json
{
  "data": [
    {
      "storyId": "uuid",
      "storyTitle": "토끼와 거북이",
      "currentPage": 5,
      "totalPages": 12,
      "isCompleted": false,
      "lastReadAt": "2026-01-30T15:30:00.000Z"
    }
  ]
}
```

---

## GET /api/progress/:storyId — 특정 동화 진행률

특정 동화에 대한 진행률을 조회합니다.

### API 흐름

```mermaid
flowchart TD
    A[Client 요청] --> B[JWT 인증]
    B --> C{진행률 존재?}
    C -- Yes --> D[200 OK]
    C -- No --> E[404 Not Found]

    style A fill:#2196f3,color:#fff
    style D fill:#4caf50,color:#fff
    style E fill:#f44336,color:#fff
```

### 코드 흐름

```mermaid
flowchart TD
    A[ProgressController.findOne] --> B[ProgressService.findOne]
    B --> C[SupabaseAdmin → reading_progress + stories JOIN 조회]
    C --> D{데이터 존재?}
    D -- Yes --> E[ProgressResponseDto 반환]
    D -- No --> F[NotFoundException throw]
```

### 요청

- **Headers**: `Authorization: Bearer <token>`
- **Parameters**: `storyId` (UUID, path parameter)
- **Body**: 없음

### 응답

```json
{
  "storyId": "uuid",
  "storyTitle": "토끼와 거북이",
  "currentPage": 5,
  "totalPages": 12,
  "isCompleted": false,
  "lastReadAt": "2026-01-30T15:30:00.000Z"
}
```

---

## PUT /api/progress/:storyId — 진행률 저장

진행률을 저장합니다. 기존 레코드가 있으면 업데이트하고 없으면 새로 생성합니다 (upsert).

### API 흐름

```mermaid
flowchart TD
    A[Client 요청] --> B[JWT 인증]
    B --> C[입력값 검증]
    C --> D{동화 존재?}
    D -- No --> E[404 Not Found]
    D -- Yes --> F[진행률 저장]
    F --> G{성공?}
    G -- Yes --> H[200 OK]
    G -- No --> I[500 Error]

    style A fill:#2196f3,color:#fff
    style E fill:#f44336,color:#fff
    style H fill:#4caf50,color:#fff
    style I fill:#f44336,color:#fff
```

### 코드 흐름

```mermaid
flowchart TD
    A[ProgressController.upsert] --> B[ValidationPipe — UpdateProgressDto 검증]
    B --> C[ProgressService.upsert]
    C --> D[SupabaseAdmin → stories 존재 확인]
    D --> E["SupabaseAdmin → reading_progress upsert<br/>(user_id, story_id 유니크 제약)"]
    E --> F[ProgressResponseDto 반환]
```

### 요청

- **Headers**: `Authorization: Bearer <token>`
- **Parameters**: `storyId` (UUID, path parameter)
- **Body**:

```json
{
  "currentPage": 5,
  "isCompleted": false
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `currentPage` | number | ✅ | 최소 1, 정수 |
| `isCompleted` | boolean | - | 기본값 false |

### 응답

```json
{
  "storyId": "uuid",
  "storyTitle": "토끼와 거북이",
  "currentPage": 5,
  "totalPages": 12,
  "isCompleted": false,
  "lastReadAt": "2026-01-30T15:30:00.000Z"
}
```

---

## 관련 DB 테이블

```sql
reading_progress
├── id            UUID    PK
├── user_id       UUID    FK → users.id
├── story_id      UUID    FK → stories.id
├── current_page  INT
├── is_completed  BOOLEAN
├── last_read_at  TIMESTAMPTZ
└── UNIQUE(user_id, story_id)
```
