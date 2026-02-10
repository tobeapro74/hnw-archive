import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { Seminar, SeminarRequest } from "@/lib/seminar-types";
import XLSX from "xlsx-js-style";

interface ExcelRow {
  구분: string;
  날짜: string;
  주관: string;
  세미나명: string;
  장소: string;
  인원: string;
  주차: string;
  담당자: string;
  "기타(지원 등)": string;
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
    구분: "정기",
    날짜: formatDate(seminar.date),
    주관: "",
    세미나명: seminar.title,
    장소: seminar.location,
    인원: seminar.expectedAttendees?.toString() || "",
    주차: seminar.parkingSupport ? "O" : "X",
    담당자: "",
    "기타(지원 등)": seminar.description || "",
  };
}

function requestToRow(request: SeminarRequest): ExcelRow {
  return {
    구분: "비정기",
    날짜: formatDate(request.requestedDate),
    주관: request.requestingCenter,
    세미나명: request.targetCorporation,
    장소: request.requestLocation,
    인원: request.maxAttendees?.toString() || "",
    주차: request.parkingSupport ? "O" : "X",
    담당자: request.receiver,
    "기타(지원 등)": request.topics?.join(", ") || "",
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
      { wch: 8 },  // 구분
      { wch: 12 }, // 날짜
      { wch: 15 }, // 주관
      { wch: 35 }, // 세미나명
      { wch: 20 }, // 장소
      { wch: 8 },  // 인원
      { wch: 6 },  // 주차
      { wch: 12 }, // 담당자
      { wch: 30 }, // 기타(지원 등)
    ];

    // 스타일 적용: 헤더(회색+볼드) + 전체 그리드
    const range = XLSX.utils.decode_range(ws["!ref"] || "A1");
    const border = {
      top: { style: "thin", color: { rgb: "000000" } },
      bottom: { style: "thin", color: { rgb: "000000" } },
      left: { style: "thin", color: { rgb: "000000" } },
      right: { style: "thin", color: { rgb: "000000" } },
    };

    for (let R = range.s.r; R <= range.e.r; R++) {
      for (let C = range.s.c; C <= range.e.c; C++) {
        const addr = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[addr]) ws[addr] = { v: "", t: "s" };
        if (R === 0) {
          // 헤더: 회색 배경 + 볼드
          ws[addr].s = {
            font: { bold: true },
            fill: { fgColor: { rgb: "D9D9D9" } },
            border,
          };
        } else {
          // 데이터: 그리드만
          ws[addr].s = { border };
        }
      }
    }

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
