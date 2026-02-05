"use client";

import { useState, useCallback } from "react";
import { Bell, X, Loader2 } from "lucide-react";
import { NotificationSettings } from "./notification-settings";

export function SettingsDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [isContentReady, setIsContentReady] = useState(false);

  const handleOpen = () => {
    setIsContentReady(false);
    setIsOpen(true);
  };

  const handleInitialized = useCallback(() => {
    setIsContentReady(true);
  }, []);

  return (
    <>
      {/* 설정 버튼 */}
      <button
        onClick={handleOpen}
        className="p-2 rounded-full hover:bg-white/20 transition-colors"
      >
        <Bell className="w-5 h-5 text-white" />
      </button>

      {/* 다이얼로그 */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* 백드롭 */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsOpen(false)}
          />

          {/* 다이얼로그 컨텐츠 */}
          <div className="relative bg-background rounded-lg shadow-lg w-full max-w-md p-6 space-y-6">
            {/* 로딩 중일 때 */}
            {!isContentReady && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            )}

            {/* 콘텐츠 준비 완료 */}
            <div className={isContentReady ? "block" : "hidden"}>
              {/* 헤더 */}
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">설정</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-full hover:bg-muted transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 알림 설정 */}
              <div className="space-y-4 mt-6">
                <h3 className="text-sm font-medium text-muted-foreground">알림</h3>
                <NotificationSettings onInitialized={handleInitialized} />
              </div>

              {/* 앱 정보 */}
              <div className="space-y-2 pt-4 mt-6 border-t">
                <h3 className="text-sm font-medium text-muted-foreground">앱 정보</h3>
                <div className="text-sm">
                  <p>HNW 홍보 아카이브</p>
                  <p className="text-muted-foreground">버전 1.0.0</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
