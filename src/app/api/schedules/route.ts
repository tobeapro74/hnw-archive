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

    // 실시간 데이터를 위해 캐싱 비활성화
    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
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

    // 기본 필수 필드 검증
    if (!body.category || !body.date) {
      return NextResponse.json(
        { error: "카테고리와 날짜는 필수 항목입니다." },
        { status: 400 }
      );
    }

    // 카테고리별 필수 필드 검증
    if (body.category === "회의" && !body.meetingTopic) {
      return NextResponse.json(
        { error: "회의주제를 입력해주세요." },
        { status: 400 }
      );
    }
    if (body.category === "외근" && !body.outingTopic) {
      return NextResponse.json(
        { error: "미팅주제를 입력해주세요." },
        { status: 400 }
      );
    }
    if (body.category === "기타" && !body.etcTopic) {
      return NextResponse.json(
        { error: "일정 제목을 입력해주세요." },
        { status: 400 }
      );
    }

    const db = await getDb();
    const collection = db.collection<Schedule>("schedules");

    const now = new Date();
    const newSchedule: Omit<Schedule, "_id"> = {
      category: body.category,
      date: new Date(body.date),
      time: body.time || "하루종일",
      location: body.location || "-",
      meetingType: body.meetingType,
      meetingTopic: body.meetingTopic,
      meetingEtc: body.meetingEtc,
      outingType: body.outingType,
      center: body.center,
      rmName: body.rmName,
      contact: body.contact,
      customerName: body.customerName,
      customerInfo: body.customerInfo,
      outingTopic: body.outingTopic,
      preparationItems: body.preparationItems,
      etcTopic: body.etcTopic,
      etcDescription: body.etcDescription,
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
