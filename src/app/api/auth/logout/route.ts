import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true, message: "로그아웃 되었습니다." });

  response.cookies.set("auth_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 0,
    path: "/",
  });

  return response;
}
