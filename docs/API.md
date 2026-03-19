# API 명세서

## 인증 API

### POST /api/auth/register
회원가입

**Request Body**
```json
{
  "email": "user@hnw.co.kr",
  "password": "비밀번호",
  "name": "홍길동",
  "adminKey": "hnw-admin-2025"  // 관리자 등록 시 필요
}
```

**Response**
```json
{
  "success": true,
  "data": {
    "email": "user@hnw.co.kr",
    "name": "홍길동",
    "is_admin": true
  }
}
```

---

### POST /api/auth/login
로그인

**Request Body**
```json
{
  "email": "user@hnw.co.kr",
  "password": "비밀번호"
}
```

**Response**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "email": "user@hnw.co.kr",
    "name": "홍길동",
    "is_admin": true,
    "permissions": {
      "articles": { "create": true, "update": true, "delete": true },
      "seminars": { "create": true, "update": true, "delete": true }
    }
  }
}
```

**쿠키**: `auth_token` (JWT, httpOnly, 7일 유효)

---

### POST /api/auth/logout
로그아웃

**Response**
```json
{
  "success": true
}
```

---

### GET /api/auth/me
현재 로그인 사용자 정보

**Response (로그인 상태)**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "email": "user@hnw.co.kr",
    "name": "홍길동",
    "is_admin": true,
    "permissions": { ... }
  }
}
```

**Response (비로그인)**
```json
{
  "success": false,
  "error": "인증이 필요합니다."
}
```

---

## 기사 API

### GET /api/articles
기사 목록 조회 (30초 캐싱)

**Query Parameters**
| 파라미터 | 필수 | 설명 |
|---------|------|------|
| category | X | 카테고리 (인터뷰, 세미나 안내, 소개 및 홍보) |
| tag | X | 태그 (단독기사, 특집기사, 보도기사) |
| keyword | X | 검색어 (제목, 키워드, 언론사) |
| year | X | 연도 |
| month | X | 월 |

**Response**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "title": "기사 제목",
      "keyword": "검색 키워드",
      "publishedAt": "2026-01-28T00:00:00.000Z",
      "category": "인터뷰",
      "tag": "단독기사",
      "thumbnailUrl": "https://...",
      "articleUrl": "https://...",
      "mediaName": "언론사명",
      "eventName": "이벤트명",
      "createdAt": "2026-01-28T00:00:00.000Z"
    }
  ]
}
```

**Cache-Control**: `public, s-maxage=30, stale-while-revalidate=60`

---

### POST /api/articles
기사 등록 (권한 필요: articles.create)

**Request Body**
```json
{
  "title": "기사 제목",
  "keyword": "검색 키워드",
  "publishedAt": "2026-01-28",
  "category": "인터뷰",
  "tag": "단독기사",
  "thumbnailUrl": "https://...",
  "articleUrl": "https://...",
  "mediaName": "언론사명",
  "description": "설명",
  "eventName": "이벤트명"
}
```

**Response**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "title": "기사 제목",
    ...
  }
}
```

---

### GET /api/articles/[id]
기사 상세 조회

**Response**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "title": "기사 제목",
    ...
  }
}
```

---

### PUT /api/articles/[id]
기사 수정 (권한 필요: articles.update)

**Request Body**: POST와 동일

**Response**
```json
{
  "success": true,
  "data": { ... }
}
```

---

### DELETE /api/articles/[id]
기사 삭제 (권한 필요: articles.delete)

**Response**
```json
{
  "success": true
}
```

---

## 세미나 API

### GET /api/seminars
세미나 목록 조회 (30초 캐싱, $lookup 최적화)

**Query Parameters**
| 파라미터 | 필수 | 설명 |
|---------|------|------|
| year | X | 연도 |
| month | X | 월 |
| category | X | 카테고리 (패밀리오피스, 법인) |
| status | X | 상태 (준비중, 완료, 취소) |
| seminarType | X | 유형 (정기, 비정기) |

**Response**
```json
[
  {
    "_id": "...",
    "title": "2026 1Q 패밀리오피스 세미나",
    "seminarType": "정기",
    "date": "2026-02-15T00:00:00.000Z",
    "location": "여의도 본사 세미나실",
    "category": "패밀리오피스",
    "status": "준비중",
    "expectedAttendees": 50,
    "progress": {
      "total": 18,
      "completed": 5,
      "percentage": 28
    }
  }
]
```

**Cache-Control**: `public, s-maxage=30, stale-while-revalidate=60`

---

### POST /api/seminars
세미나 등록 (권한 필요: seminars.create)

기본 체크리스트 18개 항목이 자동 생성됩니다.

**Request Body**
```json
{
  "title": "세미나명",
  "seminarType": "정기",
  "date": "2026-02-15",
  "location": "장소",
  "category": "패밀리오피스",
  "corporateType": "상장법인",
  "targetType": "대기업",
  "expectedAttendees": 50,
  "description": "설명"
}
```

**Response**
```json
{
  "_id": "...",
  "title": "세미나명",
  "progress": { "total": 18, "completed": 0, "percentage": 0 },
  ...
}
```

---

### GET /api/seminars/[id]
세미나 상세 + 체크리스트 조회

**Response**
```json
{
  "_id": "...",
  "title": "세미나명",
  "checklist": [
    {
      "_id": "...",
      "seminarId": "...",
      "phase": "사전",
      "title": "강의자료 초안 작성",
      "isCompleted": false,
      "dueOffset": -14,
      "order": 1
    }
  ],
  "progress": { "total": 18, "completed": 5, "percentage": 28 },
  "phaseProgress": {
    "사전": { "total": 9, "completed": 3 },
    "당일": { "total": 5, "completed": 1 },
    "사후": { "total": 4, "completed": 1 }
  }
}
```

---

### PUT /api/seminars/[id]
세미나 수정 (권한 필요: seminars.update)

**Request Body**: POST와 동일 (+ status 수정 가능)

**Response**
```json
{
  "_id": "...",
  ...
}
```

---

### DELETE /api/seminars/[id]
세미나 삭제 (권한 필요: seminars.delete)

연결된 체크리스트 항목도 함께 삭제됩니다.

**Response**
```json
{
  "success": true
}
```

---

## 세미나 엑셀 내보내기 API (2026-02-10)

### POST /api/seminars/export
세미나 현황 엑셀 파일 다운로드

**Request Body**
```json
{
  "year": 2026,
  "seminarType": "all",
  "category": "all"
}
```

| 파라미터 | 필수 | 설명 |
|---------|------|------|
| year | O | 연도 |
| seminarType | X | 유형 필터 (all, 정기, 비정기) |
| category | X | 카테고리 필터 (all, 패밀리오피스, 법인) |

**Response**
- Content-Type: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- Content-Disposition: `attachment; filename*=UTF-8''세미나현황_2026.xlsx`
- Body: xlsx 바이너리 데이터

**엑셀 칼럼**: 구분, 날짜, 주관, 세미나명, 장소, 인원, 주차, 접수자, 센터 담당자, 기타(지원 등)

**상단 요약**: 다운로드 날짜 기준 정기/비정기 세미나 누적 회수

**스타일**: 헤더 회색 배경(#D9D9D9) + 볼드체, 전체 셀 thin 테두리

---

## 체크리스트 API

### POST /api/seminars/[id]/checklist
체크리스트 항목 추가 (권한 필요: seminars.create)

**Request Body**
```json
{
  "phase": "사전",
  "title": "새 항목"
}
```

**Response**
```json
{
  "_id": "...",
  "seminarId": "...",
  "phase": "사전",
  "title": "새 항목",
  "isCompleted": false
}
```

---

### PATCH /api/checklist/[itemId]
체크리스트 항목 업데이트 (권한 필요: seminars.update)

**Request Body**
```json
{
  "isCompleted": true
}
```
또는
```json
{
  "dueOffset": -7
}
```

**Response**
```json
{
  "success": true
}
```

---

### DELETE /api/checklist/[itemId]
체크리스트 항목 삭제 (권한 필요: seminars.delete)

**Response**
```json
{
  "success": true
}
```

---

## 비정기 세미나 요청 API

### GET /api/seminar-requests
요청 목록 조회

**Query Parameters**
| 파라미터 | 필수 | 설명 |
|---------|------|------|
| year | X | 연도 |

**Response**
```json
[
  {
    "_id": "...",
    "requestingCenter": "강남WM센터",
    "requestLocation": "강남센터 2층 세미나실",
    "targetCorporation": "(주)ABC",
    "minAttendees": 20,
    "maxAttendees": 50,
    "requestedDate": "2026-02-20T00:00:00.000Z",
    "topics": ["상속/증여", "가업승계"],
    "receiver": "홍길동",
    "status": "요청접수",
    "notes": "비고 내용"
  }
]
```

---

### POST /api/seminar-requests
요청 등록 (권한 필요: seminars.create)

**Request Body**
```json
{
  "requestingCenter": "강남WM센터",
  "requestLocation": "강남센터 2층 세미나실",
  "targetCorporation": "(주)ABC",
  "minAttendees": 20,
  "maxAttendees": 50,
  "requestedDate": "2026-02-20",
  "topics": ["상속/증여", "가업승계"],
  "topicDetail": "기타 주제 상세",
  "receiver": "홍길동",
  "centerContact": "센터 담당자",
  "notes": "비고"
}
```

**Response**
```json
{
  "_id": "...",
  "status": "요청접수",
  ...
}
```

---

### PUT /api/seminar-requests/[id]
요청 수정 (권한 필요: seminars.update)

**Request Body**: POST와 동일 (+ status 수정 가능)

**Response**
```json
{
  "_id": "...",
  ...
}
```

---

### DELETE /api/seminar-requests/[id]
요청 삭제 (권한 필요: seminars.delete)

**Response**
```json
{
  "success": true
}
```

---

## 관리자 API

### GET /api/admin/users
사용자 목록 조회 (관리자 전용)

**Response**
```json
{
  "users": [
    {
      "_id": "...",
      "email": "user@hnw.co.kr",
      "name": "홍길동",
      "is_admin": false,
      "permissions": {
        "articles": { "create": false, "update": false, "delete": false },
        "seminars": { "create": false, "update": false, "delete": false }
      }
    }
  ]
}
```

---

### PATCH /api/admin/users/[id]/permissions
사용자 권한 수정 (관리자 전용)

**Request Body**
```json
{
  "is_admin": true,
  "permissions": {
    "articles": { "create": true, "update": true, "delete": false },
    "seminars": { "create": true, "update": true, "delete": true }
  }
}
```

**Response**
```json
{
  "success": true
}
```

---

### GET /api/admin/migrate
MongoDB 인덱스 생성 (성능 최적화)

**Response**
```json
{
  "success": true,
  "message": "모든 인덱스 생성 완료",
  "indexes": {
    "seminars": "date, category+status, seminarType 인덱스 생성 완료",
    "checklist_items": "seminarId 인덱스 생성 완료",
    "articles": "publishedAt, category, tag, eventId 인덱스 생성 완료",
    "seminar_requests": "requestedDate, status 인덱스 생성 완료",
    "events": "date 인덱스 생성 완료"
  }
}
```

---

## 푸시 알림 API

### POST /api/push/subscribe
푸시 구독 등록

**Request Body**
```json
{
  "subscription": {
    "endpoint": "https://fcm.googleapis.com/...",
    "keys": {
      "p256dh": "...",
      "auth": "..."
    }
  }
}
```

**Response**
```json
{
  "success": true,
  "message": "구독 완료"
}
```

---

### POST /api/push/send
푸시 알림 발송

**Request Body**
```json
{
  "title": "알림 제목",
  "body": "알림 내용",
  "url": "/?tab=seminar"
}
```

**Response**
```json
{
  "success": true,
  "sent": 10,
  "failed": 0
}
```

---

### GET /api/push/debug
구독자 수 확인 (디버그)

**Response**
```json
{
  "count": 10
}
```

---

### GET /api/cron/notifications
D-day 알림 크론 (Vercel Cron에서 호출)

매일 오전 10시(KST) 실행, 패밀리오피스/법인 카테고리별 가장 가까운 세미나 알림

**크론 스케줄**: `0 1 * * *` (UTC)

**인증**: `Authorization: Bearer {CRON_SECRET}`

**구독자 조회**: `notificationTypes`에 `'dday'` 포함 또는 필드 없는 기존 구독자

**Response**
```json
{
  "success": true,
  "seminarsNotified": 2,
  "totalSent": 10,
  "expiredRemoved": 0
}
```

---

### GET /api/cron/daily-schedule (신규 2026-02-06)
금일 일정 알림 크론

매일 오전 8시(KST) 실행, 금일 세미나(준비중) + 일정(회의/외근) 합산 알림

**크론 스케줄**: `0 23 * * *` (UTC)

**인증**: `Authorization: Bearer {CRON_SECRET}`

**구독자 조회**: `notificationTypes`에 `'daily'` 포함 또는 필드 없는 기존 구독자

**Response**
```json
{
  "success": true,
  "schedulesCount": 3,
  "totalSent": 10,
  "expiredRemoved": 0
}
```

---

### GET /api/cron/schedule-reminder (신규 2026-02-06)
일정 리마인더 크론

5분마다 실행, 회의 20분 전 / 외근 1시간 전 리마인더 발송

**크론 스케줄**: `*/5 * * * *`

**인증**: `Authorization: Bearer {CRON_SECRET}`

**중복 방지**: `notification_logs`에 당일 발송 이력 확인 후 미발송분만 발송

**구독자 조회**: `notificationTypes`에 `'daily'` 포함 또는 필드 없는 기존 구독자

**Response**
```json
{
  "success": true,
  "remindersSent": 1,
  "totalSent": 10,
  "expiredRemoved": 0
}
```

---

### GET /api/push/settings (신규 2026-02-06)
현재 구독의 알림 설정 조회

**Query Parameters**
| 파라미터 | 필수 | 설명 |
|---------|------|------|
| endpoint | O | 현재 구독의 endpoint URL |

**Response**
```json
{
  "success": true,
  "notificationTypes": ["dday", "daily"]
}
```

---

### PATCH /api/push/settings (신규 2026-02-06)
알림 타입 토글 (활성화/비활성화)

**Request Body**
```json
{
  "endpoint": "https://fcm.googleapis.com/...",
  "type": "daily",
  "enabled": false
}
```

**Response**
```json
{
  "success": true,
  "notificationTypes": ["dday"]
}
```

---

## 자료실 API

### GET /api/resources
자료 목록 조회 (30초 캐싱)

**Query Parameters**
| 파라미터 | 필수 | 설명 |
|---------|------|------|
| category | X | 카테고리 (회의록, 보고서, 기획안) |
| subCategory | X | 서브카테고리 (내부회의록, 외부회의록, 한장요약, 전문, 요약) |
| keyword | X | 검색어 (제목, 파일명) |

**Response**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "title": "2026년 1월 내부회의록",
      "fileName": "내부회의록_0129.pdf",
      "fileType": "pdf",
      "fileSize": 1024000,
      "category": "회의록",
      "subCategory": "내부회의록",
      "uploadedAt": "2026-01-29T00:00:00.000Z"
    }
  ]
}
```

**Cache-Control**: `public, s-maxage=30, stale-while-revalidate=60`

---

### POST /api/resources
자료 등록 (권한 필요: 관리자)

**Request Body**
```json
{
  "title": "자료 제목",
  "fileName": "파일명.pdf",
  "fileType": "pdf",
  "fileSize": 1024000,
  "fileData": "base64 인코딩된 파일 데이터",
  "category": "회의록",
  "subCategory": "내부회의록",
  "content": "문서 내용 (선택)"
}
```

**Response**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "title": "자료 제목",
    ...
  }
}
```

---

### GET /api/resources/[id]
자료 상세 조회

**Response**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "title": "자료 제목",
    "fileName": "파일명.pdf",
    "fileType": "pdf",
    "fileSize": 1024000,
    "fileData": "base64 인코딩된 파일 데이터",
    "category": "회의록",
    "subCategory": "내부회의록",
    "content": "문서 내용",
    "uploadedAt": "2026-01-29T00:00:00.000Z"
  }
}
```

---

### DELETE /api/resources/[id]
자료 삭제 (권한 필요: 관리자)

**Response**
```json
{
  "success": true
}
```

---

### GET /api/resources/[id]/download
파일 다운로드

**Response**
- Content-Type: 파일 MIME 타입
- Content-Disposition: attachment; filename="파일명"
- Body: 바이너리 파일 데이터

또는 inline 모드 (query: ?inline=true):
- Content-Disposition: inline
- PDF 뷰어에서 직접 표시용

---

## 이벤트 API

### GET /api/events
이벤트 목록 조회

**Response**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "name": "이벤트명",
      "date": "2026-01-28T00:00:00.000Z"
    }
  ]
}
```

---

### POST /api/events
이벤트 등록

**Request Body**
```json
{
  "name": "이벤트명",
  "date": "2026-01-28"
}
```

---

## 에러 응답 형식

모든 API는 에러 발생 시 다음 형식으로 응답합니다:

```json
{
  "success": false,
  "error": "에러 메시지"
}
```

또는

```json
{
  "error": "에러 메시지"
}
```

**HTTP 상태 코드**
| 코드 | 설명 |
|------|------|
| 200 | 성공 |
| 400 | 잘못된 요청 (필수 파라미터 누락 등) |
| 401 | 인증 필요 |
| 403 | 권한 없음 |
| 404 | 리소스 없음 |
| 500 | 서버 오류 |

---

## 권한 체계

### 권한 확인 로직
1. JWT 토큰 검증
2. 사용자 조회
3. 권한 확인:
   - `is_admin === true` → 모든 권한 허용
   - `permissions[resource][action] === true` → 해당 권한 허용
   - 그 외 → 403 Forbidden

### 권한 필요 API
| API | 필요 권한 |
|-----|----------|
| POST /api/articles | articles.create |
| PUT /api/articles/[id] | articles.update |
| DELETE /api/articles/[id] | articles.delete |
| POST /api/seminars | seminars.create |
| PUT /api/seminars/[id] | seminars.update |
| DELETE /api/seminars/[id] | seminars.delete |
| POST /api/seminar-requests | seminars.create |
| PUT /api/seminar-requests/[id] | seminars.update |
| DELETE /api/seminar-requests/[id] | seminars.delete |
| 체크리스트 CRUD | seminars.* |
| POST /api/resources | 관리자 |
| DELETE /api/resources/[id] | 관리자 |

---

## 성능 최적화

### 캐싱
- `/api/articles` GET: 30초 CDN 캐시
- `/api/seminars` GET: 30초 CDN 캐시

### 인덱스
`GET /api/admin/migrate` 호출로 생성:
```javascript
seminars: { date: -1 }, { category: 1, status: 1 }, { seminarType: 1 }
checklist_items: { seminarId: 1 }
articles: { publishedAt: -1 }, { category: 1 }, { tag: 1 }, { eventId: 1 }
seminar_requests: { requestedDate: -1 }, { status: 1 }
seminar_files: { seminarId: 1 }
schedule_files: { scheduleId: 1 }
resources: { category: 1, subCategory: 1 }, { uploadedAt: -1 }
```

### N+1 쿼리 해결
`/api/seminars` GET은 $lookup 집계 파이프라인으로 세미나와 체크리스트를 한 번에 조회합니다.

---

## 구글드라이브 연동 API (2026-03-19)

### GET /api/drive/[fileId]
구글드라이브 파일 다운로드 프록시

**Response**
- Content-Type: 파일 MIME 타입
- Content-Disposition: `attachment; filename*=UTF-8''파일명`
- Body: 파일 바이너리 (arraybuffer)

**설정**: `maxDuration: 60` (Vercel Pro)

---

### GET /api/seminars/[id]/files
세미나 자료 목록 조회 (구글드라이브 동기화 데이터)

**Response**
```json
[
  {
    "_id": "...",
    "seminarId": "...",
    "driveFileId": "구글드라이브 파일 ID",
    "name": "파일명.pdf",
    "mimeType": "application/pdf",
    "size": 4609824,
    "modifiedTime": "2026-03-19T...",
    "webViewLink": "https://drive.google.com/...",
    "webContentLink": "https://drive.google.com/...",
    "syncedAt": "2026-03-19T..."
  }
]
```

---

### GET /api/schedules/[id]/files
일정 자료 목록 조회 (구글드라이브 동기화 데이터)

**Response**: 세미나 자료와 동일 구조 (`seminarId` → `scheduleId`)

---

### GET /api/cron/sync-drive
구글드라이브 파일 자동 동기화 (Vercel Cron)

**인증**: `x-vercel-cron` 헤더 또는 `?key=ADMIN_SECRET_KEY`

**실행 주기**: 매일 07:00 KST (UTC 22:00)

**동작**:
1. `driveFolderId`가 있는 세미나/일정 조회
2. 각 폴더의 파일 목록을 드라이브에서 조회
3. 새 파일 추가 / 수정 파일 업데이트 / 삭제 파일 제거
4. 새 파일에 공개 읽기 권한 자동 부여

**Response**
```json
{
  "success": true,
  "seminars": { "processed": 18, "filesAdded": 1, "filesUpdated": 0, "filesDeleted": 0 },
  "schedules": { "processed": 16, "filesAdded": 0, "filesUpdated": 0, "filesDeleted": 0 }
}
```

### 구글드라이브 폴더 구조

```
HNW세미나/ (루트 폴더: 1D2vpCwHBUzItyk5FApzjw9ia499gPNtW)
├── 2026-03-05_N2, Corporate Finance Seminar(지역금융법인)/
├── 2026-03-19_Exclusive F_O Seminar/
├── [회의]2026-03-06_법인 세미나 강의관련(상품기획부)/
├── [외근]2026-02-09_패밀리오피스 컨설팅 (박현철 지원)/
├── [기타]2026-03-23_ATI 유언대용신탁 계약 체결식/
└── ...
```

- **세미나**: `날짜_세미나명` (생성 시 자동)
- **일정**: `[카테고리]날짜_주제` (생성 시 자동)
- **서비스 계정**: `hnw-drive-sync@hnw-archive.iam.gserviceaccount.com`

### 환경변수

| 변수명 | 설명 |
|--------|------|
| GOOGLE_SERVICE_ACCOUNT_KEY_BASE64 | 서비스 계정 JSON 키 (base64 인코딩) |
| GOOGLE_SERVICE_ACCOUNT_EMAIL | 서비스 계정 이메일 (로컬용) |
| GOOGLE_PRIVATE_KEY | 서비스 계정 비공개 키 (로컬용) |
| GOOGLE_DRIVE_ROOT_FOLDER_ID | HNW세미나 루트 폴더 ID |

### DB 컬렉션

| 컬렉션 | 설명 |
|--------|------|
| seminar_files | 세미나 자료 (드라이브 동기화) |
| schedule_files | 일정 자료 (드라이브 동기화) |

### 자료 UX

- **파일명 클릭**: 구글드라이브 뷰어로 미리보기
- **↓ 버튼**: 구글드라이브 앱에서 열기 (저장/공유 가능)
- **새로고침 버튼**: 수동 동기화 실행 후 파일 목록 갱신

---

## 기술 스택

- **프레임워크**: Next.js 16 (App Router)
- **데이터베이스**: MongoDB Atlas
- **인증**: JWT (7일 유효), bcrypt
- **푸시**: Web Push (VAPID)
- **엑셀**: xlsx-js-style (서버 사이드 엑셀 생성 + 스타일링)
- **구글드라이브**: googleapis (서비스 계정 인증, 파일 동기화)
- **배포**: Vercel (Pro 플랜, Cron Jobs)

---

**작성일**: 2026-01-29 (최종 수정: 2026-03-19)
**프로젝트**: HNW 홍보 아카이브
