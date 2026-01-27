"use client";

import { Home, List, Calendar, Settings, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";

export type TabType = "home" | "list" | "seminar" | "calendar" | "admin";

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  isAdmin?: boolean;
}

export function BottomNav({ activeTab, onTabChange, isAdmin }: BottomNavProps) {
  const tabs = [
    { id: "home" as TabType, icon: Home, label: "홈" },
    { id: "list" as TabType, icon: List, label: "목록" },
    { id: "seminar" as TabType, icon: ClipboardList, label: "세미나" },
    { id: "calendar" as TabType, icon: Calendar, label: "캘린더" },
    ...(isAdmin ? [{ id: "admin" as TabType, icon: Settings, label: "기사관리" }] : []),
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t safe-area-bottom z-40" style={{ backgroundColor: 'var(--background)' }}>
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className={cn("w-5 h-5 mb-1", isActive && "text-primary")} />
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
