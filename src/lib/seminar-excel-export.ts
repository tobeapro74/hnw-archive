import * as XLSX from "xlsx";
import { Seminar, SeminarRequest } from "./seminar-types";

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

export function exportSeminarsToExcel(
  seminars: Seminar[],
  requests: SeminarRequest[],
  year: number
) {
  // 정기 + 비정기 데이터를 하나로 합침
  const rows: ExcelRow[] = [
    ...seminars.map(seminarToRow),
    ...requests.map(requestToRow),
  ];

  // 날짜순 정렬
  rows.sort((a, b) => a.날짜.localeCompare(b.날짜));

  // 워크시트 생성
  const ws = XLSX.utils.json_to_sheet(rows);

  // 칼럼 너비 설정
  ws["!cols"] = [
    { wch: 12 }, // 날짜
    { wch: 15 }, // 요청센터
    { wch: 25 }, // 담당자
    { wch: 20 }, // 세미나 장소
    { wch: 14 }, // 수용가능인원
    { wch: 20 }, // 세미나실
    { wch: 14 }, // 주차지원여부
    { wch: 12 }, // 센터담당자
    { wch: 30 }, // 지원내용
  ];

  // 워크북 생성
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "세미나현황");

  // 파일 다운로드
  XLSX.writeFile(wb, `세미나현황_${year}.xlsx`);
}
