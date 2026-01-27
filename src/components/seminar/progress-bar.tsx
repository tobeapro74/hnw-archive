"use client";

import { cn } from "@/lib/utils";

interface ProgressBarProps {
  percentage: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  color?: "default" | "success" | "warning" | "danger";
  className?: string;
}

const sizeClasses = {
  sm: "h-1.5",
  md: "h-2",
  lg: "h-3",
};

const colorClasses = {
  default: "bg-primary",
  success: "bg-green-500",
  warning: "bg-yellow-500",
  danger: "bg-red-500",
};

export function ProgressBar({
  percentage,
  size = "md",
  showLabel = false,
  color = "default",
  className,
}: ProgressBarProps) {
  // 퍼센트 값 보정 (0~100)
  const normalizedPct = Math.min(100, Math.max(0, percentage));

  // 색상 자동 결정 (percentage 기반)
  const autoColor =
    normalizedPct >= 80
      ? "success"
      : normalizedPct >= 40
      ? "warning"
      : normalizedPct > 0
      ? "danger"
      : "default";

  const finalColor = color === "default" && normalizedPct > 0 ? autoColor : color;

  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-muted-foreground">진행률</span>
          <span className="text-xs font-medium">{normalizedPct}%</span>
        </div>
      )}
      <div className={cn("w-full bg-muted rounded-full overflow-hidden", sizeClasses[size])}>
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            colorClasses[finalColor]
          )}
          style={{ width: `${normalizedPct}%` }}
        />
      </div>
    </div>
  );
}

// 단계별 진행률 표시 컴포넌트
interface PhaseProgressProps {
  phaseProgress: {
    사전: { total: number; completed: number };
    당일: { total: number; completed: number };
    사후: { total: number; completed: number };
  };
}

export function PhaseProgress({ phaseProgress }: PhaseProgressProps) {
  const phases = [
    { key: "사전" as const, label: "사전", color: "bg-yellow-500" },
    { key: "당일" as const, label: "당일", color: "bg-orange-500" },
    { key: "사후" as const, label: "사후", color: "bg-green-500" },
  ];

  return (
    <div className="flex gap-2">
      {phases.map(({ key, label, color }) => {
        const { total, completed } = phaseProgress[key];
        const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

        return (
          <div key={key} className="flex-1">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] text-muted-foreground">{label}</span>
              <span className="text-[10px] font-medium">
                {completed}/{total}
              </span>
            </div>
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all duration-300", color)}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
