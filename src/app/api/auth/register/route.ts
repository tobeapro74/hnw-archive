import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/mongodb";
import { User } from "@/lib/types";

const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY || "";

export async function POST(request: NextRequest) {
  try {
    const db = await getDb();
    const { email, password, name, adminKey } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { success: false, error: "모든 필드를 입력해주세요." },
        { status: 400 }
      );
    }

    // 이메일 중복 확인
    const existingUser = await db.collection<User>("users").findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "이미 존재하는 이메일입니다." },
        { status: 400 }
      );
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, 10);

    // 관리자 권한 확인
    const isAdmin = adminKey === ADMIN_SECRET_KEY && ADMIN_SECRET_KEY !== "";

    const user: Omit<User, "_id"> = {
      email,
      password: hashedPassword,
      name,
      is_admin: isAdmin,
      created_at: new Date(),
    };

    const result = await db.collection<User>("users").insertOne(user as User);

    return NextResponse.json({
      success: true,
      data: {
        id: result.insertedId.toString(),
        email,
        name,
        is_admin: isAdmin,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { success: false, error: "회원가입에 실패했습니다." },
      { status: 500 }
    );
  }
}
