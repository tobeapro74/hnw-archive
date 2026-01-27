// 세미나 카테고리
export type SeminarCategory = "패밀리오피스" | "법인";

// 세미나 유형 (정기/비정기)
export type SeminarType = "정기" | "비정기";

// 법인 유형 (법인 세미나의 경우)
export type CorporateType = "상장법인" | "외감법인" | "일반법인" | "지역금융";

// 대상 유형
export type TargetType = "대기업" | "중소기업" | "벤처" | "IPO준비기업";

// 세미나 상태
export type SeminarStatus = "준비중" | "완료" | "취소";

// 비정기 세미나 요청 상태
export type SeminarRequestStatus = "요청접수" | "검토중" | "승인" | "반려" | "완료";

// 비정기 세미나 요청 주제
export type SeminarRequestTopic =
  | "시황"
  | "자금운용"
  | "비즈니스"
  | "IB(자금조달/IPO/지분관리)"
  | "절세"
  | "주주가치 제고"
  | "IR/PR/공시 자문"
  | "가업승계"
  | "기타";

// 체크리스트 단계
export type ChecklistPhase = "사전" | "당일" | "사후";

// 세미나 인터페이스
export interface Seminar {
  _id?: string;
  title: string;                      // 세미나명 (예: "2026 1Q 패밀리오피스 세미나")
  seminarType: SeminarType;           // "정기" | "비정기"
  date: Date | string;                // 세미나 날짜
  location: string;                   // 장소
  category: SeminarCategory;          // "패밀리오피스" | "법인"
  corporateType?: CorporateType;      // "상장법인" | "외감법인" | "일반법인" | "지역금융"
  targetType?: TargetType;            // "대기업" | "중소기업" | "벤처" | "IPO준비기업"
  expectedAttendees?: number;         // 예상 참석자 수
  actualAttendees?: number;           // 실제 참석자 수
  description?: string;
  status: SeminarStatus;
  // 비정기 세미나 요청 연결 (비정기인 경우)
  requestId?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  createdBy?: string;
}

// 비정기 세미나 요청 인터페이스
export interface SeminarRequest {
  _id?: string;
  requestingCenter: string;           // 요청센터
  requestLocation: string;            // 요청장소 (세미나실)
  targetCorporation: string;          // 대상법인
  minAttendees: number;               // 모집인원 최소
  maxAttendees: number;               // 모집인원 최대
  requestedDate: Date | string;       // 요청일자
  topic: SeminarRequestTopic;         // 요청주제
  topicDetail?: string;               // 주제 상세 (기타인 경우)
  receiver: string;                   // 접수자
  status: SeminarRequestStatus;       // 요청 상태
  // 승인 시 연결되는 세미나 ID
  seminarId?: string;
  notes?: string;                     // 비고
  createdAt: Date | string;
  updatedAt: Date | string;
}

// 체크리스트 항목 인터페이스
export interface ChecklistItem {
  _id?: string;
  seminarId: string;                  // 연결된 세미나 ID
  phase: ChecklistPhase;              // 단계
  title: string;                      // 항목명
  description?: string;
  isCompleted: boolean;
  priority: number;                   // 1: 높음, 2: 보통, 3: 낮음
  dueOffset?: number;                 // D-14, D-7, D-1 등 (세미나 날짜 기준, 음수=D-N, 양수=D+N)
  completedAt?: Date | string;
  completedBy?: string;
  order: number;                      // 표시 순서
}

// 체크리스트 템플릿 인터페이스
export interface ChecklistTemplate {
  _id?: string;
  phase: ChecklistPhase;
  title: string;
  description?: string;
  priority: number;
  dueOffset?: number;
  order: number;
  isDefault: boolean;                 // 기본 템플릿 여부
}

// 세미나 + 체크리스트 통합 인터페이스 (상세 조회용)
export interface SeminarWithChecklist extends Seminar {
  checklist: ChecklistItem[];
  progress: {
    total: number;
    completed: number;
    percentage: number;
  };
  phaseProgress: {
    사전: { total: number; completed: number };
    당일: { total: number; completed: number };
    사후: { total: number; completed: number };
  };
}

// 세미나 생성 요청
export interface CreateSeminarRequest {
  title: string;
  seminarType: SeminarType;
  date: string;
  location: string;
  category: SeminarCategory;
  corporateType?: CorporateType;
  targetType?: TargetType;
  expectedAttendees?: number;
  description?: string;
  requestId?: string;                 // 비정기 세미나의 경우 요청 ID
}

// 세미나 수정 요청
export interface UpdateSeminarRequest extends Partial<CreateSeminarRequest> {
  actualAttendees?: number;
  status?: SeminarStatus;
}

// 비정기 세미나 요청 생성
export interface CreateSeminarRequestInput {
  requestingCenter: string;
  requestLocation: string;
  targetCorporation: string;
  minAttendees: number;
  maxAttendees: number;
  requestedDate: string;
  topic: SeminarRequestTopic;
  topicDetail?: string;
  receiver: string;
  notes?: string;
}

// 비정기 세미나 요청 수정
export interface UpdateSeminarRequestInput extends Partial<CreateSeminarRequestInput> {
  status?: SeminarRequestStatus;
  seminarId?: string;
}

// 체크리스트 항목 생성 요청
export interface CreateChecklistItemRequest {
  phase: ChecklistPhase;
  title: string;
  description?: string;
  priority?: number;
  dueOffset?: number;
}

// 체크리스트 항목 수정 요청
export interface UpdateChecklistItemRequest {
  isCompleted?: boolean;
  title?: string;
  description?: string;
  priority?: number;
  dueOffset?: number;
  order?: number;
}

// 색상 상수
export const seminarCategoryColors: Record<SeminarCategory, string> = {
  "패밀리오피스": "purple",
  "법인": "blue",
};

export const seminarCategoryBgColors: Record<SeminarCategory, string> = {
  "패밀리오피스": "bg-purple-500",
  "법인": "bg-blue-500",
};

export const seminarCategoryLightBgColors: Record<SeminarCategory, string> = {
  "패밀리오피스": "bg-purple-50",
  "법인": "bg-blue-50",
};

export const seminarCategoryTextColors: Record<SeminarCategory, string> = {
  "패밀리오피스": "text-purple-600",
  "법인": "text-blue-600",
};

export const checklistPhaseBgColors: Record<ChecklistPhase, string> = {
  "사전": "bg-yellow-500",
  "당일": "bg-orange-500",
  "사후": "bg-green-500",
};

export const checklistPhaseLightBgColors: Record<ChecklistPhase, string> = {
  "사전": "bg-yellow-50",
  "당일": "bg-orange-50",
  "사후": "bg-green-50",
};

export const checklistPhaseTextColors: Record<ChecklistPhase, string> = {
  "사전": "text-yellow-600",
  "당일": "text-orange-600",
  "사후": "text-green-600",
};

export const seminarStatusColors: Record<SeminarStatus, string> = {
  "준비중": "bg-blue-500",
  "완료": "bg-green-500",
  "취소": "bg-slate-400",
};

// 세미나 유형 색상
export const seminarTypeBgColors: Record<SeminarType, string> = {
  "정기": "bg-emerald-500",
  "비정기": "bg-amber-500",
};

export const seminarTypeLightBgColors: Record<SeminarType, string> = {
  "정기": "bg-emerald-50",
  "비정기": "bg-amber-50",
};

export const seminarTypeTextColors: Record<SeminarType, string> = {
  "정기": "text-emerald-600",
  "비정기": "text-amber-600",
};

// 비정기 세미나 요청 상태 색상
export const seminarRequestStatusColors: Record<SeminarRequestStatus, string> = {
  "요청접수": "bg-slate-500",
  "검토중": "bg-blue-500",
  "승인": "bg-green-500",
  "반려": "bg-red-500",
  "완료": "bg-purple-500",
};

// 비정기 세미나 주제 목록
export const seminarRequestTopics: SeminarRequestTopic[] = [
  "시황",
  "자금운용",
  "비즈니스",
  "IB(자금조달/IPO/지분관리)",
  "절세",
  "주주가치 제고",
  "IR/PR/공시 자문",
  "가업승계",
  "기타",
];

// 기본 체크리스트 템플릿 데이터
export const defaultChecklistTemplates: Omit<ChecklistTemplate, "_id">[] = [
  // 사전 (D-14 ~ D-1)
  { phase: "사전", title: "강의자료 초안 작성", priority: 1, dueOffset: -14, order: 1, isDefault: true },
  { phase: "사전", title: "강의자료 내부 검토", priority: 1, dueOffset: -10, order: 2, isDefault: true },
  { phase: "사전", title: "참석자 명단 확정", priority: 1, dueOffset: -7, order: 3, isDefault: true },
  { phase: "사전", title: "강의자료 최종본 확정", priority: 1, dueOffset: -5, order: 4, isDefault: true },
  { phase: "사전", title: "강의자료 제본", priority: 2, dueOffset: -5, order: 5, isDefault: true },
  { phase: "사전", title: "안내 문자/이메일 발송", priority: 1, dueOffset: -3, order: 6, isDefault: true },
  { phase: "사전", title: "현수막/배너 준비", priority: 2, dueOffset: -2, order: 7, isDefault: true },
  { phase: "사전", title: "기념품 준비", priority: 2, dueOffset: -1, order: 8, isDefault: true },
  { phase: "사전", title: "참석 최종 확인", priority: 1, dueOffset: -1, order: 9, isDefault: true },

  // 당일 (D-day)
  { phase: "당일", title: "장소 세팅 확인", priority: 1, dueOffset: 0, order: 1, isDefault: true },
  { phase: "당일", title: "음향/영상 장비 점검", priority: 1, dueOffset: 0, order: 2, isDefault: true },
  { phase: "당일", title: "참석자 등록", priority: 1, dueOffset: 0, order: 3, isDefault: true },
  { phase: "당일", title: "강의 진행", priority: 1, dueOffset: 0, order: 4, isDefault: true },
  { phase: "당일", title: "설문조사 수집", priority: 2, dueOffset: 0, order: 5, isDefault: true },

  // 사후 (D+1 ~ D+7)
  { phase: "사후", title: "참석자 감사 문자 발송", priority: 1, dueOffset: 1, order: 1, isDefault: true },
  { phase: "사후", title: "강의자료 공유", priority: 2, dueOffset: 2, order: 2, isDefault: true },
  { phase: "사후", title: "설문조사 결과 정리", priority: 2, dueOffset: 3, order: 3, isDefault: true },
  { phase: "사후", title: "후속 미팅 스케줄링", priority: 3, dueOffset: 7, order: 4, isDefault: true },
];

// D-day 계산 유틸리티
export function calculateDday(seminarDate: Date | string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDate = new Date(seminarDate);
  targetDate.setHours(0, 0, 0, 0);
  const diffTime = targetDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// D-day 문자열 포맷
export function formatDday(dday: number): string {
  if (dday === 0) return "D-Day";
  if (dday > 0) return `D-${dday}`;
  return `D+${Math.abs(dday)}`;
}

// 체크리스트 항목의 마감일 계산
export function getChecklistDueDate(seminarDate: Date | string, dueOffset: number): Date {
  const date = new Date(seminarDate);
  date.setDate(date.getDate() + dueOffset);
  return date;
}

// 진행률 계산
export function calculateProgress(items: ChecklistItem[]): { total: number; completed: number; percentage: number } {
  const total = items.length;
  const completed = items.filter(item => item.isCompleted).length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { total, completed, percentage };
}

// 단계별 진행률 계산
export function calculatePhaseProgress(items: ChecklistItem[]): Record<ChecklistPhase, { total: number; completed: number }> {
  const phases: ChecklistPhase[] = ["사전", "당일", "사후"];
  const result: Record<ChecklistPhase, { total: number; completed: number }> = {
    "사전": { total: 0, completed: 0 },
    "당일": { total: 0, completed: 0 },
    "사후": { total: 0, completed: 0 },
  };

  items.forEach(item => {
    if (phases.includes(item.phase)) {
      result[item.phase].total += 1;
      if (item.isCompleted) {
        result[item.phase].completed += 1;
      }
    }
  });

  return result;
}
