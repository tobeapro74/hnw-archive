# HNW 홍보 아카이브 - 프로젝트 요구사항 정의 (PRD)

## 프로젝트 개요

**프로젝트명**: HNW 홍보 아카이브
**목적**: NH투자증권 HNW(High Net Worth) 본부의 홍보 기사 아카이브 및 세미나 관리 웹 애플리케이션
**타겟 사용자**: HNW 본부 홍보팀 및 관련 부서

## 핵심 가치

1. **통합 관리**: 홍보 기사와 세미나를 한 곳에서 관리
2. **효율적인 검색**: 카테고리/태그/기간별 빠른 검색
3. **체계적인 세미나 관리**: 체크리스트 기반 세미나 준비 프로세스
4. **실시간 알림**: D-day 기반 푸시 알림으로 일정 관리

## 기능 요구사항

### Phase 1: 홍보 기사 관리 (완료)
- [x] 홈 대시보드 (통계, 최근 홍보)
- [x] 기사 목록 (검색, 필터링)
- [x] 카테고리 필터 (인터뷰, 세미나 안내, 소개 및 홍보)
- [x] 태그 필터 (단독기사, 특집기사, 보도기사)
- [x] 홍보 캘린더 (월별 기사 표시)
- [x] 기사 CRUD (등록/수정/삭제)
- [x] 이벤트별 기사 그룹화

### Phase 2: 세미나 관리 (완료)
- [x] 세미나 현황 대시보드
- [x] 세미나 캘린더 (정기/비정기 구분)
- [x] 정기 세미나 등록/수정
- [x] 비정기 세미나 요청 관리
- [x] 체크리스트 관리 (사전/당일/사후)
- [x] 진행률 시각화

### Phase 3: 사용자 인증 및 권한 (완료)
- [x] 로그인/회원가입
- [x] 관리자/일반 사용자 구분
- [x] 세부 권한 관리 (기사/세미나별)
- [x] 관리자 승격/해제

### Phase 4: 푸시 알림 (완료)
- [x] Service Worker 기반 웹 푸시
- [x] D-day 알림 크론 (매일 오전 10시)
- [x] 카테고리별 알림 (패밀리오피스/법인)
- [x] 알림 구독/해제 설정

### Phase 5: 성능 최적화 (완료)
- [x] MongoDB 인덱스 최적화
- [x] N+1 쿼리 제거 ($lookup)
- [x] API 병렬화
- [x] HTTP 응답 캐싱

### Phase 6: UX 개선 (완료)
- [x] 하단 슬라이드 토스트 팝업
- [x] 모달 스크롤 문제 해결
- [x] body 스크롤 방지
- [x] 비정기 요청 비고란 개선
- [x] D-day 표시

## 비기능 요구사항

### 성능
- 초기 로딩: 3초 이내
- API 응답: 500ms 이내
- 캐싱: 30초 CDN 캐시 + stale-while-revalidate

### 호환성
- iOS Safari 완벽 지원
- 모바일 최적화 UI (터치 친화적)
- PWA 지원 (홈화면 추가)

### 보안
- JWT 기반 인증
- 권한 기반 API 접근 제어
- HTTPS 통신

## 데이터 구조

### 기사 데이터
```typescript
interface Article {
  _id: string;
  title: string;
  keyword: string;
  publishedAt: Date;
  category: "인터뷰" | "세미나 안내" | "소개 및 홍보";
  tag: "단독기사" | "특집기사" | "보도기사";
  thumbnailUrl: string;
  articleUrl: string;
  mediaName: string;
  eventName: string;
}
```

### 세미나 데이터
```typescript
interface Seminar {
  _id: string;
  title: string;
  seminarType: "정기" | "비정기";
  date: Date;
  location: string;
  category: "패밀리오피스" | "법인";
  status: "준비중" | "완료" | "취소";
  expectedAttendees?: number;
  actualAttendees?: number;
}
```

### 비정기 세미나 요청
```typescript
interface SeminarRequest {
  _id: string;
  requestingCenter: string;
  targetCorporation: string;
  requestedDate: Date;
  topics: string[];
  status: "요청접수" | "검토중" | "승인" | "반려" | "완료";
  notes?: string;
}
```

## 성공 지표

1. **사용성**: 3번의 탭 이내 원하는 정보 접근
2. **데이터 정확성**: 실시간 동기화된 기사/세미나 현황
3. **알림 도달률**: D-day 알림 100% 발송

## 제약사항

- Vercel 서버리스 함수 실행 시간 제한 (10초)
- MongoDB Atlas 무료 플랜 용량 제한
- Web Push는 iOS 16.4+ Safari만 지원

## 향후 계획

- [ ] 이미지 업로드 (Cloudinary 연동)
- [ ] 통계 대시보드 (기간별, 언론사별 차트)
- [ ] PDF 내보내기 (월간 홍보 리포트)
- [ ] 참석자 관리 (세미나 참석자 명단 DB)
- [ ] 세미나 리포트 (월별/분기별 생성)
- [ ] 슬랙/이메일 알림 채널 확장
