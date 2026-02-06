import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { sendPushToMultiple, PushSubscription, NotificationPayload } from '@/lib/web-push';

// KST 현재 시각 계산
function getKSTNow(): Date {
  const now = new Date();
  return new Date(now.getTime() + 9 * 60 * 60 * 1000);
}

export async function GET(request: NextRequest) {
  try {
    // Vercel Cron 인증 확인
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // 주말(토/일) 체크 - KST 기준
    const kstForDay = getKSTNow();
    const dayOfWeek = kstForDay.getUTCDay(); // 0=일, 6=토
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return NextResponse.json({
        success: true,
        message: 'Weekend - skipping reminders',
        sent: 0,
      });
    }

    const db = await getDb();
    const kstNow = getKSTNow();
    const currentMinutes = kstNow.getHours() * 60 + kstNow.getMinutes();

    // KST 기준 오늘 날짜 범위
    const kstDateStr = kstNow.toISOString().split('T')[0];
    const today = new Date(kstDateStr + 'T00:00:00.000Z');
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // 금일 일정 중 시간이 설정된 회의/외근 조회
    const schedules = await db.collection('schedules').find({
      date: { $gte: today, $lt: tomorrow },
      time: { $exists: true, $ne: '' },
      category: { $in: ['회의', '외근'] },
    }).toArray();

    const remindersToSend: { schedule: any; reminderType: string; minutesBefore: number }[] = [];

    for (const schedule of schedules) {
      const timeParts = schedule.time.split(':');
      if (timeParts.length < 2) continue;

      const [hours, minutes] = timeParts.map(Number);
      if (isNaN(hours) || isNaN(minutes)) continue;

      const scheduleMinutes = hours * 60 + minutes;

      if (schedule.category === '회의') {
        // 회의: 20분 전 알림
        const reminderMinutes = scheduleMinutes - 20;
        const diff = currentMinutes - reminderMinutes;

        // 현재 시각이 리마인더 시점 ~ +5분 이내인 경우에만 발송
        if (diff >= 0 && diff < 5) {
          const alreadySent = await db.collection('notification_logs').findOne({
            type: 'meeting_reminder',
            scheduleId: schedule._id.toString(),
            date: { $gte: today, $lt: tomorrow },
          });

          if (!alreadySent) {
            remindersToSend.push({
              schedule,
              reminderType: 'meeting_reminder',
              minutesBefore: 20,
            });
          }
        }
      } else if (schedule.category === '외근') {
        // 외근: 1시간(60분) 전 알림
        const reminderMinutes = scheduleMinutes - 60;
        const diff = currentMinutes - reminderMinutes;

        if (diff >= 0 && diff < 5) {
          const alreadySent = await db.collection('notification_logs').findOne({
            type: 'outing_reminder',
            scheduleId: schedule._id.toString(),
            date: { $gte: today, $lt: tomorrow },
          });

          if (!alreadySent) {
            remindersToSend.push({
              schedule,
              reminderType: 'outing_reminder',
              minutesBefore: 60,
            });
          }
        }
      }
    }

    if (remindersToSend.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No reminders to send',
        sent: 0,
      });
    }

    // 'daily' 알림을 활성화한 구독자 조회
    const subscriptions = await db.collection('push_subscriptions').find({
      $or: [
        { notificationTypes: 'daily' },
        { notificationTypes: { $exists: false } }  // 기존 구독자 포함 (기본값)
      ]
    }).toArray();

    if (subscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No subscribers for daily notifications',
        sent: 0,
      });
    }

    const pushSubscriptions: PushSubscription[] = subscriptions.map(s => s.subscription);
    let totalSent = 0;
    const expiredEndpoints: string[] = [];

    for (const { schedule, reminderType, minutesBefore } of remindersToSend) {
      const payload = createReminderPayload(schedule, reminderType, minutesBefore);
      const result = await sendPushToMultiple(pushSubscriptions, payload);

      totalSent += result.success;
      expiredEndpoints.push(...result.expiredEndpoints);

      // 알림 로그 저장 (중복 발송 방지용)
      await db.collection('notification_logs').insertOne({
        type: reminderType,
        scheduleId: schedule._id.toString(),
        date: today,
        totalSent: result.success,
        createdAt: new Date(),
      });
    }

    // 만료된 구독 삭제
    if (expiredEndpoints.length > 0) {
      const uniqueEndpoints = [...new Set(expiredEndpoints)];
      await db.collection('push_subscriptions').deleteMany({
        endpoint: { $in: uniqueEndpoints },
      });
    }

    return NextResponse.json({
      success: true,
      remindersSent: remindersToSend.length,
      totalSent,
      expiredRemoved: expiredEndpoints.length,
    });
  } catch (error) {
    console.error('Schedule reminder cron failed:', error);
    return NextResponse.json(
      { error: 'Schedule reminder cron failed' },
      { status: 500 }
    );
  }
}

function createReminderPayload(
  schedule: any,
  reminderType: string,
  minutesBefore: number
): NotificationPayload {
  if (reminderType === 'meeting_reminder') {
    const title = schedule.meetingTopic || '회의';
    const location = schedule.location ? `\n📍 ${schedule.location}` : '';

    return {
      title: `💼 회의 ${minutesBefore}분 전`,
      body: `${schedule.time} ${title}${location}`,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: `meeting-reminder-${schedule._id}`,
      url: '/?tab=calendar',
    };
  } else {
    const title = schedule.outingTopic || '외근';
    const location = schedule.location ? `\n📍 ${schedule.location}` : '';
    const customer = schedule.customerName ? `\n👤 ${schedule.customerName}` : '';

    return {
      title: `🚗 외근 ${minutesBefore}분 전`,
      body: `${schedule.time} ${title}${location}${customer}`,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: `outing-reminder-${schedule._id}`,
      url: '/?tab=calendar',
    };
  }
}
