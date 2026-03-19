import { NextRequest, NextResponse } from "next/server";
import { getDriveFileMetadata } from "@/lib/google-drive";
import { google } from "googleapis";

function getAuthClient() {
  if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY_BASE64) {
    const json = Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_KEY_BASE64, "base64").toString("utf-8");
    return new google.auth.GoogleAuth({
      credentials: JSON.parse(json),
      scopes: ["https://www.googleapis.com/auth/drive.readonly"],
    });
  }
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/drive.readonly"],
  });
}

// GET /api/drive/[fileId] - 구글드라이브 파일 다운로드/보기 프록시 (스트리밍)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const { fileId } = await params;

    const metadata = await getDriveFileMetadata(fileId);
    if (!metadata) {
      return NextResponse.json({ error: "파일을 찾을 수 없습니다." }, { status: 404 });
    }

    const auth = getAuthClient();
    const drive = google.drive({ version: "v3", auth });

    const res = await drive.files.get(
      { fileId, alt: "media" },
      { responseType: "stream" }
    );

    const mode = request.nextUrl.searchParams.get("mode");
    const isView = mode === "view";
    const mimeType = metadata.mimeType || "application/octet-stream";
    const fileName = encodeURIComponent(metadata.name || "download");

    // Node.js ReadableStream → Web ReadableStream 변환
    const nodeStream = res.data as NodeJS.ReadableStream;
    const webStream = new ReadableStream({
      start(controller) {
        nodeStream.on("data", (chunk: Buffer) => controller.enqueue(new Uint8Array(chunk)));
        nodeStream.on("end", () => controller.close());
        nodeStream.on("error", (err) => controller.error(err));
      },
    });

    return new Response(webStream, {
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": isView ? "inline" : `attachment; filename*=UTF-8''${fileName}`,
        ...(metadata.size ? { "Content-Length": metadata.size.toString() } : {}),
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
