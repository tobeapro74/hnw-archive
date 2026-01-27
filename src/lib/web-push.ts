import * as webpush from 'web-push';

// VAPID 초기화 상태 추적
let vapidInitialized = false;

// VAPID 지연 초기화 (함수 호출 시점에 실행)
function initializeVapid() {
  if (vapidInitialized) return;

  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  const vapidEmail = process.env.VAPID_EMAIL || 'admin@hnw.co.kr';

  if (vapidPublicKey && vapidPrivateKey) {
    webpush.setVapidDetails(
      `mailto:${vapidEmail}`,
      vapidPublicKey,
      vapidPrivateKey
    );
    vapidInitialized = true;
  }
}

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  url?: string;
  requireInteraction?: boolean;
  actions?: { action: string; title: string }[];
}

// 푸시 알림 발송
export async function sendPushNotification(
  subscription: PushSubscription,
  payload: NotificationPayload
): Promise<boolean> {
  // VAPID 초기화 (최초 호출 시)
  initializeVapid();

  try {
    await webpush.sendNotification(
      subscription,
      JSON.stringify(payload)
    );
    return true;
  } catch (error: unknown) {
    console.error('Push notification failed:', error);

    // 구독이 만료된 경우 (410 Gone)
    if (error && typeof error === 'object' && 'statusCode' in error) {
      const statusCode = (error as { statusCode: number }).statusCode;
      if (statusCode === 410 || statusCode === 404) {
        return false; // 구독 삭제 필요
      }
    }
    throw error;
  }
}

// 여러 구독자에게 알림 발송
export async function sendPushToMultiple(
  subscriptions: PushSubscription[],
  payload: NotificationPayload
): Promise<{ success: number; failed: number; expiredEndpoints: string[] }> {
  const results = await Promise.allSettled(
    subscriptions.map(sub => sendPushNotification(sub, payload))
  );

  const expiredEndpoints: string[] = [];
  let success = 0;
  let failed = 0;

  results.forEach((result, index) => {
    if (result.status === 'fulfilled' && result.value) {
      success++;
    } else {
      failed++;
      // 만료된 구독 추적
      if (result.status === 'fulfilled' && !result.value) {
        expiredEndpoints.push(subscriptions[index].endpoint);
      }
    }
  });

  return { success, failed, expiredEndpoints };
}
