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

### API 흐름

```mermaid
flowchart TD
    A[Client 요청] --> B[JWT 인증]
    B --> C{프로필 존재?}
    C -- Yes --> D[DB 프로필 반환]
    C -- No --> E[Auth 기본 정보 반환]
    D --> F[200 OK]
    E --> F

    style A fill:#2196f3,color:#fff
    style F fill:#4caf50,color:#fff
```

### 코드 흐름

```mermaid
flowchart TD
    A[UserController.getProfile] --> B[UserService.getProfile]
    B --> C[SupabaseAdmin → users 테이블 조회]
    C --> D{데이터 존재?}
    D -- Yes --> E[DB 레코드 매핑]
    D -- No --> F[Supabase Auth user_metadata 매핑]
    E --> G[UserResponseDto 반환]
    F --> G
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

### API 흐름

```mermaid
flowchart TD
    A[Client 요청] --> B[JWT 인증]
    B --> C[입력값 검증]
    C --> D[프로필 저장]
    D --> E{성공?}
    E -- Yes --> F[200 OK]
    E -- No --> G[500 Error]

    style A fill:#2196f3,color:#fff
    style F fill:#4caf50,color:#fff
    style G fill:#f44336,color:#fff
```

### 코드 흐름

```mermaid
flowchart TD
    A[UserController.updateProfile] --> B[ValidationPipe — UpdateUserDto 검증]
    B --> C[UserService.updateProfile]
    C --> D[SupabaseAdmin → users 테이블 upsert]
    D --> E[UserResponseDto 반환]
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

### API 흐름

```mermaid
flowchart TD
    A[Client 요청] --> B[JWT 인증]
    B --> C[계정 삭제 처리]
    C --> D{성공?}
    D -- Yes --> E[204 No Content]
    D -- No --> F[500 Error]

    style A fill:#2196f3,color:#fff
    style E fill:#4caf50,color:#fff
    style F fill:#f44336,color:#fff
```

### 코드 흐름

```mermaid
flowchart TD
    A[UserController.deleteAccount] --> B[UserService.deleteAccount]
    B --> C[SupabaseAdmin → users 테이블 삭제]
    C --> D[Supabase Auth → admin.deleteUser 호출]
    D --> E[204 No Content]
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
