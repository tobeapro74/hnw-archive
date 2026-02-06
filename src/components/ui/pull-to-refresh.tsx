"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowDown } from "lucide-react";

const THRESHOLD = 80;
const MAX_PULL = 120;

export function PullToRefresh({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const pulling = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const isAtTop = useCallback(() => {
    return window.scrollY <= 0;
  }, []);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (refreshing) return;
      if (!isAtTop()) return;
      startY.current = e.touches[0].clientY;
      pulling.current = true;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!pulling.current || refreshing) return;
      if (!isAtTop()) {
        pulling.current = false;
        setPullDistance(0);
        return;
      }

      const currentY = e.touches[0].clientY;
      const diff = currentY - startY.current;

      if (diff > 0) {
        // 감속 효과: 많이 당길수록 느려짐
        const distance = Math.min(diff * 0.5, MAX_PULL);
        setPullDistance(distance);
        if (distance > 10) {
          e.preventDefault();
        }
      }
    };

    const handleTouchEnd = () => {
      if (!pulling.current) return;
      pulling.current = false;

      if (pullDistance >= THRESHOLD && !refreshing) {
        setRefreshing(true);
        setPullDistance(THRESHOLD);
        // 새로고침 실행
        router.refresh();
        // 약간의 지연 후 페이지 완전 새로고침
        setTimeout(() => {
          window.location.reload();
        }, 300);
      } else {
        setPullDistance(0);
      }
    };

    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [pullDistance, refreshing, isAtTop, router]);

  const progress = Math.min(pullDistance / THRESHOLD, 1);
  const rotation = progress * 180;

  return (
    <div ref={containerRef}>
      {/* 당기기 인디케이터 */}
      <div
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center overflow-hidden pointer-events-none"
        style={{
          height: pullDistance > 0 || refreshing ? `${Math.max(pullDistance, refreshing ? 56 : 0)}px` : "0px",
          transition: pulling.current ? "none" : "height 0.3s ease-out",
        }}
      >
        <div className="flex flex-col items-center gap-1">
          {refreshing ? (
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          ) : (
            <ArrowDown
              className="h-6 w-6 text-muted-foreground transition-transform"
              style={{
                transform: `rotate(${rotation}deg)`,
                opacity: progress,
              }}
            />
          )}
          <span
            className="text-xs text-muted-foreground"
            style={{ opacity: progress }}
          >
            {refreshing
              ? "새로고침 중..."
              : progress >= 1
                ? "놓으면 새로고침"
                : "당겨서 새로고침"}
          </span>
        </div>
      </div>

      {/* 콘텐츠 영역 */}
      <div
        style={{
          transform: pullDistance > 0 || refreshing ? `translateY(${refreshing ? 56 : pullDistance}px)` : "none",
          transition: pulling.current ? "none" : "transform 0.3s ease-out",
        }}
      >
        {children}
      </div>
    </div>
  );
}
