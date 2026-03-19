import { NextRequest, NextResponse } from "next/server";
import { downloadDriveFile, getDriveFileMetadata } from "@/lib/google-drive";

// GET /api/drive/[fileId] - 구글드라이브 파일 다운로드 프록시
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const { fileId } = await params;

    // 파일 메타데이터 조회
    const metadata = await getDriveFileMetadata(fileId);
    if (!metadata) {
      return NextResponse.json({ error: "파일을 찾을 수 없습니다." }, { status: 404 });
    }

    // 파일 다운로드
    const res = await downloadDriveFile(fileId);
    const chunks: Buffer[] = [];

    await new Promise<void>((resolve, reject) => {
      (res.data as NodeJS.ReadableStream).on("data", (chunk: Buffer) => chunks.push(chunk));
      (res.data as NodeJS.ReadableStream).on("end", resolve);
      (res.data as NodeJS.ReadableStream).on("error", reject);
    });

    const buffer = Buffer.concat(chunks);
    const fileName = encodeURIComponent(metadata.name || "download");

    const mode = request.nextUrl.searchParams.get("mode");
    const isView = mode === "view";
    const mimeType = metadata.mimeType || "application/octet-stream";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": isView ? "inline" : `attachment; filename*=UTF-8''${fileName}`,
        "Content-Length": buffer.length.toString(),
        ...(isView ? { "Cache-Control": "public, max-age=3600" } : {}),
      },
    });
  } catch (error) {
    console.error("Drive download error:", error);
    return NextResponse.json(
      { error: "파일 다운로드에 실패했습니다." },
      { status: 500 }
    );
  }
}
