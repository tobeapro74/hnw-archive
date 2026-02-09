# HNW 홍보 아카이브

NH투자증권 HNW(High Net Worth) 본부의 홍보 기사 아카이브 및 세미나 관리 웹 애플리케이션

[![Vercel](https://vercel.com/button)](https://hnw-archive.vercel.app)

## 주요 기능

- **홍보 관리**: 기사 아카이브, 검색, 필터링, 이벤트별 그룹화
- **세미나 관리**: 정기/비정기 세미나 일정, 체크리스트, 통계
- **일정 관리**: 팀 회의 및 외근 일정 관리
- **자료실**: 회의록, 보고서, 기획안 문서 관리
- **웹 푸시 알림**: D-day 세미나 알림(오전 10시), 일일 일정 알림(오전 8시), 회의/외근 리마인더 (주말 제외)
- **권한 관리**: 사용자별 세부 권한 설정

## 기술 스택

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, MongoDB Atlas
- **Deployment**: Vercel
- **PWA**: 홈화면 추가 지원

## 시작하기

### 요구사항

- Node.js 18 이상
- MongoDB Atlas 계정

### 설치

```bash
# 패키지 설치
npm install

# 환경 변수 설정
cp .env.example .env.local
# .env.local 파일에 MongoDB URI, JWT Secret 등 설정

# 개발 서버 실행
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 열기

### 환경 변수

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

VAPID 키 생성:
```bash
npx web-push generate-vapid-keys
```

## 기본 관리자 계정

- **이메일**: admin@hnw.co.kr
- **비밀번호**: admin1234

## 프로젝트 구조

```
src/
├── app/                    # Next.js App Router
│   ├── api/                # API 라우트
│   ├── admin/              # 관리자 페이지
│   └── page.tsx            # 메인 페이지
├── components/
│   ├── ui/                 # shadcn/ui 컴포넌트
│   ├── seminar/            # 세미나 관련 컴포넌트
│   ├── schedule/           # 일정 관련 컴포넌트
│   └── resource/           # 자료실 관련 컴포넌트
└── lib/
    ├── mongodb.ts          # MongoDB 연결
    └── types.ts            # 타입 정의
```

## 문서

- [기능 명세](docs/FEATURES.md)
- [아키텍처](docs/architecture.md)
- [API 문서](docs/API.md)
- [트러블슈팅](docs/troubleshooting.md)

## 배포

### Vercel 배포

```bash
# 프로덕션 배포
npx vercel --prod

# 환경 변수 설정
vercel env add MONGODB_URI
vercel env add JWT_SECRET
```

배포 URL: https://hnw-archive.vercel.app

## 라이선스

Private - NH투자증권 HNW 본부 내부용
