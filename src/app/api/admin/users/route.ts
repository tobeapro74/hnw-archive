import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { requireAdmin } from '@/lib/auth';
import { DEFAULT_PERMISSIONS } from '@/lib/types';

// GET - 사용자 목록 조회 (관리자만)
export async function GET(request: NextRequest) {
  // 관리자 권한 확인
  const authResult = await requireAdmin(request);
  if (!authResult.authorized) {
    return authResult.response;
  }

  try {
    const db = await getDb();

    // 모든 사용자 조회 (비밀번호 제외)
    const users = await db
      .collection('users')
      .find({})
      .project({ password: 0 })
      .sort({ created_at: -1 })
      .toArray();

    // permissions가 없는 사용자에게 기본 권한 추가
    const usersWithPermissions = users.map(user => ({
      ...user,
      _id: user._id.toString(),
      permissions: user.permissions ?? DEFAULT_PERMISSIONS,
    }));

    return NextResponse.json({
      success: true,
      data: usersWithPermissions,
    });
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return NextResponse.json(
      { error: '사용자 목록을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}
