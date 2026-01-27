import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDb } from './mongodb';
import { User, JWTPayload, UserPermissions, DEFAULT_PERMISSIONS } from './types';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

// 현재 로그인한 사용자 조회
export async function getCurrentUser(request: NextRequest): Promise<User | null> {
  const token = request.cookies.get('auth_token')?.value;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    const db = await getDb();
    const user = await db.collection('users').findOne({ _id: new ObjectId(decoded.userId) });
    return user as User | null;
  } catch {
    return null;
  }
}

// 관리자 여부 확인
export async function isAdmin(request: NextRequest): Promise<boolean> {
  const user = await getCurrentUser(request);
  return user?.is_admin ?? false;
}

// 특정 권한 확인
export function hasPermission(
  user: User | null,
  resource: 'articles' | 'seminars',
  action: 'create' | 'update' | 'delete'
): boolean {
  if (!user) return false;
  if (user.is_admin) return true;

  const permissions = user.permissions ?? DEFAULT_PERMISSIONS;
  return permissions[resource]?.[action] ?? false;
}

// 권한 체크 미들웨어 (API 라우트용)
export async function requirePermission(
  request: NextRequest,
  resource: 'articles' | 'seminars',
  action: 'create' | 'update' | 'delete'
): Promise<{ authorized: boolean; user: User | null; response?: NextResponse }> {
  const user = await getCurrentUser(request);

  if (!user) {
    return {
      authorized: false,
      user: null,
      response: NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      ),
    };
  }

  if (!hasPermission(user, resource, action)) {
    return {
      authorized: false,
      user,
      response: NextResponse.json(
        { error: '권한이 없습니다.' },
        { status: 403 }
      ),
    };
  }

  return { authorized: true, user };
}

// 관리자 권한 체크 미들웨어
export async function requireAdmin(
  request: NextRequest
): Promise<{ authorized: boolean; user: User | null; response?: NextResponse }> {
  const user = await getCurrentUser(request);

  if (!user) {
    return {
      authorized: false,
      user: null,
      response: NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      ),
    };
  }

  if (!user.is_admin) {
    return {
      authorized: false,
      user,
      response: NextResponse.json(
        { error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      ),
    };
  }

  return { authorized: true, user };
}

// 사용자 권한 업데이트
export async function updateUserPermissions(
  userId: string,
  permissions: Partial<UserPermissions>
): Promise<boolean> {
  try {
    const db = await getDb();
    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          permissions,
          updated_at: new Date(),
        },
      }
    );
    return result.modifiedCount > 0;
  } catch (error) {
    console.error('Failed to update user permissions:', error);
    return false;
  }
}
