import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { Seminar, SeminarRequest } from "@/lib/seminar-types";
import * as XLSX from "xlsx";

interface ExcelRow {
  날짜: string;
  요청센터: string;
  담당자: string;
  "세미나 장소": string;
  수용가능인원: string;
  세미나실: string;
  주차지원여부: string;
  센터담당자: string;
  지원내용: string;
}

function formatDate(date: Date | string): string {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function seminarToRow(seminar: Seminar): ExcelRow {
  return {
    날짜: formatDate(seminar.date),
    요청센터: "",
    담당자: seminar.title,
    "세미나 장소": seminar.location,
    수용가능인원: seminar.expectedAttendees?.toString() || "",
    세미나실: "",
    주차지원여부: seminar.parkingSupport ? "O" : "X",
    센터담당자: "",
    지원내용: seminar.description || "",
  };
}

function requestToRow(request: SeminarRequest): ExcelRow {
  return {
    날짜: formatDate(request.requestedDate),
    요청센터: request.requestingCenter,
    담당자: request.receiver,
    "세미나 장소": request.requestLocation,
    수용가능인원: request.maxAttendees?.toString() || "",
    세미나실: request.requestLocation,
    주차지원여부: request.parkingSupport ? "O" : "X",
    센터담당자: request.centerContact || "",
    지원내용: request.topics?.join(", ") || "",
  };
}

// POST /api/seminars/export - 엑셀 파일 다운로드
export async function POST(request: Request) {
  try {
    const { year, seminarType, category } = await request.json();

    if (!year) {
      return NextResponse.json({ error: "연도가 필요합니다." }, { status: 400 });
    }

    const db = await getDb();

    // 세미나 조회
    const seminarFilter: Record<string, unknown> = {};
    const yearNum = parseInt(year);
    seminarFilter.date = { $gte: new Date(yearNum, 0, 1), $lt: new Date(yearNum + 1, 0, 1) };
    if (seminarType && seminarType !== "all") seminarFilter.seminarType = seminarType;
    if (category && category !== "all") seminarFilter.category = category;

    const seminars = await db
      .collection<Seminar>("seminars")
      .find(seminarFilter)
      .sort({ date: 1 })
      .toArray();

    // 비정기 요청 조회 (정기만 선택하거나 카테고리 필터 시 제외)
    let requests: SeminarRequest[] = [];
    if (seminarType !== "정기" && (!category || category === "all")) {
      const requestFilter: Record<string, unknown> = {};
      requestFilter.requestedDate = { $gte: new Date(yearNum, 0, 1), $lt: new Date(yearNum + 1, 0, 1) };

      requests = await db
        .collection<SeminarRequest>("seminar_requests")
        .find(requestFilter)
        .sort({ requestedDate: 1 })
        .toArray();
    }

    // 엑셀 데이터 생성
    const rows: ExcelRow[] = [
      ...seminars.map((s) => seminarToRow(s as unknown as Seminar)),
      ...requests.map((r) => requestToRow(r as unknown as SeminarRequest)),
    ];

    rows.sort((a, b) => a.날짜.localeCompare(b.날짜));

    // 워크시트 생성
    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [
      { wch: 12 }, { wch: 15 }, { wch: 25 }, { wch: 20 },
      { wch: 14 }, { wch: 20 }, { wch: 14 }, { wch: 12 }, { wch: 30 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "세미나현황");

    // 메모리에서 바이너리 생성
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    const fileName = encodeURIComponent(`세미나현황_${year}.xlsx`);

    return new Response(buf, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename*=UTF-8''${fileName}`,
      },
    });
  } catch (error) {
    console.error("POST /api/seminars/export error:", error);
    return NextResponse.json(
      { error: "엑셀 파일 생성에 실패했습니다." },
      { status: 500 }
    );
  }
}
