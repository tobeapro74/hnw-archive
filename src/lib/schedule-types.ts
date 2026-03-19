// 일정 카테고리
export type ScheduleCategory = "회의" | "외근" | "기타";

// 회의 유형
export type MeetingType = "팀회의" | "외부미팅" | "부서간회의";

// 외근 유형
export type OutingType = "직원미팅" | "고객미팅";

// 일정 인터페이스
export interface Schedule {
  _id?: string;
  category: ScheduleCategory;      // "회의" | "외근"

  // 공통 필드
  date: Date | string;              // 일정 날짜
  time: string;                     // 시간 (예: "14:00")
  location: string;                 // 장소

  // 회의 관련 필드
  meetingType?: MeetingType;        // "팀회의" | "외부미팅" | "부서간회의"
  meetingTopic?: string;            // 회의주제
  meetingEtc?: string;              // 기타 (외부미팅 시 추가 정보)

  // 외근 관련 필드
  outingType?: OutingType;          // "직원미팅" | "고객미팅"
  center?: string;                  // 센터 (외근인 경우)
  rmName?: string;                  // 담당RM (외근인 경우)
  contact?: string;                 // 연락처 (외근인 경우)

  // 고객미팅 전용 필드
  customerName?: string;            // 고객명
  customerInfo?: string;            // 고객 기타정보

  // 외근 공통
  outingTopic?: string;             // 미팅주제 (외근인 경우)
  preparationItems?: string;        // 준비물 (외근인 경우)

  // 기타 관련 필드
  etcTopic?: string;                // 일정 제목 (기타인 경우)
  etcDescription?: string;          // 일정 설명 (기타인 경우)

  // 구글드라이브 폴더 연결
  driveFolderId?: string;

  // 메타데이터
  createdAt: Date | string;
  updatedAt: Date | string;
  createdBy?: string;
}

// 일정 자료 (구글드라이브 동기화)
export interface ScheduleFile {
  _id?: string;
  scheduleId: string;
  driveFileId: string;
  name: string;
  mimeType: string;
  size: number;
  modifiedTime: Date | string;
  webViewLink: string;
  webContentLink: string;
  syncedAt: Date | string;
}

// 일정 생성 요청
export interface CreateScheduleRequest {
  category: ScheduleCategory;
  date: string;
  time: string;
  location: string;

  // 회의
  meetingType?: MeetingType;
  meetingTopic?: string;
  meetingEtc?: string;

  // 외근
  outingType?: OutingType;
  center?: string;
  rmName?: string;
  contact?: string;
  customerName?: string;
  customerInfo?: string;
  outingTopic?: string;
  preparationItems?: string;

  // 기타
  etcTopic?: string;
  etcDescription?: string;
}

// 일정 수정 요청
export interface UpdateScheduleRequest extends Partial<CreateScheduleRequest> {}

// 카테고리 옵션
export const scheduleCategories: { id: ScheduleCategory; name: string; icon: string }[] = [
  { id: "회의", name: "회의", icon: "💼" },
  { id: "외근", name: "외근", icon: "🚗" },
  { id: "기타", name: "기타", icon: "📌" },
];

// 회의 유형 옵션
export const meetingTypes: { id: MeetingType; name: string }[] = [
  { id: "팀회의", name: "팀회의" },
  { id: "외부미팅", name: "외부미팅" },
  { id: "부서간회의", name: "부서간회의" },
];

// 외근 유형 옵션
export const outingTypes: { id: OutingType; name: string }[] = [
  { id: "직원미팅", name: "직원미팅" },
  { id: "고객미팅", name: "고객미팅" },
];
