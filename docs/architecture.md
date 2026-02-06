# HNW 홍보 아카이브 - 아키텍처 문서

## 프로젝트 개요

NH투자증권 HNW(High Net Worth) 본부의 홍보 기사 아카이브 및 세미나 관리 웹 애플리케이션입니다.
패밀리오피스, 세미나, 인터뷰 등 다양한 홍보 활동 관련 기사를 수집/관리하고, 세미나 일정 및 체크리스트를 관리합니다.

## 기술 스택

### Frontend

- **Next.js 16** - App Router 사용
- **React 19** - 최신 React 기능 활용
- **TypeScript** - 타입 안정성
- **Tailwind CSS** - 스타일링
- **shadcn/ui** - UI 컴포넌트 라이브러리
- **Lucide React** - 아이콘

### Backend

- **Next.js API Routes** - 서버리스 API
- **MongoDB Atlas** - 클라우드 데이터베이스

### External APIs

- **Google News RSS** - 뉴스 기사 검색 및 수집

### Deployment

- **Vercel** - 호스팅 및 CI/CD
- **배포 URL**: https://hnw-archive.vercel.app

### PWA (Progressive Web App)

- **manifest.json** - 앱 메타데이터
- **앱 아이콘**: 보라색 그라디언트 배경 + 메가폰(홍보) + 문서스택(아카이브) 디자인
- **홈화면 추가**: Safari 공유 → 홈 화면에 추가

## 디렉토리 구조

```
1024src/
├── app/                          # Next.js App Router
│   ├── api/                      # API 라우트
│   │   ├── auth/                 # 인증 API
│   │   │   ├── login/
│   │   │   ├── logout/
│   │   │   ├── register/
│   │   │   └── me/
│   │   ├── admin/                # 관리자 전용 API (신규)
│   │   │   └── users/
│   │   │       ├── route.ts      # 사용자 목록
│   │   │       └── [id]/
│   │   │           └── permissions/
│   │   │               └── route.ts  # 권한 수정
│   │   ├── articles/             # 기사 CRUD API
│   │   │   └── [id]/
│   │   ├── article-scrape/       # 기사 스크래핑 API
│   │   ├── events/               # 이벤트 API
│   │   │   └── [id]/
│   │   ├── news/                 # 뉴스 검색 API
│   │   │   └── search/
│   │   ├── seminars/             # 세미나 API (신규)
│   │   │   └── [id]/
│   │   │       └── checklist/    # 체크리스트 API
│   │   ├── seminar-requests/     # 비정기 세미나 요청 API (신규)
│   │   │   └── [id]/
│   │   ├── checklist/            # 체크리스트 항목 API (신규)
│   │   │   └── [itemId]/
│   │   ├── resources/            # 자료실 API (신규)
│   │   │   └── [id]/
│   │   │       └── download/     # 파일 다운로드
│   │   ├── schedules/            # 일정 API (신규)
│   │   │   └── [id]/
│   │   ├── image/                # 이미지 검색 API
│   │   ├── og-image/             # OG 이미지 API
│   │   ├── push/                 # 푸시 알림 API (신규)
│   │   │   ├── subscribe/        # 구독 등록
│   │   │   ├── send/             # 알림 발송
│   │   │   └── debug/            # 디버그
│   │   └── cron/                 # 크론 작업 (신규)
│   │       ├── notifications/    # D-day 알림
│   │       ├── daily-schedule/   # 금일 일정 알림 (신규)
│   │       └── schedule-reminder/ # 일정 리마인더 (신규)
│   ├── admin/                    # 관리자 페이지
│   ├── layout.tsx                # 루트 레이아웃
│   ├── page.tsx                  # 메인 페이지 (URL ?tab=xxx 딥링크 지원)
│   └── globals.css               # 전역 스타일
├── components/
│   ├── ui/                       # shadcn/ui 기본 컴포넌트
│   │   └── empty-state.tsx       # EmptyState 컴포넌트 (신규)
│   ├── resource/                 # 자료실 관련 컴포넌트 (신규)
│   │   ├── resource-view.tsx     # 자료실 메인 뷰
│   │   ├── resource-card.tsx     # 자료 카드 (파일 그룹화 지원)
│   │   ├── resource-viewer.tsx   # 파일 뷰어 (PDF, Office)
│   │   ├── resource-form-dialog.tsx  # 자료 등록 폼
│   │   └── file-type-selector.tsx    # 파일 타입 선택 모달
│   ├── schedule/                 # 일정 관련 컴포넌트 (신규)
│   │   ├── index.ts              # 컴포넌트 exports
│   │   ├── schedule-view.tsx     # 일정 메인 뷰
│   │   ├── schedule-card.tsx     # 일정 카드
│   │   ├── schedule-form-dialog.tsx      # 일정 등록/수정 폼
│   │   └── schedule-detail-dialog.tsx    # 일정 상세
│   ├── seminar/                  # 세미나 관련 컴포넌트 (신규)
│   │   ├── index.ts              # 컴포넌트 exports
│   │   ├── seminar-view.tsx      # 세미나 메인 뷰
│   │   ├── seminar-calendar.tsx  # 세미나 캘린더
│   │   ├── seminar-card.tsx      # 세미나 카드
│   │   ├── seminar-stats.tsx     # 세미나 통계
│   │   ├── seminar-detail-dialog.tsx    # 세미나 상세 (슬라이드 팝업)
│   │   ├── seminar-form-dialog.tsx      # 세미나 등록/수정 폼
│   │   ├── seminar-request-form-dialog.tsx  # 비정기 요청 폼
│   │   ├── checklist-item.tsx    # 체크리스트 항목
│   │   ├── checklist-section.tsx # 체크리스트 섹션
│   │   └── progress-bar.tsx      # 진행률 바
│   ├── admin/                    # 관리자 컴포넌트 (신규)
│   │   └── user-management.tsx   # 사용자 권한 관리
│   ├── article-card.tsx          # 기사 카드 컴포넌트
│   ├── article-group.tsx         # 이벤트별 기사 그룹 컴포넌트
│   ├── bottom-nav.tsx            # 하단 네비게이션
│   ├── calendar-view.tsx         # 홍보 캘린더 뷰
│   └── settings-dialog.tsx       # 설정 다이얼로그 (신규)
└── lib/
    ├── mongodb.ts                # MongoDB 연결
    ├── types.ts                  # 공통 타입 정의 (UserPermissions 포함)
    ├── seminar-types.ts          # 세미나 타입 정의
    ├── schedule-types.ts         # 일정 타입 정의 (신규)
    ├── resource-types.ts         # 자료실 타입 정의
    ├── auth.ts                   # 권한 체크 유틸리티 (신규)
    └── utils.ts                  # 유틸리티 함수

public/                           # 정적 파일
├── manifest.json                 # PWA 매니페스트
├── sw.js                         # Service Worker (푸시 알림)
│                                 # - 클릭 시 /?tab=seminar로 이동
├── icon.svg                      # 앱 아이콘 (SVG)
├── icon-192.png                  # 앱 아이콘 (192x192)
├── icon-512.png                  # 앱 아이콘 (512x512)
├── apple-touch-icon.png          # iOS 홈화면 아이콘
└── favicon-32.png                # 파비콘

docs/                             # 프로젝트 문서
├── architecture.md               # 아키텍처 문서
├── troubleshooting.md            # 트러블슈팅 가이드
├── prd-instruction.md            # 프로젝트 요구사항 정의 (PRD)
├── prd-execution.md              # 실행 계획 및 체크리스트
└── API.md                        # API 명세서

.claude/                          # Claude Code 설정
├── settings.json                 # 프로젝트 설정
└── project-overview.md           # 프로젝트 개요 (Claude용)
```

## 주요 기능

### 1. 홈 화면 (메인 대시보드)

- **통계 대시보드**: 전체 기사 수, 언론사 수
- **카테고리별 통계**: 인터뷰, 세미나 안내, 소개 및 홍보 (게이지 그래프)
- **최근 홍보**: 최근 등록된 기사 목록 (이벤트별 그룹화)

### 2. 홍보 목록 (리스트 뷰)

- **검색**: 기사 제목, 키워드, 언론사명 검색
- **카테고리 필터**: 인터뷰, 세미나 안내, 소개 및 홍보
- **태그 필터**: 단독기사, 특집기사, 보도기사
- **이벤트별 그룹화**: 같은 이벤트 기사 펼치기/접기

### 3. 홍보 캘린더

- **월별 캘린더**: 기사, 일정, 세미나를 날짜별로 표시
- **아이콘 타입별 구분** (2026-02-04 개선):
  - 기사: 사각형 (카테고리별 색상)
    - 인터뷰: 보라색
    - 세미나 안내: 주황색
    - 소개 및 홍보: 파란색
  - 세미나: 주황색 원
  - 일정: 삼각형 (카테고리별 색상)
    - 회의: 초록색
    - 외근: 노란색
    - 기타: 분홍색
- **모든 아이콘 크기 통일**: 10px
- **월 변경 기능**:
  - 좌우 화살표 버튼 클릭
  - 달력 위에서 좌우 스와이프 (50px 이상)
- **자동 선택 기능**:
  - 초기 로딩 시: 가장 가까운 미래 일정/기사/세미나 자동 선택
  - 월 변경 시: 해당 월의 첫 번째 일정/기사/세미나 자동 선택하여 하단에 표시
- **날짜 클릭**: 해당 날짜의 기사/일정/세미나 목록 표시
- **빈 섹션 숨김**: 데이터가 없는 섹션은 자동으로 숨김 처리

### 4. 세미나 관리 (신규)

- **세미나 현황 대시보드**
  - 정기/비정기 세미나 통계 (대기/승인/완료)
  - 카테고리별 통계 (패밀리오피스/법인)
  - 이번 주 세미나 알림
  - **클릭 시 스크롤 이동**: 정기 카드 → 다가오는 세미나, 비정기 카드 → 비정기 요청 섹션
- **세미나 캘린더**
  - 월별 캘린더에 세미나 일정 표시
  - 정기 세미나: 카테고리별 색상 (보라/하늘)
  - 비정기 요청: 주황색 점
  - 월 변경: 좌우 화살표 또는 스와이프 제스처 (50px 이상)
- **세미나 등록/수정** (하단 슬라이드 토스트 팝업)
  - 정기 세미나: 제목, 날짜, 장소, 카테고리, 예상 참석자 수
  - 비정기 요청: 요청센터, 대상법인, 주제, 요청일자 등
- **비정기 세미나 요청 목록**
  - 요청일자(requestedDate) 기준 오름차순 정렬 (임박한 요청이 상단)
- **체크리스트 관리**
  - 사전/당일/사후 3단계 체크리스트
  - 진행률 시각화 (전체/단계별)
  - 항목별 목표일 표시 (목표일: 2/15 형식)
  - 항목 추가/삭제/완료 토글

### 5. 자료실 (신규)

- **카테고리별 문서 관리**
  - 회의록: 내부회의록, 외부회의록, 한장요약
  - 보고서: 전문, 요약
  - 기획안
- **파일 그룹화**: 동일 파일명 다른 확장자 파일을 하나의 카드로 그룹화
- **파일 뷰어**
  - PDF: iframe으로 직접 표시
  - Office 파일(doc, docx, ppt, pptx, xls, xlsx): Google Docs Viewer 사용
  - 뷰어 실패 시 다운로드 폴백
- **파일 저장**: MongoDB에 base64로 저장 (Vercel 배포 호환)
- **프론트엔드 캐싱**: 30초 TTL, stale-while-revalidate 패턴
- **검색 기능**: 파일명, 제목 검색
- **정렬**: 최신 파일이 위로 (uploadedAt 내림차순)
- **한글 파일명 지원**: 유니코드 정규화 (NFC) 적용

### 6. 기사관리 (관리자)

- **기사 CRUD**: 추가, 수정, 삭제
- **자동 크롤링**: 기사 저장 후 관련 기사 자동 검색
- **일괄 등록**: 검색된 기사 선택하여 일괄 저장

### 6. 자료실 관리

- **자료 CRUD**: 추가, 삭제
- **슬라이드업 모달**: 등록/상세 모두 하단에서 올라오는 팝업
- **파일 타입 선택**: 그룹화된 파일에서 원하는 타입 선택

### 7. 사용자 관리 (신규 - 관리자 전용)

- **사용자 목록**: 관리자/일반 사용자 분리 표시
- **권한 관리**: 사용자별 세부 권한 설정
  - 기사: 등록/수정/삭제 권한
  - 세미나: 등록/수정/삭제 권한
- **관리자 승격/해제**: 일반 사용자 ↔ 관리자 전환
- **보호된 계정**: admin@hnw.co.kr 해제 버튼 숨김

### 7. 웹 푸시 알림 (신규)

- **Service Worker**: 백그라운드 푸시 수신
- **VAPID 인증**: Web Push Protocol 기반 보안 푸시
- **알림 타입별 관리** (2026-02-06): `notificationTypes` 배열로 dday/daily 개별 토글
- **D-day 알림**: 매일 오전 10시(KST) - `/api/cron/notifications`
  - 패밀리오피스/법인 각각 가장 가까운 예정 세미나 알림
- **금일 일정 알림** (2026-02-06 신규): 매일 오전 8시(KST) - `/api/cron/daily-schedule`
  - 금일 세미나(준비중) + 일정(회의/외근) 합산 알림
- **일정 리마인더** (2026-02-06 신규): 5분마다 체크 - `/api/cron/schedule-reminder`
  - 회의 20분 전, 외근 1시간 전 리마인더
  - `notification_logs`로 중복 발송 방지
- **설정**: 설정 화면에서 알림 구독/해제
- **알림 클릭 랜딩**: 세미나 탭(`/?tab=seminar`) 또는 캘린더 탭(`/?tab=calendar`)
- **구독 방식**: 로그인 불필요, 브라우저 endpoint 기반 (아래 상세 설명)

## 하단 네비게이션

| 탭       | 아이콘        | 설명                    | 권한 요구사항 |
| -------- | ------------- | ----------------------- | ------------- |
| 홈       | Home          | 메인 대시보드           | 공개          |
| 목록     | List          | 홍보 기사 목록          | 공개          |
| 캘린더   | Calendar      | 홍보 캘린더             | 공개          |
| 세미나   | ClipboardList | 세미나 관리             | 공개 (조회) / 로그인 (등록/수정/삭제) |
| 일정     | CalendarCheck | 팀 일정 관리            | 공개 (조회) / 로그인 (등록/수정/삭제) |
| 자료실   | FolderOpen    | 문서 자료 관리          | 특정 이메일만 (로그인 필요) |
| 기사관리 | Settings      | 관리자 전용 (로그인 시) | 관리자 전용   |

## 데이터베이스 스키마

### MongoDB Collections

#### articles (기사)

```javascript
{
  _id: ObjectId,
  title: String,           // 기사 제목
  keyword: String,         // 검색용 키워드
  interviewee: String,     // 인터뷰이 (인터뷰 카테고리일 때)
  publishedAt: Date,       // 발행일
  category: String,        // "인터뷰" | "세미나 안내" | "소개 및 홍보"
  tag: String,             // "단독기사" | "특집기사" | "보도기사"
  thumbnailUrl: String,    // 썸네일 이미지 URL
  articleUrl: String,      // 기사 원문 URL
  mediaName: String,       // 언론사명
  description: String,     // 기사 설명/메모
  eventName: String,       // 연관 이벤트명 (그룹화용)
  createdAt: Date,
  updatedAt: Date
}
```

#### users (사용자)

```javascript
{
  _id: ObjectId,
  email: String,           // 이메일 (unique)
  password: String,        // bcrypt 해시
  name: String,            // 이름
  is_admin: Boolean,       // 관리자 여부
  permissions: {           // 세부 권한 (신규)
    articles: {
      create: Boolean,
      update: Boolean,
      delete: Boolean
    },
    seminars: {
      create: Boolean,
      update: Boolean,
      delete: Boolean
    }
  },
  created_at: Date,
  updated_at: Date
}
```

#### push_subscriptions (푸시 구독) - 신규

```javascript
{
  _id: ObjectId,
  endpoint: String,        // 푸시 엔드포인트 (unique) - 브라우저 고유값
  subscription: {          // 전체 구독 정보
    endpoint: String,
    keys: {
      p256dh: String,      // 암호화 키
      auth: String         // 인증 키
    }
  },
  userId: String | null,   // 로그인한 경우 사용자 ID (선택)
  notificationTypes: [String],  // 알림 유형 배열 (2026-02-06 추가)
                                // 'dday': D-day 알림, 'daily': 금일 일정 + 리마인더
                                // 기본값: ['dday', 'daily']
                                // 기존 구독자는 필드 없음 → $exists:false fallback
  createdAt: Date,
  updatedAt: Date
}
```

**푸시 알림 구독 구조**:
- 구독은 **브라우저 endpoint 기준**으로 관리 (로그인 불필요)
- 같은 기기/브라우저에서 여러 사용자가 로그인해도 구독은 하나
- 사용자 로그인 여부와 관계없이 설정 화면에서 알림 ON/OFF 가능
- userId는 분석/통계 용도로만 사용 (필수 아님)

#### seminars (세미나) - 신규

```javascript
{
  _id: ObjectId,
  title: String,                    // 세미나명 (예: "2026 1Q 패밀리오피스 세미나")
  seminarType: String,              // "정기" | "비정기"
  date: Date,                       // 세미나 날짜
  location: String,                 // 장소
  category: String,                 // "패밀리오피스" | "법인"
  corporateType: String,            // "상장법인" | "외감법인" | "일반법인" | "지역금융" (선택)
  targetType: String,               // "대기업" | "중소기업" | "벤처" | "IPO준비기업" (선택)
  expectedAttendees: Number,        // 예상 참석자 수
  actualAttendees: Number,          // 실제 참석자 수
  description: String,
  status: String,                   // "준비중" | "완료" | "취소"
  requestId: String,                // 비정기 세미나의 경우 요청 ID
  createdAt: Date,
  updatedAt: Date,
  createdBy: String
}
```

#### seminar_requests (비정기 세미나 요청) - 신규

```javascript
{
  _id: ObjectId,
  requestingCenter: String,         // 요청센터
  requestLocation: String,          // 요청장소 (세미나실)
  targetCorporation: String,        // 대상법인
  minAttendees: Number,             // 모집인원 최소
  maxAttendees: Number,             // 모집인원 최대
  requestedDate: Date,              // 요청일자
  topics: [String],                 // 요청주제 (복수 선택)
  topicDetail: String,              // 주제 상세 (기타인 경우)
  receiver: String,                 // 접수자
  centerContact: String,            // 센터 담당자
  status: String,                   // "요청접수" | "검토중" | "승인" | "반려" | "완료"
  seminarId: String,                // 승인 시 연결되는 세미나 ID
  notes: String,                    // 비고
  createdAt: Date,
  updatedAt: Date
}
```

#### checklist_items (체크리스트 항목) - 신규

```javascript
{
  _id: ObjectId,
  seminarId: String,                // 연결된 세미나 ID
  phase: String,                    // "사전" | "당일" | "사후"
  title: String,                    // 항목명
  description: String,
  isCompleted: Boolean,
  priority: Number,                 // 1: 높음, 2: 보통, 3: 낮음
  dueOffset: Number,                // D-14, D-7, D-1 등 (세미나 날짜 기준)
  completedAt: Date,
  completedBy: String,
  order: Number                     // 표시 순서
}
```

#### resources (자료실) - 신규

```javascript
{
  _id: ObjectId,
  title: String,                    // 자료 제목
  fileName: String,                 // 파일명
  fileType: String,                 // 파일 확장자 (pdf, docx, pptx 등)
  fileSize: Number,                 // 파일 크기 (bytes)
  fileData: String,                 // base64 인코딩된 파일 데이터
  category: String,                 // "회의록" | "보고서" | "기획안"
  subCategory: String,              // 회의록: "내부회의록" | "외부회의록" | "한장요약"
                                    // 보고서: "전문" | "요약"
  content: String,                  // 문서 내용 (텍스트 추출, 미리보기용)
  uploadedAt: Date,
  uploadedBy: String,
  createdAt: Date,
  updatedAt: Date
}
```

#### schedules (일정) - 신규

```javascript
{
  _id: ObjectId,
  category: String,                 // "회의" | "외근"
  date: Date,                       // 일정 날짜
  time: String,                     // 시간 (예: "14:00")
  location: String,                 // 장소

  // 회의 관련 필드
  meetingType: String,              // "팀회의" | "외부미팅" | "부서간회의"
  meetingTopic: String,             // 회의 주제

  // 외근 관련 필드
  outingType: String,               // "직원미팅" | "고객미팅"
  center: String,                   // 센터
  rmName: String,                   // 담당 RM
  contact: String,                  // 연락처

  // 고객미팅 전용 필드
  customerName: String,             // 고객명
  customerInfo: String,             // 고객 기타정보

  // 외근 공통
  outingTopic: String,              // 미팅 주제
  preparationItems: String,         // 준비물

  createdAt: Date,
  updatedAt: Date,
  createdBy: String
}
```

## API 엔드포인트

### 인증 API

| 메서드 | 경로               | 설명             |
| ------ | ------------------ | ---------------- |
| POST   | /api/auth/register | 회원가입         |
| POST   | /api/auth/login    | 로그인           |
| POST   | /api/auth/logout   | 로그아웃         |
| GET    | /api/auth/me       | 현재 사용자 정보 |

### 사용자 관리 API (신규 - 관리자 전용)

| 메서드 | 경로                                | 설명                           |
| ------ | ----------------------------------- | ------------------------------ |
| GET    | /api/admin/users                    | 사용자 목록 조회               |
| PATCH  | /api/admin/users/[id]/permissions   | 사용자 권한 수정 (is_admin 포함) |

### 기사 API

| 메서드 | 경로               | 설명           |
| ------ | ------------------ | -------------- |
| GET    | /api/articles      | 기사 목록 조회 |
| POST   | /api/articles      | 기사 등록      |
| PUT    | /api/articles/[id] | 기사 수정      |
| DELETE | /api/articles/[id] | 기사 삭제      |

### 뉴스 검색 API

| 메서드 | 경로             | 설명                 |
| ------ | ---------------- | -------------------- |
| GET    | /api/news/search | Google News RSS 검색 |

### 세미나 API (신규)

| 메서드 | 경로               | 설명                                              | 권한     |
| ------ | ------------------ | ------------------------------------------------- | -------- |
| GET    | /api/seminars      | 세미나 목록 (필터: year, month, category, status) | 공개     |
| POST   | /api/seminars      | 세미나 생성 (+ 기본 체크리스트 자동 생성)         | 관리자   |
| GET    | /api/seminars/[id] | 세미나 상세 + 체크리스트                          | 공개     |
| PUT    | /api/seminars/[id] | 세미나 수정                                       | 관리자   |
| DELETE | /api/seminars/[id] | 세미나 삭제 (+ 체크리스트 삭제)                   | 관리자   |

### 비정기 세미나 요청 API (신규)

| 메서드 | 경로                       | 설명      | 권한     |
| ------ | -------------------------- | --------- | -------- |
| GET    | /api/seminar-requests      | 요청 목록 | 공개     |
| POST   | /api/seminar-requests      | 요청 등록 | 관리자   |
| PUT    | /api/seminar-requests/[id] | 요청 수정 | 관리자   |
| DELETE | /api/seminar-requests/[id] | 요청 삭제 | 관리자   |

### 체크리스트 API (신규)

| 메서드 | 경로                         | 설명                 | 권한     |
| ------ | ---------------------------- | -------------------- | -------- |
| GET    | /api/seminars/[id]/checklist | 체크리스트 조회      | 공개     |
| POST   | /api/seminars/[id]/checklist | 체크리스트 항목 추가 | 관리자   |
| PATCH  | /api/checklist/[itemId]      | 항목 완료 토글       | 관리자   |
| DELETE | /api/checklist/[itemId]      | 항목 삭제            | 관리자   |

### 자료실 API (신규)

| 메서드 | 경로                      | 설명                      | 권한     |
| ------ | ------------------------- | ------------------------- | -------- |
| GET    | /api/resources            | 자료 목록 (캐싱 30초)     | 특정 이메일 |
| POST   | /api/resources            | 자료 등록                 | 특정 이메일 |
| GET    | /api/resources/[id]       | 자료 상세                 | 특정 이메일 |
| DELETE | /api/resources/[id]       | 자료 삭제                 | 특정 이메일 |
| GET    | /api/resources/[id]/download | 파일 다운로드          | 특정 이메일 |

### 일정 API (신규)

| 메서드 | 경로                | 설명                                    | 권한     |
| ------ | ------------------- | --------------------------------------- | -------- |
| GET    | /api/schedules      | 일정 목록 (필터: year, month, category) | 공개     |
| POST   | /api/schedules      | 일정 생성                               | 로그인   |
| GET    | /api/schedules/[id] | 일정 상세                               | 공개     |
| PUT    | /api/schedules/[id] | 일정 수정                               | 로그인   |
| DELETE | /api/schedules/[id] | 일정 삭제                               | 로그인   |

### 푸시 알림 API (신규)

| 메서드 | 경로                  | 설명                                    | 권한     |
| ------ | --------------------- | --------------------------------------- | -------- |
| POST   | /api/push/subscribe   | 푸시 구독 등록                          | 로그인   |
| DELETE | /api/push/subscribe   | 푸시 구독 해제                          | 로그인   |
| POST   | /api/push/send        | 푸시 알림 발송                          | 관리자   |
| GET    | /api/push/debug       | 구독자 수 확인 (디버그)                 | 관리자   |
| GET    | /api/cron/notifications | D-day 알림 크론 (Vercel Cron에서 호출) | 크론     |
| GET    | /api/cron/daily-schedule | 금일 일정 알림 크론 (신규)             | 크론     |
| GET    | /api/cron/schedule-reminder | 일정 리마인더 크론 (신규)           | 크론     |
| GET    | /api/push/settings     | 알림 설정 조회 (신규)                   | 로그인   |
| PATCH  | /api/push/settings     | 알림 타입 토글 (신규)                   | 로그인   |

## UI 컴포넌트

### 홍보 관련

- **ArticleCard**: 기사 카드 컴포넌트
- **ArticleGroup**: 이벤트별 기사 그룹 컴포넌트
- **CalendarView**: 홍보 월별 캘린더

### 세미나 관련 (신규)

- **SeminarView**: 세미나 메인 뷰 (캘린더/리스트 토글, 섹션별 스크롤 이동)
- **SeminarCalendar**: 세미나 월별 캘린더
- **SeminarCard/SeminarListItem**: 세미나 카드/리스트 항목
- **SeminarStats**: 통합 통계 카드 (정기/비정기 클릭 시 스크롤 이동)
- **SeminarDetailDialog**: 세미나 상세 (하단 슬라이드 토스트 팝업)
  - 탭 UI: 체크리스트 / 상세정보 탭으로 구분
  - 정기/비정기 세미나 모달 높이 통일
- **SeminarFormDialog**: 정기 세미나 등록/수정 폼 (하단 슬라이드 토스트 팝업)
- **SeminarRequestFormDialog**: 비정기 요청 등록/수정 폼 (하단 슬라이드 토스트 팝업)
- **ChecklistSection/ChecklistTabs**: 체크리스트 섹션 및 탭
- **ChecklistItemComponent**: 개별 체크리스트 항목
- **ProgressBar/PhaseProgress**: 진행률 바

### 자료실 관련 (신규)

- **ResourceView**: 자료실 메인 뷰 (카테고리/서브카테고리 탭)
- **ResourceCard**: 자료 카드 (파일 그룹화, 타입 배지 표시)
- **ResourceViewer**: 파일 뷰어 (하단 슬라이드 팝업)
  - PDF: iframe 직접 표시
  - Office: Google Docs Viewer
- **ResourceFormDialog**: 자료 등록 폼 (하단 슬라이드 팝업)
- **FileTypeSelector**: 파일 타입 선택 모달 (그룹화된 파일용)

### 일정 관련 (신규)

- **ScheduleView**: 일정 메인 뷰 (월별 그룹화, 카테고리 필터)
- **ScheduleCard**: 일정 카드 (회의/외근 구분 표시)
- **ScheduleFormDialog**: 일정 등록/수정 폼 (하단 슬라이드 팝업)
  - 회의: 회의 유형, 회의 주제, 날짜/시간, 장소
  - 외근: 외근 유형, 센터/RM/연락처, 고객정보, 미팅 주제, 준비물
- **ScheduleDetailDialog**: 일정 상세 (하단 슬라이드 팝업)

### UI 패턴

- **토스트 팝업**: 하단에서 올라오는 슬라이드 팝업 (`animate-in slide-in-from-bottom`)
  - 컴팩트 헤더: 카테고리별 배경색, 아이콘 버튼, 한 줄 메타 정보
  - 스크롤 가능한 콘텐츠 영역
  - 고정 푸터 (액션 버튼)

### 공통 (2026-02-06 업데이트)

- **BottomNav**: 하단 네비게이션 (홈, 목록, 캘린더, 세미나, 기사관리)
- **EmptyState**: 빈 화면 컴포넌트 (아이콘 + 제목 + 설명 + CTA)
- **Toaster (sonner)**: 토스트 알림 (success/error/warning)

## 기본 체크리스트 템플릿

세미나 생성 시 자동으로 추가되는 기본 체크리스트:

### 사전 (D-14 ~ D-1)

| 순서 | 항목                  | 목표일 |
| ---- | --------------------- | ------ |
| 1    | 강의자료 초안 작성    | D-14   |
| 2    | 강의자료 내부 검토    | D-10   |
| 3    | 참석자 명단 취합      | D-7    |
| 4    | 강의자료 확정         | D-5    |
| 5    | 강의자료 제본         | D-5    |
| 6    | 안내 문자/이메일 발송 | D-3    |
| 7    | 현수막/배너 준비      | D-2    |
| 8    | 기념품 준비           | D-1    |
| 9    | 참석자 명단 최종 확인 | D-1    |

### 당일 (D-day)

| 순서 | 항목                |
| ---- | ------------------- |
| 1    | 장소 세팅 확인      |
| 2    | 음향/영상 장비 점검 |
| 3    | 참석자 등록         |
| 4    | 강의 진행           |
| 5    | 설문조사 수집       |

### 사후 (D+1 ~ D+7)

| 순서 | 항목                  | 목표일 |
| ---- | --------------------- | ------ |
| 1    | 참석자 감사 문자 발송 | D+1    |
| 2    | 강의자료 공유         | D+2    |
| 3    | 설문조사 결과 정리    | D+3    |
| 4    | 후속 미팅 스케줄링    | D+7    |

## 권한 시스템 (신규)

### 권한 모델

```typescript
interface UserPermissions {
  articles: {
    create: boolean;  // 기사 등록
    update: boolean;  // 기사 수정
    delete: boolean;  // 기사 삭제
  };
  seminars: {
    create: boolean;  // 세미나 등록
    update: boolean;  // 세미나 수정
    delete: boolean;  // 세미나 삭제
  };
}
```

### 권한 체크 흐름

1. **API 요청** → `requirePermission(request, resource, action)`
2. **JWT 토큰 검증** → 현재 사용자 조회
3. **권한 확인**:
   - `is_admin === true` → 모든 권한 허용
   - `permissions[resource][action] === true` → 해당 권한 허용
   - 그 외 → 403 Forbidden

### 접근 권한 구조

| 사용자 유형 | 홈/목록/캘린더/세미나 조회 | 일정 조회 | 일정 등록/수정/삭제 | 푸시 알림 | 자료실 | 기사관리 |
|------------|--------------------------|----------|-------------------|----------|--------|---------|
| 비로그인 사용자 | ✅ 가능 | ✅ 가능 | ❌ 불가 | ❌ 불가 | ❌ 불가 | ❌ 불가 |
| 일반 사용자 | ✅ 가능 | ✅ 가능 | ✅ 가능 | ✅ 가능 | ❌ 불가 | ❌ 불가 |
| 특정 이메일 | ✅ 가능 | ✅ 가능 | ✅ 가능 | ✅ 가능 | ✅ 가능 | ❌ 불가 |
| 관리자 | ✅ 가능 | ✅ 가능 | ✅ 가능 | ✅ 가능 | ✅ 가능 | ✅ 가능 |

**접근 권한 정책 (2026-02-04 업데이트)**:
- **홈, 목록, 캘린더, 세미나**: 로그인 없이 조회 가능
- **일정**: 조회는 로그인 없이 가능, 등록/수정/삭제는 로그인 필요
- **푸시 알림**: 로그인한 사용자만 구독 가능
- **자료실**: 특정 이메일(tobeapro@gmail.com, sweetas11@nhsec.com) 또는 관리자만 접근 가능
- **기사관리**: 관리자 전용

### 기본 권한

| 사용자 유형 | articles | seminars |
|------------|----------|----------|
| 관리자 (is_admin=true) | 모든 권한 | 모든 권한 |
| 일반 사용자 | 모두 false | 모두 false |

### 보호된 계정

- `admin@hnw.co.kr`: 관리자 해제 버튼 숨김 (UI에서 보호)

## 색상 코드

### 세미나 카테고리

| 카테고리     | 색상 | Tailwind       |
| ------------ | ---- | -------------- |
| 패밀리오피스 | 보라 | `violet-500` |
| 법인         | 하늘 | `sky-500`    |

### 세미나 유형

| 유형   | 색상 | Tailwind        |
| ------ | ---- | --------------- |
| 정기   | 초록 | `emerald-500` |
| 비정기 | 주황 | `amber-500`   |

### 체크리스트 단계

| 단계 | 색상 | Tailwind        |
| ---- | ---- | --------------- |
| 사전 | 노랑 | `amber-500`   |
| 당일 | 주황 | `orange-500`  |
| 사후 | 초록 | `emerald-500` |

## 환경 변수

```env
# MongoDB
MONGODB_URI=mongodb+srv://...

# Auth
JWT_SECRET=your-jwt-secret
ADMIN_SECRET_KEY=hnw-admin-2025  # 관리자 회원가입 시 필요

# Web Push (VAPID Keys) - 신규
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...   # 공개 키 (클라이언트에서 사용)
VAPID_PRIVATE_KEY=...              # 비공개 키 (서버에서만 사용)

# Cron 보안
CRON_SECRET=...                    # Vercel Cron 인증용
```

### VAPID 키 생성 방법

```bash
npx web-push generate-vapid-keys
```

## 관리자 계정

### 기본 관리자 계정

| 항목     | 값                 |
| -------- | ------------------ |
| 이메일   | admin@hnw.co.kr    |
| 비밀번호 | admin1234          |
| 권한     | admin              |

### 계정 리셋 방법

MongoDB에서 직접 리셋:
```javascript
// Node.js 스크립트
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

const uri = 'mongodb+srv://tobeapro:1023@cluster0.ppfoisv.mongodb.net/hnw-archive';
const client = new MongoClient(uri);

await client.connect();
const db = client.db('hnw-archive');

// 기존 사용자 삭제
await db.collection('users').deleteMany({});

// 새 관리자 생성
const hashedPassword = await bcrypt.hash('admin1234', 10);
await db.collection('users').insertOne({
  email: 'admin@hnw.co.kr',
  password: hashedPassword,
  name: 'HNW Admin',
  is_admin: true,  // 중요: role이 아닌 is_admin 필드 사용
  createdAt: new Date(),
});
```

### 새 관리자 추가 (회원가입)

1. 앱 접속 → 로그인 화면 → 회원가입
2. 관리자 키 입력: `hnw-admin-2025`

## 배포

### Vercel 배포

```bash
# 프로덕션 배포
npx vercel --prod

# 환경 변수 설정
vercel env add MONGODB_URI
vercel env add JWT_SECRET
vercel env add ADMIN_SECRET_KEY
```

## 향후 개선 사항

1. **이미지 업로드**: Cloudinary 연동으로 썸네일 이미지 업로드
2. ~~**알림 기능**: 새 기사 등록 시 슬랙/이메일 알림, D-day 알림~~ ✅ 웹 푸시 구현 완료
3. **통계 대시보드**: 기간별, 언론사별 통계 차트
4. **PDF 내보내기**: 월간 홍보 리포트 PDF 생성
5. **참석자 관리**: 세미나 참석자 명단 DB 연동
6. **세미나 리포트**: 월별/분기별 세미나 리포트 생성
7. **슬랙/이메일 알림**: D-day 알림 채널 확장

## 성능 최적화

### MongoDB 인덱스

다음 인덱스가 생성되어 쿼리 성능을 향상시킵니다:

```javascript
// seminars 컬렉션
{ date: -1 }
{ category: 1, status: 1 }
{ seminarType: 1 }

// checklist_items 컬렉션
{ seminarId: 1 }  // N+1 쿼리 해결의 핵심

// articles 컬렉션
{ publishedAt: -1 }
{ category: 1 }
{ tag: 1 }
{ eventId: 1 }

// seminar_requests 컬렉션
{ requestedDate: -1 }
{ status: 1 }

// resources 컬렉션 (신규)
{ category: 1, subCategory: 1 }
{ uploadedAt: -1 }

// events 컬렉션
{ date: -1 }
```

**인덱스 생성 방법**: `GET /api/admin/migrate` 호출

### 쿼리 최적화

#### 세미나 API N+1 쿼리 제거

기존 방식 (N+1 문제):
```javascript
// 세미나 100개 = 101번 DB 쿼리
const seminars = await collection.find().toArray();
for (const seminar of seminars) {
  const checklist = await checklistCollection.find({ seminarId: seminar._id }).toArray();
}
```

개선 방식 ($lookup 집계):
```javascript
// 1번의 쿼리로 모든 데이터 조회
const result = await collection.aggregate([
  { $match: filter },
  { $lookup: { from: "checklist_items", ... } },
  { $addFields: { progress: { ... } } }
]).toArray();
```

### API 병렬화

홈화면 초기 로딩 시 병렬 처리:
```javascript
// 기존: 순차 호출
await fetch("/api/articles");
await fetch("/api/auth/me");

// 개선: 병렬 호출
await Promise.all([
  fetch("/api/articles"),
  fetch("/api/auth/me"),
]);
```

### HTTP 캐싱

```typescript
// articles, seminars API에 적용
return NextResponse.json(data, {
  headers: {
    "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
  },
});
```

- `s-maxage=30`: CDN에서 30초간 캐시
- `stale-while-revalidate=60`: 60초간 캐시 응답 제공하면서 백그라운드 갱신

## 최근 업데이트 내역

### 2026-02-06
- **NDS 디자인가이드 기반 UI 개선**:
  - sonner 토스트 도입: `alert()` 44개소 → `toast.success/error/warning` 전면 교체
  - EmptyState 컴포넌트 생성: 빈 화면 10개소 교체 (아이콘+제목+설명+CTA)
  - 터치 영역 확대: 버튼/입력/탭/셀렉트/스위치 최소 40px (WCAG 접근성)
  - 모달 스크롤 방지: `position:fixed` + scroll restore 패턴 통일
- **푸시 알림 확장**:
  - 금일 일정 알림 크론 (`/api/cron/daily-schedule`): 매일 오전 8시 KST
  - 일정 리마인더 크론 (`/api/cron/schedule-reminder`): 5분 간격, 회의 20분전/외근 1시간전
  - 알림 타입별 관리: `notificationTypes` 배열 (dday/daily)
  - 알림 설정 API (`/api/push/settings`): GET/PATCH
- **푸시 알림 버그 수정**:
  - 기존 구독자(`notificationTypes` 필드 미존재) daily/reminder 크론에서 누락되던 문제
  - 3개 크론 모두 `$or` + `$exists: false` fallback 패턴 통일

### 2026-02-05
- **설정 모달 UI 개선**:
  - 모달 로딩 상태 개선: 빈 프레임 대신 로딩 스피너 표시
  - `NotificationSettings`에서 `onInitialized` 콜백으로 초기화 완료 알림
  - `SettingsDialog`에서 초기화 완료 전까지 콘텐츠 숨김 처리
  - 모달 열릴 때 배경 스크롤 방지 (`body.style.overflow = "hidden"`)
  - 백드롭 터치 스크롤 방지 (`onTouchMove` 이벤트)
- **푸시 구독 마이그레이션 수정**:
  - 기존 구독자의 `notificationTypes` 필드 누락 문제 해결
  - `$setOnInsert` 대신 조건부 `$set` 사용하여 업데이트 시에도 기본값 설정

### 2026-02-04
- **권한 체계 개선**:
  - 홈, 목록, 캘린더, 세미나: 로그인 없이 조회 가능 (이미 구현됨)
  - 자료실, 기사관리: 로그인 시에만 하단 네비게이션에 표시 (이미 구현됨)
  - 푸시 알림: 로그인한 사용자만 구독 가능 (신규)
  - 등록/수정/삭제: 로그인 필요 (이미 구현됨)
- **일정 관리 기능 추가**:
  - 회의 관리: 팀회의, 외부미팅, 부서간회의
  - 외근 관리: 직원미팅, 고객미팅
  - 회의 정보: 회의 주제, 날짜/시간, 장소
  - 외근 정보: 센터, 담당RM, 연락처, 고객명, 고객 기타정보, 미팅 주제, 준비물
  - 일정 CRUD API 엔드포인트 구현
  - 월별 그룹화 및 카테고리 필터 지원
  - 하단 네비게이션에 일정 탭 추가
- **캘린더 UX 개선**:
  - 기사 아이콘: 원형 → 사각형으로 변경 (세미나와 명확히 구분)
  - 아이콘 크기 통일: 사각형, 원, 삼각형 모두 10px로 통일
  - 스와이프 제스처 추가: 달력 위에서 좌우 스와이프로 월 이동 (최소 50px)
  - 자동 선택 기능:
    - 초기 로딩 시: 가장 가까운 미래 일정/기사/세미나 자동 선택하여 표시
    - 월 변경 시: 해당 월의 첫 번째 일정/기사/세미나 자동 선택하여 하단에 표시
- **세미나 캘린더 UX 개선**:
  - 스와이프 제스처 추가: 달력 위에서 좌우 스와이프로 월 이동 (최소 50px)
- **일정 정렬 변경**:
  - 날짜 오름차순 정렬로 변경 (가장 가까운 일정이 상단)
  - 월별 그룹도 오름차순 정렬

### 2026-01-29
- **자료실 기능 추가**:
  - 네비게이션에 자료실 탭 추가 (세미나와 기사관리 사이)
  - 카테고리: 회의록(내부/외부/한장요약), 보고서(전문/요약), 기획안
  - 파일 뷰어: PDF(iframe), Office(Google Docs Viewer)
  - 파일 그룹화: 동일 파일명 다른 확장자 파일 하나의 카드로 표시
  - MongoDB에 base64로 파일 저장 (Vercel 배포 호환)
  - 하단 슬라이드업 모달 (등록/상세)
- **자료실 성능 최적화**:
  - resources 컬렉션 인덱스 추가 (category+subCategory, uploadedAt)
  - 프론트엔드 캐싱: 30초 TTL, stale-while-revalidate 패턴
  - 탭 전환 시 캐시된 데이터 즉시 표시
- **세미나 프론트엔드 캐싱 추가**:
  - 연도별 캐시 30초 TTL
  - stale-while-revalidate 패턴 적용
  - 등록/수정/삭제 시 캐시 무효화
- **명칭 변경**: 핵심요약 → 한장요약
- **migrate API 개선**: 부분 문자열 교체 기능 추가

### 2026-01-28 (밤)
- **성능 최적화**:
  - MongoDB 인덱스 생성 API 추가 (`GET /api/admin/migrate`)
  - 세미나 API N+1 쿼리 제거 ($lookup 집계 파이프라인)
  - 홈화면 API 병렬화 (articles + auth 동시 호출)
  - HTTP 응답 캐싱 적용 (30초 캐시 + stale-while-revalidate)
- **비정기 세미나 요청 개선**:
  - 비고란 크기 확대 (min-h 120px, max-h 300px) 및 리사이즈 가능
  - 카드에 비고 미리보기 표시 (30자 이상시 말줄임)
  - 비고 클릭 시 팝업으로 전체 내용 보기
  - 카드에 D-day 표시 추가 (7일 이내 빨간색, 이후 주황색)
- **모달 스크롤 문제 해결**:
  - 모달 좌우 스크롤 방지 (overflow-x-hidden)
  - 세미나 상세 모달 열릴 때 body 스크롤 완전 차단 (position: fixed)
  - 터치 이벤트 전파 방지

### 2026-01-28 (저녁)
- **푸시 알림 방식 개선**:
  - 발송 시간: 오전 9시 → 오전 10시(KST)로 변경
  - 발송 조건: D-7/D-3/D-1/D-day 조건 → 매일 가장 가까운 세미나 알림
  - 대상: 패밀리오피스/법인 카테고리별 각 1건씩 (총 2건)
- **대시보드 distinct 통계**: 태그별 이벤트 건수 표시
  - 보도기사: 이벤트명 기준 중복 제거
  - 단독기사/특집기사: 이벤트명 + 발행일 기준 중복 제거

### 2026-01-28 (오후)
- **푸시 알림 랜딩 개선**: 알림 클릭 시 세미나 탭으로 이동 (`/?tab=seminar`)
- **세미나 API 권한 강화**: 세미나/비정기요청/체크리스트 CUD API에 관리자 권한 필수
- **세미나 상세 모달 UI 개선**:
  - 체크리스트/상세정보 탭 UI 추가 (쉬운 탐색)
  - 정기/비정기 세미나 모달 높이 통일
- **기사관리 썸네일 일괄 다운로드**: 기존 이미지가 있는 기사는 건너뛰기 (안내 메시지 추가)
- **스크롤 위치 수정**: 정기/비정기 카드 클릭 시 섹션 제목이 최상단에 표시되도록 scroll-mt-32 적용
- **푸시 구독 구조 명확화**: 로그인 불필요, 브라우저 endpoint 기반 구독 방식

### 2026-01-28 (오전)
- **사용자 권한 관리**: 관리자가 일반 사용자에게 세부 권한 부여 가능
- **관리자 승격/해제**: UI에서 관리자 권한 토글 가능
- **API 권한 체크**: 기사/세미나 CRUD API에 권한 검증 추가
- **헤더 UI 개선**: 제목 두 줄 분리 (HNW / 홍보 아카이브), 아이콘 단순화 (Bell + User)

### 2026-01-27
- **웹 푸시 알림**: Service Worker 기반 백그라운드 푸시
- **D-day 알림 크론**: 매일 오전 10시 세미나 알림 (패밀리오피스/법인 각 1건)
- **설정 화면**: 알림 구독/해제 UI 추가
