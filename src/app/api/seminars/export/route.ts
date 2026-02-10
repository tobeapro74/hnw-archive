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

    // 다운로드 날짜 기준 누적 회수 계산
    const today = formatDate(new Date());
    const regularCount = rows.filter(r => r.구분 === "정기" && r.날짜 <= today).length;
    const irregularCount = rows.filter(r => r.구분 === "비정기" && r.날짜 <= today).length;

    // AOA 구성: 상단 요약 + 빈 행 + 데이터 테이블
    const headers = ["구분", "날짜", "주관", "세미나명", "장소", "인원", "주차", "담당자", "기타(지원 등)"];
    const SUMMARY_ROWS = 4; // 요약 3행 + 빈 행 1행
    const aoa: (string | number)[][] = [
      [`*${yearNum}년 세미나 회수`],
      ["정기", regularCount],
      ["비정기", irregularCount],
      [],
      headers,
      ...rows.map(r => [r.구분, r.날짜, r.주관, r.세미나명, r.장소, r.인원, r.주차, r.담당자, r["기타(지원 등)"]]),
    ];

    const ws = XLSX.utils.aoa_to_sheet(aoa);
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

    // 스타일 정의
    const border = {
      top: { style: "thin", color: { rgb: "000000" } },
      bottom: { style: "thin", color: { rgb: "000000" } },
      left: { style: "thin", color: { rgb: "000000" } },
      right: { style: "thin", color: { rgb: "000000" } },
    };

    // 요약 영역 스타일
    // Row 0: 제목 볼드
    const titleAddr = XLSX.utils.encode_cell({ r: 0, c: 0 });
    if (ws[titleAddr]) ws[titleAddr].s = { font: { bold: true } };

    // Row 1-2: 정기/비정기 요약 (테두리)
    for (let R = 1; R <= 2; R++) {
      for (let C = 0; C <= 1; C++) {
        const addr = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[addr]) ws[addr] = { v: "", t: "s" };
        ws[addr].s = { border };
      }
    }

    // 데이터 테이블 스타일
    const headerRow = SUMMARY_ROWS; // row index 4
    const dataRange = XLSX.utils.decode_range(ws["!ref"] || "A1");

    for (let R = headerRow; R <= dataRange.e.r; R++) {
      for (let C = 0; C <= 8; C++) {
        const addr = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[addr]) ws[addr] = { v: "", t: "s" };
        if (R === headerRow) {
          ws[addr].s = {
            font: { bold: true },
            fill: { fgColor: { rgb: "D9D9D9" } },
            border,
          };
        } else {
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
