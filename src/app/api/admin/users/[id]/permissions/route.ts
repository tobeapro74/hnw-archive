import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/mongodb';
import { requireAdmin } from '@/lib/auth';
import { UserPermissions } from '@/lib/types';

// PATCH - 사용자 권한 수정 (관리자만)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 관리자 권한 확인
  const authResult = await requireAdmin(request);
  if (!authResult.authorized) {
    return authResult.response;
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { permissions, is_admin } = body as {
      permissions?: UserPermissions;
      is_admin?: boolean;
    };

    if (permissions === undefined && is_admin === undefined) {
      return NextResponse.json(
        { error: '권한 정보가 필요합니다.' },
        { status: 400 }
      );
    }

    const db = await getDb();

    // 대상 사용자 확인
    const targetUser = await db.collection('users').findOne({
      _id: new ObjectId(id),
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 자기 자신의 관리자 권한은 해제 불가
    if (authResult.user && authResult.user._id === id && is_admin === false) {
      return NextResponse.json(
        { error: '자신의 관리자 권한은 해제할 수 없습니다.' },
        { status: 400 }
      );
    }

    // 업데이트할 필드 구성
    const updateFields: Record<string, unknown> = {
      updated_at: new Date(),
    };

    // is_admin 변경 요청 처리
    if (is_admin !== undefined) {
      updateFields.is_admin = is_admin;
      // 관리자로 승격하면 모든 권한 부여, 해제하면 기본 권한으로
      if (is_admin) {
        updateFields.permissions = {
          articles: { create: true, update: true, delete: true },
          seminars: { create: true, update: true, delete: true },
        };
      } else {
        updateFields.permissions = {
          articles: { create: false, update: false, delete: false },
          seminars: { create: false, update: false, delete: false },
        };
      }
    } else if (permissions && !targetUser.is_admin) {
      // 일반 사용자의 권한 수정
      updateFields.permissions = permissions;
    } else if (permissions && targetUser.is_admin) {
      return NextResponse.json(
        { error: '관리자의 세부 권한은 수정할 수 없습니다. 관리자 해제 후 수정하세요.' },
        { status: 400 }
      );
    }

    // 권한 업데이트
    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: '권한 수정에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: is_admin !== undefined
        ? (is_admin ? '관리자로 승격되었습니다.' : '관리자 권한이 해제되었습니다.')
        : '권한이 수정되었습니다.',
    });
  } catch (error) {
    console.error('Failed to update user permissions:', error);
    return NextResponse.json(
      { error: '권한 수정에 실패했습니다.' },
      { status: 500 }
    );
  }
}
