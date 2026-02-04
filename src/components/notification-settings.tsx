"use client";

import { useState, useEffect } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface NotificationSettingsProps {
  compact?: boolean;
}

export function NotificationSettings({ compact = false }: NotificationSettingsProps) {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    checkSupport();
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    try {
      const response = await fetch("/api/auth/me");
      const data = await response.json();
      setIsLoggedIn(data.success && data.data);
    } catch (error) {
      console.error("Failed to check login status:", error);
      setIsLoggedIn(false);
    }
  };

  const checkSupport = async () => {
    // 브라우저 지원 확인
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setIsSupported(false);
      setIsLoading(false);
      return;
    }

    setIsSupported(true);
    setPermission(Notification.permission);

    // 기존 Service Worker 등록 확인
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      if (registrations.length > 0) {
        const subscription = await registrations[0].pushManager.getSubscription();
        setIsSubscribed(!!subscription);
      }
    } catch (error) {
      console.error("Failed to check subscription:", error);
    }

    setIsLoading(false);
  };

  const subscribe = async () => {
    if (!isLoggedIn) {
      alert("로그인이 필요한 기능입니다.");
      return;
    }

    setIsLoading(true);

    try {
      // 알림 권한 요청
      const permission = await Notification.requestPermission();
      setPermission(permission);

      if (permission !== "granted") {
        alert("알림 권한이 필요합니다. 브라우저 설정에서 알림을 허용해주세요.");
        setIsLoading(false);
        return;
      }

      // Service Worker 등록
      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      // VAPID 공개키 가져오기 (API에서)
      const keyResponse = await fetch("/api/push/debug");
      const keyData = await keyResponse.json();
      if (!keyData.publicKey) {
        throw new Error("VAPID public key not found");
      }

      // Push 구독
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(keyData.publicKey),
      });

      // 서버에 구독 정보 저장
      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: subscription.toJSON() }),
      });

      if (response.ok) {
        setIsSubscribed(true);
      } else {
        throw new Error("Failed to save subscription");
      }
    } catch (error) {
      console.error("Failed to subscribe:", error);
      alert("알림 등록에 실패했습니다. 다시 시도해주세요.");
    }

    setIsLoading(false);
  };

  const unsubscribe = async () => {
    if (!isLoggedIn) {
      alert("로그인이 필요한 기능입니다.");
      return;
    }

    setIsLoading(true);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // 서버에서 구독 삭제
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });

        // 브라우저에서 구독 해제
        await subscription.unsubscribe();
      }

      setIsSubscribed(false);
    } catch (error) {
      console.error("Failed to unsubscribe:", error);
      alert("알림 해제에 실패했습니다.");
    }

    setIsLoading(false);
  };

  const toggleSubscription = async () => {
    if (isSubscribed) {
      await unsubscribe();
    } else {
      await subscribe();
    }
  };

  // 로그인하지 않은 경우
  if (!isLoggedIn) {
    if (compact) return null;
    return (
      <div className="flex items-center justify-between p-4 bg-card rounded-lg border">
        <div className="flex items-center gap-3">
          <BellOff className="w-5 h-5 text-muted-foreground" />
          <div>
            <div className="font-medium">푸시 알림</div>
            <div className="text-sm text-muted-foreground">
              로그인 후 이용 가능합니다
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 지원하지 않는 브라우저
  if (!isSupported) {
    if (compact) return null;
    return (
      <div className="text-sm text-muted-foreground">
        이 브라우저는 푸시 알림을 지원하지 않습니다.
      </div>
    );
  }

  // 컴팩트 모드 (헤더용)
  if (compact) {
    return (
      <button
        onClick={toggleSubscription}
        disabled={isLoading}
        className="relative p-2 rounded-full hover:bg-white/20 transition-colors disabled:opacity-50"
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin text-white" />
        ) : isSubscribed ? (
          <Bell className="w-5 h-5 text-white" />
        ) : (
          <BellOff className="w-5 h-5 text-white/70" />
        )}
        {isSubscribed && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-yellow-400 rounded-full" />
        )}
      </button>
    );
  }

  // 풀 모드 (설정 페이지용)
  return (
    <div className="flex items-center justify-between p-4 bg-card rounded-lg border">
      <div className="flex items-center gap-3">
        {isSubscribed ? (
          <Bell className="w-5 h-5 text-primary" />
        ) : (
          <BellOff className="w-5 h-5 text-muted-foreground" />
        )}
        <div>
          <div className="font-medium">푸시 알림</div>
          <div className="text-sm text-muted-foreground">
            {isSubscribed
              ? "매일 오전 10시 세미나 D-day 알림을 받습니다"
              : "알림을 켜면 매일 세미나 일정을 받을 수 있습니다"}
          </div>
        </div>
      </div>
      <Switch
        checked={isSubscribed}
        onCheckedChange={toggleSubscription}
        disabled={isLoading}
      />
    </div>
  );
}

// VAPID 공개키를 ArrayBuffer로 변환
function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer;
}
