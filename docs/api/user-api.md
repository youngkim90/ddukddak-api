# 사용자 API (User)

> `src/user/` — 프로필 조회, 수정, 회원 탈퇴

---

## 엔드포인트 요약

| 메서드 | 경로 | 설명 | 인증 |
|--------|------|------|------|
| GET | `/api/users/me` | 내 프로필 조회 | 🔒 |
| PATCH | `/api/users/me` | 프로필 수정 | 🔒 |
| DELETE | `/api/users/me` | 회원 탈퇴 | 🔒 |

---

## GET /api/users/me — 프로필 조회

JWT 인증 사용자의 프로필을 조회합니다. `users` 테이블에 레코드가 없으면 Supabase Auth 메타데이터에서 기본 정보를 반환합니다.

### Flowchart

```mermaid
flowchart TD
    A[Client] -->|"GET /api/users/me<br/>Authorization: Bearer token"| B[JwtAuthGuard]
    B --> C[UserController.getProfile]
    C --> D[UserService.getProfile]
    D --> E["Admin Client<br/>SELECT * FROM users<br/>WHERE id = user.id"]
    E --> F{users 레코드 존재?}
    F -- Yes --> G[DB 데이터로 응답 매핑]
    F -- No --> H["Supabase Auth 메타데이터<br/>(user_metadata, app_metadata)<br/>에서 기본 정보 추출"]
    H --> G
    G --> I["200 OK<br/>UserResponseDto"]

    style A fill:#2196f3,color:#fff
    style I fill:#4caf50,color:#fff
```

### 요청

- **Headers**: `Authorization: Bearer <token>`
- **Parameters**: 없음
- **Body**: 없음

### 응답

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "nickname": "홍길동",
  "avatarUrl": "https://...",
  "provider": "kakao",
  "createdAt": "2026-01-01T00:00:00.000Z"
}
```

---

## PATCH /api/users/me — 프로필 수정

프로필 정보를 수정합니다. `users` 테이블에 레코드가 없으면 자동으로 생성됩니다 (upsert).

### Flowchart

```mermaid
flowchart TD
    A[Client] -->|"PATCH /api/users/me<br/>Authorization: Bearer token<br/>Body: UpdateUserDto"| B[JwtAuthGuard]
    B --> C[ValidationPipe<br/>nickname, avatarUrl 검증]
    C --> D[UserController.updateProfile]
    D --> E[UserService.updateProfile]
    E --> F["Admin Client<br/>UPSERT INTO users<br/>(id, email, nickname, avatar_url, updated_at)<br/>ON CONFLICT (id) DO UPDATE"]
    F --> G{Supabase 에러?}
    G -- Yes --> H["500 Internal Server Error<br/>'Failed to update profile'"]
    G -- No --> I[업데이트된 데이터로 응답 매핑]
    I --> J["200 OK<br/>UserResponseDto"]

    style A fill:#2196f3,color:#fff
    style H fill:#f44336,color:#fff
    style J fill:#4caf50,color:#fff
```

### 요청

- **Headers**: `Authorization: Bearer <token>`
- **Parameters**: 없음
- **Body**:

```json
{
  "nickname": "새닉네임",
  "avatarUrl": "https://..."
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `nickname` | string | - | 최대 50자 |
| `avatarUrl` | string | - | URL 형식 |

### 응답

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "nickname": "새닉네임",
  "avatarUrl": "https://...",
  "provider": "kakao",
  "createdAt": "2026-01-01T00:00:00.000Z"
}
```

---

## DELETE /api/users/me — 회원 탈퇴

`users` 테이블 레코드 삭제 후, Supabase Auth에서도 사용자를 삭제합니다.

### Flowchart

```mermaid
flowchart TD
    A[Client] -->|"DELETE /api/users/me<br/>Authorization: Bearer token"| B[JwtAuthGuard]
    B --> C[UserController.deleteAccount]
    C --> D[UserService.deleteAccount]
    D --> E["1. Admin Client<br/>DELETE FROM users<br/>WHERE id = user.id"]
    E --> F["2. Supabase Auth<br/>auth.admin.deleteUser(user.id)"]
    F --> G{Auth 삭제 성공?}
    G -- Yes --> H["204 No Content"]
    G -- No --> I["500 Internal Server Error<br/>'Failed to delete account'"]

    style A fill:#2196f3,color:#fff
    style H fill:#4caf50,color:#fff
    style I fill:#f44336,color:#fff
```

### 요청

- **Headers**: `Authorization: Bearer <token>`
- **Parameters**: 없음
- **Body**: 없음

### 응답

- **204 No Content** (성공 시 Body 없음)

---

## 관련 DB 테이블

```sql
users
├── id          UUID    PK   -- Supabase Auth UID와 동일
├── email       TEXT
├── nickname    TEXT         -- nullable
├── avatar_url  TEXT         -- nullable
├── provider    TEXT         -- 'email' | 'kakao' | 'google'
└── created_at  TIMESTAMPTZ
```
