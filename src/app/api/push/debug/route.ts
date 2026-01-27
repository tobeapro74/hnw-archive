import { NextResponse } from 'next/server';

// GET - VAPID 공개키 반환 (클라이언트에서 사용)
export async function GET() {
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  if (!vapidPublicKey) {
    return NextResponse.json(
      { error: 'VAPID public key not configured' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    publicKey: vapidPublicKey,
  });
}
