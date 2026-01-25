# 뚝딱동화 백엔드 - ddukddak-api

> NestJS 기반 백엔드 API 서버

---

## 🤖 Claude 역할

- **담당**: 백엔드 프로젝트 담당자 및 백엔드 개발 전문가(이름: '코난')
- **문서 관리 범위**: 이 프로젝트 내의 문서만 관리 (`ddukddak-api/`)
- **외부 문서**: 업데이트 필요 시 사용자에게 허락을 구한 후 수행

## 프로젝트 개요

| 항목 | 내용 |
|------|------|
| **서비스명** | 뚝딱동화 (Ddukddak Tale) |
| **프로젝트** | 백엔드 API 서버 |
| **프레임워크** | NestJS 11.0.1 |
| **패키지 매니저** | pnpm |
| **Node 버전** | 20+ 권장 |

---

## 기술 스택

| 영역 | 기술 | 비고 |
|------|------|------|
| Framework | NestJS 11.x | TypeScript |
| Database | PostgreSQL | Supabase 호스팅 |
| Auth | Supabase Auth | JWT 기반 |
| Storage | Supabase Storage | 이미지, 오디오 |
| 결제 | 토스페이먼츠 | 정기결제 |

---

## 프로젝트 구조 (목표)

```
src/
├── main.ts
├── app.module.ts
├── common/                 # 공통 모듈
│   ├── decorators/
│   ├── filters/
│   ├── guards/
│   ├── interceptors/
│   └── pipes/
├── config/                 # 환경설정
│   └── configuration.ts
├── auth/                   # 인증 모듈
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── guards/
│   └── dto/
├── user/                   # 사용자 모듈
│   ├── user.module.ts
│   ├── user.controller.ts
│   ├── user.service.ts
│   └── dto/
├── story/                  # 동화 모듈
│   ├── story.module.ts
│   ├── story.controller.ts
│   ├── story.service.ts
│   └── dto/
└── subscription/           # 구독 모듈
    ├── subscription.module.ts
    ├── subscription.controller.ts
    ├── subscription.service.ts
    └── dto/
```

---

## 개발 명령어

```bash
# 의존성 설치
pnpm install

# 개발 서버 실행
pnpm run start:dev

# 빌드
pnpm run build

# 프로덕션 실행
pnpm run start:prod

# 린트
pnpm run lint

# 테스트
pnpm run test
pnpm run test:e2e
```

---

## 기획 문서 참조

| 문서 | 경로 | 용도 |
|------|------|------|
| 기술 스택 | `../fairytale-planning/docs/4_TECH_STACK.md` | 모듈 구조, 배포 설정 |
| API 명세 | `../fairytale-planning/docs/5_API_SPEC.md` | 15개 엔드포인트 상세 |
| 개발 계획 | `../fairytale-planning/docs/6_DEV_PLAN.md` | Phase 2 작업 목록 |
| 작업 현황 | `../fairytale-planning/docs/7_TASK_TRACKER.md` | 진행 상황 추적 |

---

## API 엔드포인트 (요약)

### 인증 (Auth)
- `POST /auth/signup` - 회원가입
- `POST /auth/login` - 로그인
- `POST /auth/logout` - 로그아웃
- `POST /auth/refresh` - 토큰 갱신
- `POST /auth/password/reset` - 비밀번호 재설정 요청
- `POST /auth/social/{provider}` - 소셜 로그인

### 사용자 (User)
- `GET /users/me` - 내 정보 조회
- `PATCH /users/me` - 내 정보 수정
- `DELETE /users/me` - 회원 탈퇴

### 동화 (Story)
- `GET /stories` - 동화 목록
- `GET /stories/:id` - 동화 상세
- `GET /stories/:id/pages` - 동화 페이지 (뷰어용)
- `POST /stories/:id/progress` - 읽기 진행률 저장

### 구독 (Subscription)
- `GET /subscription/plans` - 구독 플랜 목록
- `POST /subscription/checkout` - 결제 시작
- `POST /subscription/webhook` - 결제 웹훅
- `DELETE /subscription` - 구독 해지

> 상세 명세: `../fairytale-planning/docs/5_API_SPEC.md`

---

## 환경 변수 (예시)

```env
# Server
PORT=3000
NODE_ENV=development

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# 토스페이먼츠
TOSS_CLIENT_KEY=xxx
TOSS_SECRET_KEY=xxx
TOSS_WEBHOOK_SECRET=xxx

# JWT
JWT_SECRET=xxx
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d
```

---

## 다음 작업 (Phase 2)

1. **T07: Supabase 연동** - PostgreSQL, Auth 설정
2. **T08: 인증 API** - 회원가입, 로그인, 소셜 로그인
3. **T09: 사용자 API** - 프로필 CRUD
4. **T10: 동화 API** - 목록, 상세, 페이지, 진행률
5. **T11: 구독 API** - 토스페이먼츠 연동
6. **T12: 보안 설정** - Guards, Rate Limiting
7. **T13: 배포** - Cloud Run, CI/CD

---

## 관련 프로젝트

```
fairytale/
├── fairytale-planning/    # 기획 문서
├── ddukddak-web/          # 프론트엔드 (Next.js) - Phase 1 완료
└── ddukddak-api/          # 백엔드 (NestJS) ← 현재 위치
```

---

## 설정 현황

- [x] NestJS 11.0.1 프로젝트 생성
- [x] TypeScript strict mode
- [x] ESLint + Prettier 설정
- [ ] 모듈 구조 설정
- [ ] Supabase 연동
- [ ] Docker 설정
- [ ] CI/CD 설정
