import { toast } from "sonner";

export async function exportSeminarsToExcel(
  year: number,
  seminarType: string,
  category: string
) {
  try {
    const res = await fetch("/api/seminars/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ year, seminarType, category }),
    });

    if (!res.ok) {
      toast.error("엑셀 파일 생성에 실패했습니다.");
      return;
    }

    // 바이너리 응답을 Blob으로 변환 후 다운로드
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `세미나현황_${year}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("엑셀 다운로드 완료");
  } catch {
    toast.error("엑셀 파일 생성에 실패했습니다.");
  }
}
