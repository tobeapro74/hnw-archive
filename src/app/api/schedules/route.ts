import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";
import { Schedule, CreateScheduleRequest } from "@/lib/schedule-types";

// GET /api/schedules - 일정 목록 조회
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year");
    const month = searchParams.get("month");
    const category = searchParams.get("category");

    const db = await getDb();
    const collection = db.collection<Schedule>("schedules");

    // 필터 조건 구성
    const filter: Record<string, unknown> = {};

    if (year) {
      const yearNum = parseInt(year);
      const startDate = new Date(yearNum, 0, 1);
      const endDate = new Date(yearNum + 1, 0, 1);
      filter.date = { $gte: startDate, $lt: endDate };
    }

    if (month && year) {
      const yearNum = parseInt(year);
      const monthNum = parseInt(month) - 1; // 0-indexed
      const startDate = new Date(yearNum, monthNum, 1);
      const endDate = new Date(yearNum, monthNum + 1, 1);
      filter.date = { $gte: startDate, $lt: endDate };
    }

    if (category) {
      filter.category = category;
    }

    const schedules = await collection
      .find(filter)
      .sort({ date: -1 })
      .toArray();

    // _id를 문자열로 변환
    const result = schedules.map(schedule => ({
      ...schedule,
      _id: schedule._id!.toString(),
    }));

    // 캐싱 헤더 추가 (30초간 캐시, 백그라운드에서 갱신)
    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    console.error("GET /api/schedules error:", error);
    return NextResponse.json(
      { error: "일정 목록을 불러오는데 실패했습니다." },
      { status: 500 }
    );
  }
}

// POST /api/schedules - 일정 생성
export async function POST(request: NextRequest) {
  // 로그인 확인
  const user = await getCurrentUser(request);
  if (!user) {
    return NextResponse.json(
      { error: "로그인이 필요합니다." },
      { status: 401 }
    );
  }

  try {
    const body: CreateScheduleRequest = await request.json();

    // 필수 필드 검증
    if (!body.category || !body.date || !body.time || !body.location) {
      return NextResponse.json(
        { error: "필수 필드가 누락되었습니다." },
        { status: 400 }
      );
    }

    const db = await getDb();
    const collection = db.collection<Schedule>("schedules");

    const now = new Date();
    const newSchedule: Omit<Schedule, "_id"> = {
      category: body.category,
      date: new Date(body.date),
      time: body.time,
      location: body.location,
      meetingType: body.meetingType,
      meetingTopic: body.meetingTopic,
      outingType: body.outingType,
      center: body.center,
      rmName: body.rmName,
      contact: body.contact,
      customerName: body.customerName,
      customerInfo: body.customerInfo,
      outingTopic: body.outingTopic,
      preparationItems: body.preparationItems,
      createdAt: now,
      updatedAt: now,
      createdBy: user.name,
    };

    const result = await collection.insertOne(newSchedule as Schedule);

    return NextResponse.json({
      ...newSchedule,
      _id: result.insertedId.toString(),
    });
  } catch (error) {
    console.error("POST /api/schedules error:", error);
    return NextResponse.json(
      { error: "일정 생성에 실패했습니다." },
      { status: 500 }
    );
  }
}
