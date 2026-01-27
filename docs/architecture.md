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
│   │   ├── image/                # 이미지 검색 API
│   │   └── og-image/             # OG 이미지 API
│   ├── admin/                    # 관리자 페이지
│   ├── layout.tsx                # 루트 레이아웃
│   ├── page.tsx                  # 메인 페이지
│   └── globals.css               # 전역 스타일
├── components/
│   ├── ui/                       # shadcn/ui 기본 컴포넌트
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
│   ├── article-card.tsx          # 기사 카드 컴포넌트
│   ├── article-group.tsx         # 이벤트별 기사 그룹 컴포넌트
│   ├── bottom-nav.tsx            # 하단 네비게이션
│   └── calendar-view.tsx         # 홍보 캘린더 뷰
└── lib/
    ├── mongodb.ts                # MongoDB 연결
    ├── types.ts                  # 공통 타입 정의
    ├── seminar-types.ts          # 세미나 타입 정의 (신규)
    └── utils.ts                  # 유틸리티 함수

docs/                             # 프로젝트 문서
├── architecture.md               # 아키텍처 문서
└── troubleshooting.md            # 트러블슈팅 가이드

.claude/                          # Claude Code 설정
└── settings.json                 # 프로젝트 설정
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

- 월별 캘린더에 기사 표시
- 날짜 클릭 시 해당 날짜 기사 목록

### 4. 세미나 관리 (신규)

- **세미나 현황 대시보드**
  - 정기/비정기 세미나 통계 (대기/승인/완료)
  - 카테고리별 통계 (패밀리오피스/법인)
  - 이번 주 세미나 알림
- **세미나 캘린더**
  - 월별 캘린더에 세미나 일정 표시
  - 정기 세미나: 카테고리별 색상 (보라/하늘)
  - 비정기 요청: 주황색 점
- **세미나 등록/수정**
  - 정기 세미나: 제목, 날짜, 장소, 카테고리, 예상 참석자 수
  - 비정기 요청: 요청센터, 대상법인, 주제, 요청일자 등
- **체크리스트 관리**
  - 사전/당일/사후 3단계 체크리스트
  - 진행률 시각화 (전체/단계별)
  - 항목별 목표일 표시 (목표일: 2/15 형식)
  - 항목 추가/삭제/완료 토글

### 5. 기사관리 (관리자)

- **기사 CRUD**: 추가, 수정, 삭제
- **자동 크롤링**: 기사 저장 후 관련 기사 자동 검색
- **일괄 등록**: 검색된 기사 선택하여 일괄 저장

## 하단 네비게이션

| 탭       | 아이콘        | 설명                    |
| -------- | ------------- | ----------------------- |
| 홈       | Home          | 메인 대시보드           |
| 목록     | List          | 홍보 기사 목록          |
| 캘린더   | Calendar      | 홍보 캘린더             |
| 세미나   | ClipboardList | 세미나 관리             |
| 기사관리 | Settings      | 관리자 전용 (로그인 시) |

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
  createdAt: Date
}
```

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

## API 엔드포인트

### 인증 API

| 메서드 | 경로               | 설명             |
| ------ | ------------------ | ---------------- |
| POST   | /api/auth/register | 회원가입         |
| POST   | /api/auth/login    | 로그인           |
| POST   | /api/auth/logout   | 로그아웃         |
| GET    | /api/auth/me       | 현재 사용자 정보 |

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

| 메서드 | 경로               | 설명                                              |
| ------ | ------------------ | ------------------------------------------------- |
| GET    | /api/seminars      | 세미나 목록 (필터: year, month, category, status) |
| POST   | /api/seminars      | 세미나 생성 (+ 기본 체크리스트 자동 생성)         |
| GET    | /api/seminars/[id] | 세미나 상세 + 체크리스트                          |
| PUT    | /api/seminars/[id] | 세미나 수정                                       |
| DELETE | /api/seminars/[id] | 세미나 삭제 (+ 체크리스트 삭제)                   |

### 비정기 세미나 요청 API (신규)

| 메서드 | 경로                       | 설명      |
| ------ | -------------------------- | --------- |
| GET    | /api/seminar-requests      | 요청 목록 |
| POST   | /api/seminar-requests      | 요청 등록 |
| PUT    | /api/seminar-requests/[id] | 요청 수정 |
| DELETE | /api/seminar-requests/[id] | 요청 삭제 |

### 체크리스트 API (신규)

| 메서드 | 경로                         | 설명                 |
| ------ | ---------------------------- | -------------------- |
| GET    | /api/seminars/[id]/checklist | 체크리스트 조회      |
| POST   | /api/seminars/[id]/checklist | 체크리스트 항목 추가 |
| PATCH  | /api/checklist/[itemId]      | 항목 완료 토글       |
| DELETE | /api/checklist/[itemId]      | 항목 삭제            |

## UI 컴포넌트

### 홍보 관련

- **ArticleCard**: 기사 카드 컴포넌트
- **ArticleGroup**: 이벤트별 기사 그룹 컴포넌트
- **CalendarView**: 홍보 월별 캘린더

### 세미나 관련 (신규)

- **SeminarView**: 세미나 메인 뷰 (캘린더/리스트 토글)
- **SeminarCalendar**: 세미나 월별 캘린더
- **SeminarCard/SeminarListItem**: 세미나 카드/리스트 항목
- **SeminarStats**: 통합 통계 카드 (정기/비정기 구분)
- **SeminarDetailDialog**: 세미나 상세 (슬라이드 팝업)
- **SeminarFormDialog**: 정기 세미나 등록/수정 폼
- **SeminarRequestFormDialog**: 비정기 요청 등록/수정 폼
- **ChecklistSection/ChecklistTabs**: 체크리스트 섹션 및 탭
- **ChecklistItemComponent**: 개별 체크리스트 항목
- **ProgressBar/PhaseProgress**: 진행률 바

### 공통

- **BottomNav**: 하단 네비게이션 (홈, 목록, 캘린더, 세미나, 기사관리)

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
  role: 'admin',
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
2. **알림 기능**: 새 기사 등록 시 슬랙/이메일 알림, D-day 알림
3. **통계 대시보드**: 기간별, 언론사별 통계 차트
4. **PDF 내보내기**: 월간 홍보 리포트 PDF 생성
5. **참석자 관리**: 세미나 참석자 명단 DB 연동
6. **세미나 리포트**: 월별/분기별 세미나 리포트 생성
