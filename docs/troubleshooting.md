# HNW 홍보 아카이브 - 트러블슈팅 가이드

## 목차
1. [뉴스 검색 관련](#뉴스-검색-관련)
2. [인증 관련](#인증-관련)
3. [데이터베이스 관련](#데이터베이스-관련)
4. [배포 관련](#배포-관련)

---

## 뉴스 검색 관련

### 문제: Google News RSS에서 특정 언론사 기사가 검색되지 않음

**증상**: 구글 웹 검색에서는 기사가 나오지만 RSS에서는 안 나옴

**원인**: Google News RSS는 모든 언론사를 인덱싱하지 않음. 일부 소규모 언론사는 RSS에 포함되지 않을 수 있음.

**해결책**:
1. 해당 기사는 수동으로 등록
2. 날짜 필터를 더 넓게 설정 (현재 1개월)

---

### 문제: 관련 없는 기사가 검색됨

**증상**: "세미나" 키워드로 검색 시 NH투자증권의 다른 세미나 기사도 나옴

**원인**: 키워드가 너무 일반적 (예: "세미나")

**해결책**:
1. 더 구체적인 키워드 사용 (예: "패밀리오피스 세미나")
2. 현재 구현된 필터링 로직:
   - 핵심키워드 (NH투자증권/NH증권) 필수
   - 기타키워드 중 1개 이상 제목에 포함

```typescript
// 현재 필터링 로직 (admin/page.tsx)
const hasCore = titleLower.includes('nh투자증권') || titleLower.includes('nh증권');
const hasOther = keywordList.some(kw => titleLower.includes(kw));
return hasCore && hasOther;
```

---

### 문제: 오래된 기사가 검색되지 않음

**증상**: 수개월 전 기사가 RSS에서 반환되지 않음

**원인**: Google News RSS는 보통 최근 기사만 반환 (정확한 기간은 Google 정책에 따라 다름)

**해결책**:
1. 오래된 기사는 수동으로 등록
2. 기사 URL을 직접 입력하여 등록

---

### 문제: 더벨(thebell.co.kr) 기사가 검색되지 않음

**증상**: 더벨 기사가 일반 검색에서 누락됨

**원인**: 일부 언론사는 Google News 일반 검색에서 제외될 수 있음

**해결책**: 현재 더벨 전용 검색 쿼리 추가됨

```typescript
// /api/news/search/route.ts
const thebellQuery = `site:thebell.co.kr ("NH투자증권" OR "NH증권") (${keywords})`;
```

---

## 인증 관련

### 문제: 관리자 회원가입 시 "관리자 키가 올바르지 않습니다" 오류

**원인**: 환경 변수 `ADMIN_SECRET_KEY`와 입력한 키가 불일치

**해결책**:
1. 환경 변수 확인: `ADMIN_SECRET_KEY`
2. Vercel 대시보드에서 환경 변수 설정 확인
3. 로컬 개발 시 `.env.local` 파일 확인

---

### 문제: 로그인 후 인증 상태가 유지되지 않음

**원인**: JWT 쿠키 설정 문제 또는 브라우저 쿠키 차단

**해결책**:
1. 쿠키 설정 확인:
```typescript
// /api/auth/login/route.ts
cookies().set('token', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60, // 7일
});
```
2. 브라우저 쿠키 설정 확인
3. 시크릿 모드에서 테스트

---

## 데이터베이스 관련

### 문제: MongoDB 연결 실패

**증상**: "MongoServerError" 또는 연결 타임아웃

**해결책**:
1. `MONGODB_URI` 환경 변수 확인
2. MongoDB Atlas IP 화이트리스트 확인 (0.0.0.0/0 또는 Vercel IP)
3. 데이터베이스 사용자 권한 확인

---

### 문제: 기사 저장 시 중복 오류

**증상**: 같은 기사가 여러 번 저장됨

**해결책**:
- 크롤링 결과에서 중복 제거 로직 확인:
```typescript
// 제목 기준 중복 제거
const uniqueArticles = allArticles.filter((article, index, self) =>
  index === self.findIndex(a => a.title === article.title)
);
```

---

## 배포 관련

### 문제: Vercel 배포 후 API 오류

**증상**: 로컬에서는 작동하지만 배포 후 API 호출 실패

**해결책**:
1. Vercel 환경 변수 설정 확인
2. Vercel 함수 로그 확인: `vercel logs`
3. 빌드 로그에서 오류 확인

---

### 문제: 빌드 실패 - TypeScript 오류

**증상**: `Type error: ...` 빌드 오류

**해결책**:
1. 로컬에서 타입 체크: `npm run build`
2. 누락된 타입 정의 추가
3. `any` 타입 사용 최소화

---

## 자주 묻는 질문 (FAQ)

### Q: 기사 등록 후 자동 크롤링이 작동하지 않아요

**A**:
1. 키워드가 제대로 입력되었는지 확인
2. 발행일이 너무 오래된 날짜가 아닌지 확인
3. 브라우저 개발자 도구 콘솔에서 오류 확인

### Q: 이벤트명은 어떻게 설정하나요?

**A**:
- 기사 등록/수정 시 "연관 이벤트명" 필드에 입력
- 같은 이벤트명을 가진 기사들이 자동으로 그룹화됨
- 예: "넥스트젠 패밀리오피스 세미나 2025.03"

### Q: 검색 결과가 너무 적어요

**A**:
1. 키워드를 더 일반적으로 변경 (예: "패밀리오피스" → "패밀리")
2. 날짜 범위 확인 (현재 발행일 이후 1개월)
3. Google News RSS 한계로 일부 기사가 누락될 수 있음

---

## 로그 확인 방법

### 로컬 개발
```bash
# 서버 로그 확인
npm run dev

# 콘솔에서 검색 쿼리 확인
# "검색 쿼리:", "RSS URL:" 로그 출력
```

### Vercel 배포
```bash
# 실시간 로그
vercel logs --follow

# 특정 배포 로그
vercel logs [deployment-url]
```

---

## 문의

문제가 해결되지 않으면 다음 정보와 함께 문의:
1. 오류 메시지 전문
2. 재현 단계
3. 브라우저/OS 정보
4. 스크린샷 (가능하면)
