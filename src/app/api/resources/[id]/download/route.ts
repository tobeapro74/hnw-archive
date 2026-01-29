import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

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

    // MongoDB에 저장된 fileData (base64) 확인
    if (!resource.fileData) {
      return NextResponse.json(
        { success: false, error: "파일 데이터가 없습니다." },
        { status: 404 }
      );
    }

    // base64 디코딩
    const fileBuffer = Buffer.from(resource.fileData, "base64");
    const fileName = resource.fileName || "download";

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

    // PDF는 inline으로 표시, 나머지는 attachment
    const disposition = resource.fileType === "pdf" ? "inline" : "attachment";

    // 파일 반환
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `${disposition}; filename*=UTF-8''${encodeURIComponent(fileName)}`,
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
