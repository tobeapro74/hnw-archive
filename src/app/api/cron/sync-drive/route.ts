import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { Seminar, SeminarFile } from "@/lib/seminar-types";
import { listFolderFiles } from "@/lib/google-drive";

// GET /api/cron/sync-drive - 구글드라이브 파일 동기화 (Vercel Cron)
export async function GET(request: NextRequest) {
  // Cron 인증 확인 (Vercel Cron 또는 ADMIN_SECRET_KEY)
  const authHeader = request.headers.get("authorization");
  const cronSecret = request.headers.get("x-vercel-cron");
  const { searchParams } = new URL(request.url);
  const adminKey = searchParams.get("key");

  if (!cronSecret && authHeader !== `Bearer ${process.env.ADMIN_SECRET_KEY}` && adminKey !== process.env.ADMIN_SECRET_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = await getDb();
    const seminarsCollection = db.collection<Seminar>("seminars");
    const filesCollection = db.collection<SeminarFile>("seminar_files");

    // driveFolderId가 있는 세미나만 조회
    const seminars = await seminarsCollection
      .find({ driveFolderId: { $exists: true, $ne: null as unknown as string } })
      .toArray();

    let totalSynced = 0;
    let totalUpdated = 0;
    let totalDeleted = 0;
    const errors: string[] = [];

    for (const seminar of seminars) {
      try {
        const seminarId = seminar._id!.toString();
        const folderId = seminar.driveFolderId!;

        // 드라이브에서 파일 목록 조회
        const driveFiles = await listFolderFiles(folderId);

        // 기존 DB 파일 목록
        const existingFiles = await filesCollection
          .find({ seminarId })
          .toArray();
        const existingMap = new Map(
          existingFiles.map((f) => [f.driveFileId, f])
        );

        const now = new Date();
        const driveFileIds = new Set<string>();

        for (const file of driveFiles) {
          driveFileIds.add(file.driveFileId);
          const existing = existingMap.get(file.driveFileId);

          if (!existing) {
            // 새 파일 추가
            await filesCollection.insertOne({
              seminarId,
              ...file,
              syncedAt: now,
            } as SeminarFile);
            totalSynced++;
          } else if (existing.modifiedTime !== file.modifiedTime) {
            // 수정된 파일 업데이트
            await filesCollection.updateOne(
              { _id: existing._id },
              {
                $set: {
                  name: file.name,
                  mimeType: file.mimeType,
                  size: file.size,
                  modifiedTime: file.modifiedTime,
                  webViewLink: file.webViewLink,
                  webContentLink: file.webContentLink,
                  syncedAt: now,
                },
              }
            );
            totalUpdated++;
          }
        }

        // 드라이브에서 삭제된 파일 제거
        for (const existing of existingFiles) {
          if (!driveFileIds.has(existing.driveFileId)) {
            await filesCollection.deleteOne({ _id: existing._id });
            totalDeleted++;
          }
        }
      } catch (seminarError) {
        const errMsg = `세미나 ${seminar.title}: ${seminarError}`;
        errors.push(errMsg);
        console.error("Sync error:", errMsg);
      }
    }

    return NextResponse.json({
      success: true,
      seminarsProcessed: seminars.length,
      filesAdded: totalSynced,
      filesUpdated: totalUpdated,
      filesDeleted: totalDeleted,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Cron sync-drive error:", error);
    return NextResponse.json(
      { error: "동기화에 실패했습니다." },
      { status: 500 }
    );
  }
}
