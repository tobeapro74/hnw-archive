import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

// POST - 푸시 구독 등록
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subscription, userId } = body;

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json(
        { error: 'Invalid subscription' },
        { status: 400 }
      );
    }

    const db = await getDb();

    // 기존 구독 확인 (endpoint 기준)
    const existingSubscription = await db.collection('push_subscriptions').findOne({
      endpoint: subscription.endpoint,
    });

    if (existingSubscription) {
      // 기존 구독 업데이트
      await db.collection('push_subscriptions').updateOne(
        { endpoint: subscription.endpoint },
        {
          $set: {
            subscription,
            userId: userId || null,
            updatedAt: new Date(),
          },
        }
      );
    } else {
      // 새 구독 등록
      await db.collection('push_subscriptions').insertOne({
        endpoint: subscription.endpoint,
        subscription,
        userId: userId || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to save push subscription:', error);
    return NextResponse.json(
      { error: 'Failed to save subscription' },
      { status: 500 }
    );
  }
}

// DELETE - 푸시 구독 해제
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { endpoint } = body;

    if (!endpoint) {
      return NextResponse.json(
        { error: 'Endpoint is required' },
        { status: 400 }
      );
    }

    const db = await getDb();

    await db.collection('push_subscriptions').deleteOne({
      endpoint,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete push subscription:', error);
    return NextResponse.json(
      { error: 'Failed to delete subscription' },
      { status: 500 }
    );
  }
}

// GET - 구독 상태 확인
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint');

    if (!endpoint) {
      return NextResponse.json(
        { error: 'Endpoint is required' },
        { status: 400 }
      );
    }

    const db = await getDb();

    const subscription = await db.collection('push_subscriptions').findOne({
      endpoint,
    });

    return NextResponse.json({ subscribed: !!subscription });
  } catch (error) {
    console.error('Failed to check subscription:', error);
    return NextResponse.json(
      { error: 'Failed to check subscription' },
      { status: 500 }
    );
  }
}
