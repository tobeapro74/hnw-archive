# HNW 홍보 아카이브 - 트러블슈팅 가이드

## 목차
1. [뉴스 검색 관련](#뉴스-검색-관련)
2. [인증 관련](#인증-관련)
3. [데이터베이스 관련](#데이터베이스-관련)
4. [세미나 관리 관련](#세미나-관리-관련)
5. [파일 뷰어 관련](#파일-뷰어-관련)
6. [모달/팝업 관련](#모달팝업-관련)
7. [푸시 알림 관련](#푸시-알림-관련)
8. [배포 관련](#배포-관련)

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

## 세미나 관리 관련

### 문제: 세미나 생성 시 체크리스트가 자동 생성되지 않음

**증상**: 세미나는 생성되지만 체크리스트가 비어있음

**원인**: API에서 체크리스트 자동 생성 로직 오류

**해결책**:
1. `/api/seminars/route.ts`의 POST 핸들러 확인
2. `defaultChecklistTemplates` 배열 확인 (`/lib/seminar-types.ts`)
3. MongoDB `checklist_items` 컬렉션 권한 확인

```typescript
// 체크리스트 자동 생성 로직
const checklistItems = defaultChecklistTemplates.map((template, index) => ({
  seminarId: insertedId.toString(),
  ...template,
  isCompleted: false,
  createdAt: new Date(),
  updatedAt: new Date(),
}));
await db.collection("checklist_items").insertMany(checklistItems);
```

---

### 문제: 체크리스트 항목 체크가 저장되지 않음

**증상**: 체크박스를 클릭해도 새로고침 시 초기화됨

**원인**: API 호출 실패 또는 상태 업데이트 오류

**해결책**:
1. 브라우저 개발자 도구에서 네트워크 탭 확인
2. `/api/checklist/[itemId]` API 응답 확인
3. MongoDB 업데이트 권한 확인

---

### 문제: 비정기 세미나 요청이 통계에 반영되지 않음

**증상**: 비정기 요청을 등록했지만 통계 카드에 0으로 표시됨

**원인**: `SeminarStats` 컴포넌트에 `requests` prop이 전달되지 않음

**해결책**:
```tsx
// seminar-view.tsx에서 requests 전달 확인
<SeminarStats seminars={filteredSeminars} requests={requests} />
```

---

### 문제: 세미나 날짜가 잘못 표시됨 (하루 차이)

**증상**: 저장한 날짜와 표시되는 날짜가 다름

**원인**: 타임존 처리 문제 (UTC vs 로컬)

**해결책**:
1. 날짜 저장 시 ISO 문자열 사용
2. 표시 시 로컬 타임존으로 변환:
```typescript
const seminarDate = new Date(seminar.date);
seminarDate.toLocaleDateString("ko-KR", {
  year: "numeric",
  month: "long",
  day: "numeric",
});
```

---

### 문제: D-day 계산이 맞지 않음

**증상**: 오늘인데 "1일 후"로 표시됨

**원인**: 시간 단위까지 비교되어 오차 발생

**해결책**: 날짜 비교 시 시간을 0으로 설정
```typescript
// seminar-types.ts의 calculateDday 함수
export function calculateDday(seminarDate: Date | string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);  // 시간 초기화
  const targetDate = new Date(seminarDate);
  targetDate.setHours(0, 0, 0, 0);  // 시간 초기화
  const diffTime = targetDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
```

---

### 문제: 슬라이드 팝업이 닫히지 않음

**증상**: 배경 클릭 시 팝업이 닫히지 않음

**원인**: 이벤트 버블링 또는 클릭 핸들러 누락

**해결책**:
```tsx
// 배경 클릭 시 닫기
<div
  className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
  onClick={() => onOpenChange(false)}
>
  <div
    className="..."
    onClick={(e) => e.stopPropagation()}  // 내부 클릭 시 닫힘 방지
  >
    {/* 콘텐츠 */}
  </div>
</div>
```

---

## 파일 뷰어 관련

### 문제: DOCX 파일 클릭 시 "미리보기가 없음" 메시지 표시

**증상**: DOCX 파일을 클릭해도 뷰어가 열리지 않고 미리보기 없음 메시지가 나옴

**원인**: 기존에 Google Docs Viewer를 사용했으나, Google 서버가 로컬 환경(localhost)에 접근할 수 없어서 작동하지 않음

**해결책**: mammoth.js 라이브러리를 사용하여 클라이언트에서 직접 DOCX를 HTML로 변환

```bash
# mammoth 설치
npm install mammoth
```

```typescript
// resource-viewer.tsx
import mammoth from "mammoth";

// DOCX 파일 로드 및 변환
const loadDocx = useCallback(async () => {
  const response = await fetch(`/api/resources/${resource._id}/download`);
  const arrayBuffer = await response.arrayBuffer();
  const result = await mammoth.convertToHtml({ arrayBuffer });
  setDocxHtml(result.value);
}, [resource?._id]);
```

**장점**:
- 로컬/배포 환경 모두에서 작동
- 외부 서비스(Google) 의존 없음
- 빠른 로딩

---

### 문제: DOCX 내용이 다닥다닥 붙어서 표시됨

**증상**: DOCX 파일 내용이 줄바꿈 없이 붙어서 표시됨

**원인**: Tailwind의 `prose` 클래스가 제대로 작동하지 않음 (Typography 플러그인 미설치)

**해결책**: CSS 선택자를 사용하여 직접 스타일 적용

```tsx
<div
  className="p-4 overflow-y-auto h-full max-w-none text-sm leading-relaxed
    [&_p]:mb-4
    [&_h1]:text-xl [&_h1]:font-bold [&_h1]:mb-4
    [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mb-3
    [&_h3]:font-semibold [&_h3]:mb-2
    [&_ul]:mb-4 [&_ul]:ml-5 [&_ul]:list-disc
    [&_ol]:mb-4 [&_ol]:ml-5 [&_ol]:list-decimal
    [&_li]:mb-1
    [&_table]:w-full [&_table]:border-collapse
    [&_td]:border [&_td]:border-gray-300 [&_td]:p-2"
  dangerouslySetInnerHTML={{ __html: docxHtml }}
/>
```

---

### 문제: PDF 뷰어에서 좌우 스크롤 발생

**증상**: 모바일에서 PDF 내용이 화면보다 넓어서 좌우로 스크롤해야 함

**원인**: 브라우저 내장 PDF 뷰어가 모바일에서 반응형으로 작동하지 않음

**해결책**: Google Docs Viewer 사용

```typescript
// Google Docs Viewer URL 생성
const getGoogleViewerUrl = () => {
  const fullUrl = `${window.location.origin}/api/resources/${resource._id}/view`;
  return `https://docs.google.com/gview?url=${encodeURIComponent(fullUrl)}&embedded=true`;
};
```

**주의사항**: Google Docs Viewer는 외부에서 접근 가능한 URL이 필요하므로 배포 환경에서만 작동

---

### 문제: PDF/Office 파일 로딩이 오래 걸림

**증상**: PDF 뷰어가 계속 "로딩 중..." 상태로 유지됨

**원인**: Google Docs Viewer의 처리 과정:
1. Google 서버가 우리 서버에서 파일 다운로드
2. Google에서 PDF를 처리/렌더링
3. iframe으로 결과 표시

큰 파일(500KB 이상)은 이 과정에 시간이 걸릴 수 있음

**해결책**: 로딩 메시지에 안내 추가

```tsx
{pdfLoading && (
  <div className="flex flex-col items-center gap-3">
    <Loader2 className="w-8 h-8 animate-spin" />
    <span>PDF 로딩 중...</span>
    <span className="text-xs text-muted-foreground/70">
      큰 파일은 로딩에 시간이 걸릴 수 있습니다
    </span>
  </div>
)}
```

---

### 문제: 파일 뷰어 API가 404 오류 반환

**증상**: `/api/resources/[id]/view` 호출 시 404 오류

**원인**: view API 엔드포인트가 없거나 라우트 설정 오류

**해결책**: view API 엔드포인트 생성

```typescript
// /api/resources/[id]/view/route.ts
export async function GET(request, { params }) {
  const { id } = await params;
  const resource = await collection.findOne({ _id: new ObjectId(id) });

  // base64 디코딩
  const fileBuffer = Buffer.from(resource.fileData, "base64");

  return new NextResponse(fileBuffer, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(fileName)}`,
    },
  });
}
```

---

### 현재 파일 뷰어 지원 현황

| 파일 타입 | 뷰어 방식 | 비고 |
|----------|----------|------|
| PDF | Google Docs Viewer | 배포 환경에서만 작동 |
| DOCX | mammoth.js | 클라이언트에서 HTML 변환 |
| DOC, PPT, PPTX, XLS, XLSX | Google Docs Viewer | 배포 환경에서만 작동 |
| 기타 | 미리보기 불가 | 다운로드만 지원 |

---

## 모달/팝업 관련

### 문제: 설정 모달이 열릴 때 빈 프레임이 먼저 보임

**증상**: 설정 모달을 열면 빈 "알림" 섹션이 먼저 표시되고, 잠시 후 전체 UI(푸시 알림, D-day 알림, 금일 일정 알림)가 나타남

**원인**: `NotificationSettings` 컴포넌트가 비동기 초기화(로그인 상태 확인, 구독 상태 확인) 중 `null`을 반환하여 모달 자체는 열리지만 내용이 비어있는 상태로 먼저 렌더링됨

**해결책**: 부모 컴포넌트(`SettingsDialog`)에서 초기화 완료 여부를 추적하고, 초기화 중에는 로딩 스피너를 표시

```tsx
// settings-dialog.tsx
const [isContentReady, setIsContentReady] = useState(false);

const handleInitialized = useCallback(() => {
  setIsContentReady(true);
}, []);

// 모달 콘텐츠
{!isContentReady && (
  <div className="flex items-center justify-center py-12">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
  </div>
)}
<div className={isContentReady ? "block" : "hidden"}>
  <NotificationSettings onInitialized={handleInitialized} />
</div>
```

```tsx
// notification-settings.tsx
interface NotificationSettingsProps {
  onInitialized?: () => void;
}

useEffect(() => {
  const initialize = async () => {
    await Promise.all([checkSupport(), checkLoginStatus()]);
    setIsInitializing(false);
    onInitialized?.();  // 초기화 완료 알림
  };
  initialize();
}, [onInitialized]);
```

**핵심 포인트**:
- 자식 컴포넌트에서 `onInitialized` 콜백으로 초기화 완료를 부모에게 알림
- 부모에서는 `hidden` 클래스로 콘텐츠를 숨기고 로딩 스피너 표시
- 초기화 완료 후 콘텐츠 전체가 한 번에 나타남

---

### 문제: 모달이 열렸을 때 배경이 스크롤됨

**증상**: 모달/팝업이 열린 상태에서 스크롤하면 뒷배경이 같이 움직임

**원인**: `body` 요소의 스크롤이 비활성화되지 않음

**해결책**: 모달이 열릴 때 `body`의 `overflow`를 `hidden`으로 설정

```tsx
// settings-dialog.tsx
useEffect(() => {
  if (isOpen) {
    document.body.style.overflow = "hidden";
  } else {
    document.body.style.overflow = "";
  }
  return () => {
    document.body.style.overflow = "";
  };
}, [isOpen]);

// 백드롭에 터치 이벤트 방지 추가
<div
  className="absolute inset-0 bg-black/50"
  onClick={() => setIsOpen(false)}
  onTouchMove={(e) => e.preventDefault()}
/>
```

---

### 문제: PWA에서 코드 변경이 반영되지 않음

**증상**: 배포 후에도 PWA(홈화면에 추가한 앱)에서 이전 코드가 실행됨

**원인**: Service Worker의 캐시가 갱신되지 않음

**해결책**:
1. Service Worker 버전 업데이트
```javascript
// public/sw.js
const CACHE_NAME = 'hnw-archive-v3';  // 버전 증가
```

2. 네트워크 우선 전략 사용
```javascript
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate' ||
      event.request.destination === 'script' ||
      event.request.destination === 'style') {
    event.respondWith(
      fetch(event.request)
        .then((response) => response)
        .catch(() => caches.match(event.request))
    );
  }
});
```

3. 사용자에게 캐시 클리어 안내
   - Safari: 설정 → Safari → 고급 → 웹 사이트 데이터 → 해당 사이트 삭제
   - PWA 삭제 후 재설치
   - 브라우저에서 직접 접속하여 테스트

---

## 푸시 알림 관련

### 문제: 푸시 알림이 일부 사용자에게만 발송됨 (2026-02-06 해결)

**증상**: 오전 일정 알림(daily-schedule)이나 리마인더(schedule-reminder)가 특정 사용자에게만 발송되고, 나머지 사용자에게는 발송되지 않음. D-day 알림은 정상 발송.

**원인**: `daily-schedule` 및 `schedule-reminder` 크론의 MongoDB 쿼리에 기존 구독자 fallback이 누락됨.

기존 구독자의 `push_subscriptions` 레코드에는 `notificationTypes` 필드가 존재하지 않음. D-day 크론에는 `$exists: false` fallback이 있었지만, daily/reminder 크론에는 없었음.

```typescript
// 버그 코드 (daily-schedule, schedule-reminder)
const subscriptions = await db.collection('push_subscriptions').find({
  notificationTypes: 'daily',  // ❌ $exists: false 누락
}).toArray();

// D-day 크론 (정상 코드)
const subscriptions = await db.collection('push_subscriptions').find({
  $or: [
    { notificationTypes: 'dday' },
    { notificationTypes: { $exists: false } }  // ✅ 기존 구독자 포함
  ]
}).toArray();
```

**해결책**: 3개 크론 모두 동일한 `$or` + `$exists: false` 패턴으로 통일

```typescript
const subscriptions = await db.collection('push_subscriptions').find({
  $or: [
    { notificationTypes: 'daily' },
    { notificationTypes: { $exists: false } }
  ]
}).toArray();
```

**근본적 해결**: 사용자가 설정 화면에서 알림을 껐다 켜면 `notificationTypes: ['dday', 'daily']` 필드가 정상 생성되어 fallback 없이도 쿼리됨.

**교훈**: 새로운 필드를 추가할 때 기존 레코드에 해당 필드가 없는 경우를 반드시 고려해야 함. 모든 관련 쿼리에 `$exists: false` fallback을 통일 적용할 것.

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

### 문제: 빌드 실패 - Export 오류

**증상**: `The export ... was not found in module ...`

**원인**: 컴포넌트 이름 변경 또는 삭제 후 import 미수정

**해결책**:
1. `index.ts` export 목록 확인
2. 해당 컴포넌트를 import하는 모든 파일 수정
3. 삭제된 컴포넌트 import 제거

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

### Q: 세미나 체크리스트 항목을 수정할 수 있나요?

**A**:
- 항목 추가: 각 단계(사전/당일/사후) 하단의 "항목 추가" 사용
- 항목 삭제: 각 항목 오른쪽의 휴지통 아이콘 클릭
- 기본 템플릿 수정: `/lib/seminar-types.ts`의 `defaultChecklistTemplates` 배열 수정

### Q: 비정기 세미나 요청과 정기 세미나의 차이는?

**A**:
- **정기 세미나**: 정해진 일정에 따른 세미나 (패밀리오피스/법인)
  - 체크리스트 관리 가능
  - 진행률 추적
- **비정기 요청**: 센터에서 요청하는 세미나
  - 요청 → 검토 → 승인 → 완료 워크플로우
  - 승인 시 정기 세미나로 전환 가능

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
