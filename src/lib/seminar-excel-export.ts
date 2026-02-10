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

    const data = await res.json();

    if (res.ok) {
      toast.success(`엑셀 저장 완료 (${data.rowCount}건)`, {
        description: data.filePath,
      });
    } else {
      toast.error(data.error || "엑셀 저장에 실패했습니다.");
    }
  } catch {
    toast.error("엑셀 저장에 실패했습니다.");
  }
}
