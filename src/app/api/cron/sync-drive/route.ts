import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { listFolderFiles } from "@/lib/google-drive";
import { Db, Collection } from "mongodb";

// 공통 동기화 함수
async function syncFolder(
  db: Db,
  folderId: string,
  itemId: string,
  idFieldName: string,
  collectionName: string,
) {
  const filesCol = db.collection(collectionName);
  const driveFiles = await listFolderFiles(folderId);

  const existingFiles = await filesCol.find({ [idFieldName]: itemId }).toArray();
  const existingMap = new Map(existingFiles.map((f) => [f.driveFileId as string, f]));

  const now = new Date();
  const driveFileIds = new Set<string>();
  let added = 0, updated = 0, deleted = 0;

  for (const file of driveFiles) {
    driveFileIds.add(file.driveFileId);
    const existing = existingMap.get(file.driveFileId);

    if (!existing) {
      await filesCol.insertOne({ [idFieldName]: itemId, ...file, syncedAt: now });
      added++;
    } else if (existing.modifiedTime !== file.modifiedTime) {
      await filesCol.updateOne(
        { _id: existing._id },
        { $set: { ...file, syncedAt: now } }
      );
      updated++;
    }
  }

  for (const existing of existingFiles) {
    if (!driveFileIds.has(existing.driveFileId as string)) {
      await filesCol.deleteOne({ _id: existing._id });
      deleted++;
    }
  }

  return { added, updated, deleted };
}

// GET /api/cron/sync-drive - 구글드라이브 파일 동기화 (Vercel Cron)
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = request.headers.get("x-vercel-cron");
  const { searchParams } = new URL(request.url);
  const adminKey = searchParams.get("key");

  if (!cronSecret && authHeader !== `Bearer ${process.env.ADMIN_SECRET_KEY}` && adminKey !== process.env.ADMIN_SECRET_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = await getDb();
    const driveFilter = { driveFolderId: { $exists: true, $ne: null } };
    const errors: string[] = [];

    // 세미나 동기화
    const seminars = await db.collection("seminars").find(driveFilter).toArray();
    let seminarAdded = 0, seminarUpdated = 0, seminarDeleted = 0;
    for (const s of seminars) {
      try {
        const r = await syncFolder(db, s.driveFolderId as string, s._id.toString(), "seminarId", "seminar_files");
        seminarAdded += r.added; seminarUpdated += r.updated; seminarDeleted += r.deleted;
      } catch (err) {
        errors.push(`세미나 ${s.title}: ${err}`);
      }
    }

    // 일정 동기화
    const schedules = await db.collection("schedules").find(driveFilter).toArray();
    let scheduleAdded = 0, scheduleUpdated = 0, scheduleDeleted = 0;
    for (const s of schedules) {
      try {
        const r = await syncFolder(db, s.driveFolderId as string, s._id.toString(), "scheduleId", "schedule_files");
        scheduleAdded += r.added; scheduleUpdated += r.updated; scheduleDeleted += r.deleted;
      } catch (err) {
        errors.push(`일정 ${s.meetingTopic || s.outingTopic || s.etcTopic || s.category}: ${err}`);
      }
    }

    return NextResponse.json({
      success: true,
      seminars: { processed: seminars.length, filesAdded: seminarAdded, filesUpdated: seminarUpdated, filesDeleted: seminarDeleted },
      schedules: { processed: schedules.length, filesAdded: scheduleAdded, filesUpdated: scheduleUpdated, filesDeleted: scheduleDeleted },
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Cron sync-drive error:", error);
    return NextResponse.json({ error: "동기화에 실패했습니다." }, { status: 500 });
  }
}
