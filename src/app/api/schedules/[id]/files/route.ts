import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ScheduleFile } from "@/lib/schedule-types";

// GET /api/schedules/[id]/files - 일정 자료 목록 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await getDb();
    const files = await db
      .collection<ScheduleFile>("schedule_files")
      .find({ scheduleId: id })
      .sort({ name: 1 })
      .toArray();

    const result = files.map((f) => ({
      ...f,
      _id: f._id!.toString(),
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/schedules/[id]/files error:", error);
    return NextResponse.json(
      { error: "자료 목록을 불러오는데 실패했습니다." },
      { status: 500 }
    );
  }
}
