import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import fs from "fs";
import path from "path";

// GET /api/resources/[id]/download - 파일 다운로드
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const db = await getDb();
    const collection = db.collection("resources");

    const resource = await collection.findOne({ _id: new ObjectId(id) });

    if (!resource) {
      return NextResponse.json(
        { success: false, error: "자료를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // filePath가 있으면 로컬 파일 읽기
    const filePath = resource.filePath;

    if (!filePath) {
      return NextResponse.json(
        { success: false, error: "파일 경로가 없습니다." },
        { status: 404 }
      );
    }

    // 파일 존재 여부 확인
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { success: false, error: "파일이 존재하지 않습니다." },
        { status: 404 }
      );
    }

    // 파일 읽기
    const fileBuffer = fs.readFileSync(filePath);
    const fileName = resource.fileName || path.basename(filePath);

    // Content-Type 설정
    const contentTypeMap: Record<string, string> = {
      pdf: "application/pdf",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ppt: "application/vnd.ms-powerpoint",
      pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      xls: "application/vnd.ms-excel",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    };

    const contentType = contentTypeMap[resource.fileType] || "application/octet-stream";

    // 파일 반환
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
        "Content-Length": fileBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("GET /api/resources/[id]/download error:", error);
    return NextResponse.json(
      { success: false, error: "파일 다운로드에 실패했습니다." },
      { status: 500 }
    );
  }
}
