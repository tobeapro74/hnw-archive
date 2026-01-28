---
description: HNW 홍보 아카이브 - NH투자증권 HNW본부 홍보 기사 및 세미나 관리 웹앱
globs:
  - "src/**/*.tsx"
  - "src/**/*.ts"
  - "src/lib/*.ts"
alwaysApply: true
---

# HNW 홍보 아카이브 프로젝트 개요

## 프로젝트 정보

- **이름**: HNW 홍보 아카이브
- **웹 URL**: https://hnw-archive.vercel.app
- **기술 스택**: Next.js 16, React 19, TypeScript, Tailwind CSS, MongoDB Atlas, Web Push

## 핵심 파일 구조

### 메인 페이지
- `src/app/page.tsx` - 메인 SPA 페이지 (홈, 목록, 캘린더, 세미나, 기사관리 뷰 관리)

### 데이터베이스
- `src/lib/mongodb.ts` - MongoDB Atlas 연결
- `src/lib/types.ts` - 공통 타입 정의
- `src/lib/seminar-types.ts` - 세미나 관련 타입 정의
- `src/lib/auth.ts` - 권한 체크 유틸리티

### 주요 컴포넌트

#### 홍보 기사 관련
- `src/components/article-card.tsx` - 기사 카드
- `src/components/article-group.tsx` - 이벤트별 기사 그룹
- `src/components/calendar-view.tsx` - 홍보 캘린더

#### 세미나 관련 (`src/components/seminar/`)
- `seminar-view.tsx` - 세미나 메인 뷰 (캘린더/리스트 토글)
- `seminar-calendar.tsx` - 세미나 월별 캘린더
- `seminar-card.tsx` - 세미나 카드/리스트 항목
- `seminar-stats.tsx` - 통합 통계 카드
- `seminar-detail-dialog.tsx` - 세미나 상세 (하단 슬라이드 토스트)
- `seminar-form-dialog.tsx` - 정기 세미나 등록/수정 폼
- `seminar-request-form-dialog.tsx` - 비정기 요청 폼 + 카드
- `checklist-section.tsx` - 체크리스트 섹션 및 탭
- `progress-bar.tsx` - 진행률 바

#### 공통
- `src/components/bottom-nav.tsx` - 하단 네비게이션
- `src/components/settings-dialog.tsx` - 설정 다이얼로그 (푸시 알림)

### API 라우트

#### 인증 (`src/app/api/auth/`)
- `login/route.ts` - 로그인
- `logout/route.ts` - 로그아웃
- `register/route.ts` - 회원가입
- `me/route.ts` - 현재 사용자 조회

#### 기사 (`src/app/api/articles/`)
- `route.ts` - 기사 목록/등록 (GET/POST, 캐싱 적용)
- `[id]/route.ts` - 기사 상세/수정/삭제

#### 세미나 (`src/app/api/seminars/`)
- `route.ts` - 세미나 목록/등록 (GET/POST, $lookup 최적화)
- `[id]/route.ts` - 세미나 상세/수정/삭제
- `[id]/checklist/route.ts` - 체크리스트 항목 추가

#### 비정기 요청 (`src/app/api/seminar-requests/`)
- `route.ts` - 요청 목록/등록
- `[id]/route.ts` - 요청 상세/수정/삭제

#### 체크리스트 (`src/app/api/checklist/`)
- `[itemId]/route.ts` - 항목 완료 토글/삭제

#### 관리자 (`src/app/api/admin/`)
- `users/route.ts` - 사용자 목록
- `users/[id]/permissions/route.ts` - 권한 수정
- `migrate/route.ts` - 인덱스 생성 (GET)

#### 푸시 알림 (`src/app/api/push/`)
- `subscribe/route.ts` - 푸시 구독 등록
- `send/route.ts` - 푸시 발송
- `debug/route.ts` - 구독자 수 확인

#### 크론 (`src/app/api/cron/`)
- `notifications/route.ts` - D-day 알림 (매일 오전 10시)

### PWA
- `public/manifest.json` - PWA 매니페스트
- `public/sw.js` - Service Worker (푸시 알림)

## 주요 함수

### 세미나 타입 (`src/lib/seminar-types.ts`)
```typescript
calculateDday(date)          // D-day 계산
formatDday(dday)             // D-day 포맷 ("D-7", "D-day", "D+3")
seminarCategoryBgColors      // 카테고리별 배경색
seminarTypeBgColors          // 유형별 배경색
seminarStatusColors          // 상태별 색상
defaultChecklistTemplates    // 기본 체크리스트 템플릿
```

### 권한 체크 (`src/lib/auth.ts`)
```typescript
requirePermission(request, resource, action)  // API 권한 확인
// resource: 'articles' | 'seminars'
// action: 'create' | 'update' | 'delete'
```

## 해결된 주요 이슈

1. **세미나 API N+1 쿼리** - $lookup 집계 파이프라인으로 해결
2. **홈화면 API 순차 호출** - Promise.all로 병렬화
3. **모달 스크롤 문제** - overflow-x-hidden + body position fixed
4. **배경 스크롤 방지** - onTouchMove stopPropagation
5. **카테고리 필터 시 비정기 요청** - 필터 조건 수정

## 성능 최적화

### MongoDB 인덱스 (`GET /api/admin/migrate`)
```javascript
seminars: { date: -1 }, { category: 1, status: 1 }, { seminarType: 1 }
checklist_items: { seminarId: 1 }
articles: { publishedAt: -1 }, { category: 1 }, { tag: 1 }, { eventId: 1 }
seminar_requests: { requestedDate: -1 }, { status: 1 }
```

### HTTP 캐싱
```typescript
// articles, seminars API
headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" }
```

## 코딩 가이드라인

### 기사 추가 (MongoDB)
```typescript
{
  title: "기사 제목",
  keyword: "검색 키워드",
  publishedAt: new Date(),
  category: "인터뷰" | "세미나 안내" | "소개 및 홍보",
  tag: "단독기사" | "특집기사" | "보도기사",
  thumbnailUrl: "이미지 URL",
  articleUrl: "기사 원문 URL",
  mediaName: "언론사명",
  eventName: "이벤트명"
}
```

### 세미나 추가
```typescript
{
  title: "세미나명",
  seminarType: "정기" | "비정기",
  date: new Date(),
  location: "장소",
  category: "패밀리오피스" | "법인",
  status: "준비중" | "완료" | "취소",
  expectedAttendees: 50
}
```

### 배포
```bash
# 일반 배포
git add -A && git commit -m "feat: 내용" && vercel --prod

# 인덱스 생성 (최초 1회)
curl -X GET "https://hnw-archive.vercel.app/api/admin/migrate"
```

## 환경 변수

```env
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-jwt-secret
ADMIN_SECRET_KEY=hnw-admin-2025
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
CRON_SECRET=...
```

## 참고 문서

- [아키텍처](../docs/architecture.md)
- [트러블슈팅](../docs/troubleshooting.md)
- [PRD](../docs/prd-instruction.md)
- [실행 계획](../docs/prd-execution.md)
