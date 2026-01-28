# HNW 홍보 아카이브 - 실행 계획 및 체크리스트

## 개발 완료 항목

### 기본 인프라
- [x] Next.js 16 프로젝트 설정
- [x] TypeScript 설정
- [x] Tailwind CSS 설정
- [x] shadcn/ui 컴포넌트 설치
- [x] Vercel 배포 설정

### 데이터베이스
- [x] MongoDB Atlas 연결
- [x] 사용자 컬렉션 (users)
- [x] 기사 컬렉션 (articles)
- [x] 이벤트 컬렉션 (events)
- [x] 세미나 컬렉션 (seminars)
- [x] 비정기 요청 컬렉션 (seminar_requests)
- [x] 체크리스트 컬렉션 (checklist_items)
- [x] 푸시 구독 컬렉션 (push_subscriptions)
- [x] 인덱스 최적화 (2026.01.28)

### API 개발
- [x] `/api/auth/login` - 로그인
- [x] `/api/auth/logout` - 로그아웃
- [x] `/api/auth/register` - 회원가입
- [x] `/api/auth/me` - 현재 사용자 조회
- [x] `/api/articles` - 기사 CRUD
- [x] `/api/articles/[id]` - 기사 상세
- [x] `/api/events` - 이벤트 CRUD
- [x] `/api/seminars` - 세미나 CRUD ($lookup 최적화)
- [x] `/api/seminars/[id]` - 세미나 상세
- [x] `/api/seminars/[id]/checklist` - 체크리스트
- [x] `/api/seminar-requests` - 비정기 요청 CRUD
- [x] `/api/checklist/[itemId]` - 체크리스트 항목
- [x] `/api/admin/users` - 사용자 관리
- [x] `/api/admin/users/[id]/permissions` - 권한 관리
- [x] `/api/admin/migrate` - 인덱스 생성
- [x] `/api/push/subscribe` - 푸시 구독
- [x] `/api/push/send` - 푸시 발송
- [x] `/api/cron/notifications` - D-day 알림

### UI 컴포넌트
- [x] 메인 페이지 레이아웃
- [x] 하단 네비게이션 (BottomNav)
- [x] 기사 카드 (ArticleCard)
- [x] 기사 그룹 (ArticleGroup)
- [x] 홍보 캘린더 (CalendarView)
- [x] 세미나 뷰 (SeminarView)
- [x] 세미나 캘린더 (SeminarCalendar)
- [x] 세미나 카드 (SeminarCard)
- [x] 세미나 통계 (SeminarStats)
- [x] 세미나 상세 모달 (SeminarDetailDialog)
- [x] 세미나 폼 모달 (SeminarFormDialog)
- [x] 비정기 요청 폼 (SeminarRequestFormDialog)
- [x] 비정기 요청 카드 (SeminarRequestCard)
- [x] 체크리스트 섹션 (ChecklistSection)
- [x] 진행률 바 (ProgressBar)
- [x] 설정 다이얼로그 (SettingsDialog)
- [x] 사용자 관리 (UserManagement)

### PWA
- [x] manifest.json
- [x] Service Worker (sw.js)
- [x] 앱 아이콘 (192x192, 512x512)
- [x] Apple Touch Icon

### 성능 최적화 (2026.01.28)
- [x] MongoDB 인덱스 생성 API
  - seminars: date, category+status, seminarType
  - checklist_items: seminarId
  - articles: publishedAt, category, tag, eventId
  - seminar_requests: requestedDate, status
- [x] 세미나 API N+1 쿼리 제거 ($lookup 집계)
- [x] 홈화면 API 병렬화 (Promise.all)
- [x] HTTP 응답 캐싱 (30초 + stale-while-revalidate)

### UX 개선 (2026.01.28)
- [x] 모달 좌우 스크롤 방지 (overflow-x-hidden)
- [x] 모달 열릴 때 body 스크롤 차단
- [x] 터치 이벤트 전파 방지
- [x] 비정기 요청 비고란 크기 확대 (리사이즈 가능)
- [x] 비정기 요청 카드에 비고 미리보기 + 팝업
- [x] 비정기 요청 카드에 D-day 표시

### 버그 수정
- [x] 세미나 상세 모달 스크롤 문제
- [x] 배경 스크롤 문제 (body fixed)
- [x] 카테고리 필터 시 비정기 요청 0개 표시

### 문서화
- [x] 아키텍처 문서 (architecture.md)
- [x] 트러블슈팅 가이드 (troubleshooting.md)
- [x] PRD 문서 (prd-instruction.md, prd-execution.md)

## 배포 체크리스트

### 배포 전
- [ ] `npm run build` 성공 확인
- [ ] TypeScript 에러 없음 확인
- [ ] 환경 변수 설정 확인

### 배포
```bash
# 일반 배포
git add -A
git commit -m "feat/fix: 변경 내용"
vercel --prod

# 인덱스 생성 (최초 1회)
curl -X GET "https://hnw-archive.vercel.app/api/admin/migrate"
```

### 배포 후
- [ ] 프로덕션 사이트 확인
- [ ] 주요 기능 테스트
- [ ] 모바일 테스트 (iOS Safari)

## 환경 변수

```env
# MongoDB
MONGODB_URI=mongodb+srv://...

# Auth
JWT_SECRET=your-jwt-secret
ADMIN_SECRET_KEY=hnw-admin-2025

# Web Push (VAPID Keys)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...

# Cron 보안
CRON_SECRET=...
```

## 코드 품질

### 코딩 컨벤션
- TypeScript strict mode
- ESLint 규칙 준수
- 컴포넌트당 하나의 책임

### 커밋 메시지
```
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 수정
style: 코드 포맷팅
refactor: 코드 리팩토링
perf: 성능 개선
chore: 빌드/설정 변경
```

### Co-Author
```
Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

## 모니터링

### 확인 사항
- Vercel 대시보드 에러 로그
- MongoDB Atlas 성능 모니터
- 푸시 알림 발송 로그

### 알림 설정
- Vercel 배포 실패 알림
- API 에러율 모니터링

## 향후 개발 항목

### 데이터 확장
- [ ] 이미지 업로드 (Cloudinary)
- [ ] 참석자 명단 관리
- [ ] 세미나 리포트 생성

### 기능 추가
- [ ] 통계 대시보드 (차트)
- [ ] PDF 내보내기
- [ ] 슬랙/이메일 알림

### UX 개선
- [ ] 다크모드 지원
- [ ] 키보드 단축키
- [ ] 드래그 앤 드롭
