# HNW 홍보 아카이브 - 아키텍처 문서

## 프로젝트 개요

NH투자증권 HNW(High Net Worth) 본부의 홍보 기사 아카이브 웹 애플리케이션입니다.
패밀리오피스, 세미나, 인터뷰 등 다양한 홍보 활동 관련 기사를 수집하고 관리합니다.

## 기술 스택

### Frontend
- **Next.js 15** - App Router 사용
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

## 디렉토리 구조

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API 라우트
│   │   ├── auth/          # 인증 API (login, logout, register, me)
│   │   ├── articles/      # 기사 CRUD API
│   │   │   └── [id]/      # 개별 기사 수정/삭제
│   │   └── news/          # 뉴스 검색 API
│   │       └── search/    # Google News RSS 검색
│   ├── admin/             # 관리자 페이지
│   │   └── page.tsx       # 기사 관리 대시보드
│   ├── layout.tsx         # 루트 레이아웃
│   ├── page.tsx           # 메인 페이지
│   └── globals.css        # 전역 스타일
├── components/            # React 컴포넌트
│   ├── ui/               # shadcn/ui 기본 컴포넌트
│   ├── article-card.tsx  # 기사 카드 컴포넌트
│   ├── article-group.tsx # 이벤트별 기사 그룹 컴포넌트
│   ├── bottom-nav.tsx    # 하단 네비게이션
│   └── calendar-view.tsx # 캘린더 뷰
└── lib/
    ├── mongodb.ts        # MongoDB 연결
    ├── types.ts          # 공통 타입 정의
    └── utils.ts          # 유틸리티 함수

docs/                      # 프로젝트 문서
├── architecture.md        # 아키텍처 문서
└── troubleshooting.md     # 트러블슈팅 가이드

.claude/                   # Claude Code 설정
└── settings.json          # 프로젝트 설정
```

## 데이터 흐름

### 기사 등록 및 관련 기사 수집
```
관리자 기사 등록 (admin/page.tsx)
    ↓
기사 저장 (POST /api/articles)
    ↓
관련 기사 자동 검색 시작
    ↓
Google News RSS 검색 (/api/news/search)
    - 핵심키워드: NH투자증권/NH증권 (필수)
    - 기타키워드: 패밀리오피스, 세미나 등 (1개 이상)
    ↓
필터링
    1. 제목에 핵심키워드 + 기타키워드 포함
    2. 발행일 이후 1개월 기간 내
    ↓
관련 기사 선택 (체크박스)
    ↓
선택된 기사 일괄 저장
```

### 인증 흐름
```
로그인/회원가입 (admin/page.tsx)
    ↓
/api/auth/login 또는 /api/auth/register
    ↓
JWT 쿠키 발급
    ↓
/api/auth/me (인증 상태 확인)
```

## 주요 기능

### 1. 홈 화면 (메인 대시보드)
- **통계 대시보드**: 전체 기사 수, 언론사 수
- **카테고리별 통계**: 인터뷰, 세미나 홍보, 솔루션 소개 (게이지 그래프)
- **최근 홍보**: 최근 등록된 기사 목록 (이벤트별 그룹화)

### 2. 기사 목록 (리스트 뷰)
- **검색**: 기사 제목, 키워드, 언론사명 검색
- **카테고리 필터**: 인터뷰, 세미나 홍보, 솔루션 소개/홍보
- **태그 필터**: 단독기사, 특집기사, 보도기사
- **이벤트별 그룹화**: 같은 이벤트 기사 펼치기/접기

### 3. 캘린더 뷰
- 월별 캘린더에 기사 표시
- 날짜 클릭 시 해당 날짜 기사 목록

### 4. 관리자 페이지
- **기사 CRUD**: 추가, 수정, 삭제
- **자동 크롤링**: 기사 저장 후 관련 기사 자동 검색
- **일괄 등록**: 검색된 기사 선택하여 일괄 저장

### 5. 이벤트별 기사 그룹화
- 같은 이벤트명의 기사들을 하나의 그룹으로 표시
- 대표 기사 1개만 표시, 나머지는 펼치기/접기
- 연관 기사 수 배지 표시

## 뉴스 검색 로직

### 검색 조건
```
핵심키워드 (필수): NH투자증권 / NH증권
기타키워드 (1개 이상): 사용자 입력 키워드 (쉼표로 구분)

검색 공식:
("NH투자증권" OR "NH증권") AND ("키워드1" OR "키워드2" OR ...)
```

### 필터링 조건
1. **제목 필터**: 핵심키워드 + 기타키워드 중 1개 이상 포함
2. **날짜 필터**: 발행일 이후 1개월 (발행일 ~ 발행일+30일)

### 더벨 특별 처리
- 더벨(thebell.co.kr)은 일반 검색에서 제외되는 경우가 있어 별도 검색
- `site:thebell.co.kr` 쿼리로 추가 검색

## 데이터베이스 스키마

### MongoDB Collections

#### articles
```javascript
{
  _id: ObjectId,
  title: String,           // 기사 제목
  keyword: String,         // 검색용 키워드
  interviewee: String,     // 인터뷰이 (인터뷰 카테고리일 때)
  publishedAt: Date,       // 발행일
  category: String,        // "인터뷰" | "세미나 홍보" | "솔루션 소개/홍보"
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

#### users
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

## 환경 변수

```env
# MongoDB
MONGODB_URI=mongodb+srv://...

# Auth
JWT_SECRET=your-jwt-secret
ADMIN_SECRET_KEY=your-admin-key  # 관리자 회원가입 시 필요
```

## API 엔드포인트

### 인증 API
| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | /api/auth/register | 회원가입 |
| POST | /api/auth/login | 로그인 |
| POST | /api/auth/logout | 로그아웃 |
| GET | /api/auth/me | 현재 사용자 정보 |

### 기사 API
| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | /api/articles | 기사 목록 조회 |
| POST | /api/articles | 기사 등록 |
| PUT | /api/articles/[id] | 기사 수정 |
| DELETE | /api/articles/[id] | 기사 삭제 |

### 뉴스 검색 API
| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | /api/news/search | Google News RSS 검색 |

## UI 컴포넌트

### ArticleCard
기사 카드 컴포넌트. 썸네일, 제목, 카테고리, 태그, 발행일, 언론사, 이벤트명 표시.

### ArticleGroup
이벤트별 기사 그룹 컴포넌트. 같은 이벤트의 기사들을 그룹화하여 펼치기/접기 기능 제공.

### BottomNav
하단 네비게이션. 홈, 목록, 캘린더, 관리자 탭.

### CalendarView
월별 캘린더. 기사가 있는 날짜에 점 표시, 클릭 시 해당 날짜 기사 조회.

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
2. **알림 기능**: 새 기사 등록 시 슬랙/이메일 알림
3. **통계 대시보드**: 기간별, 언론사별 통계 차트
4. **PDF 내보내기**: 월간 홍보 리포트 PDF 생성
