// 자료실 카테고리
export type ResourceCategory = "회의록" | "보고서" | "기획안";

// 회의록 서브카테고리
export type MeetingSubCategory = "내부회의록" | "외부회의록";

// 지원 파일 형식
export type FileType = "pdf" | "ppt" | "pptx" | "doc" | "docx" | "xls" | "xlsx";

// 자료 타입
export interface Resource {
  _id?: string;
  title: string;
  category: ResourceCategory;
  subCategory?: MeetingSubCategory; // 회의록일 때만 사용
  fileName: string;
  fileUrl: string;
  fileType: FileType;
  fileSize: number; // bytes
  description?: string;
  uploadedAt: Date;
  uploadedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// 자료 생성 요청
export interface CreateResourceRequest {
  title: string;
  category: ResourceCategory;
  subCategory?: MeetingSubCategory;
  fileName: string;
  fileUrl: string;
  fileType: FileType;
  fileSize: number;
  description?: string;
}

// 카테고리 옵션
export const resourceCategories: { id: ResourceCategory; name: string; icon: string }[] = [
  { id: "회의록", name: "회의록", icon: "📝" },
  { id: "보고서", name: "보고서", icon: "📊" },
  { id: "기획안", name: "기획안", icon: "📋" },
];

// 회의록 서브카테고리 옵션
export const meetingSubCategories: { id: MeetingSubCategory; name: string }[] = [
  { id: "내부회의록", name: "내부회의록" },
  { id: "외부회의록", name: "외부회의록" },
];

// 파일 타입별 아이콘/색상
export const fileTypeConfig: Record<FileType, { icon: string; color: string; label: string }> = {
  pdf: { icon: "📕", color: "bg-red-100 text-red-700", label: "PDF" },
  ppt: { icon: "📙", color: "bg-orange-100 text-orange-700", label: "PPT" },
  pptx: { icon: "📙", color: "bg-orange-100 text-orange-700", label: "PPTX" },
  doc: { icon: "📘", color: "bg-blue-100 text-blue-700", label: "DOC" },
  docx: { icon: "📘", color: "bg-blue-100 text-blue-700", label: "DOCX" },
  xls: { icon: "📗", color: "bg-green-100 text-green-700", label: "XLS" },
  xlsx: { icon: "📗", color: "bg-green-100 text-green-700", label: "XLSX" },
};

// 파일 크기 포맷
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// 파일 확장자로 타입 추출
export function getFileType(fileName: string): FileType | null {
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (ext && ["pdf", "ppt", "pptx", "doc", "docx", "xls", "xlsx"].includes(ext)) {
    return ext as FileType;
  }
  return null;
}
