import { NextRequest, NextResponse } from "next/server";
import { getDriveFileMetadata } from "@/lib/google-drive";
import { google } from "googleapis";

// Vercel Pro: 최대 실행 시간 60초
export const maxDuration = 60;

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

// GET /api/drive/[fileId] - 구글드라이브 파일 다운로드 프록시
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

    // arraybuffer로 한번에 받기
    const res = await drive.files.get(
      { fileId, alt: "media" },
      { responseType: "arraybuffer" }
    );

    const mimeType = metadata.mimeType || "application/octet-stream";
    const fileName = encodeURIComponent(metadata.name || "download");
    const data = res.data as ArrayBuffer;

    return new Response(data, {
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `attachment; filename*=UTF-8''${fileName}`,
        "Content-Length": data.byteLength.toString(),
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
