"use client";

import { Calendar, Clock, MapPin, Users, Briefcase, User } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Schedule } from "@/lib/schedule-types";
import { formatDate } from "@/lib/utils";

interface ScheduleCardProps {
  schedule: Schedule;
  onClick?: () => void;
}

export function ScheduleCard({ schedule, onClick }: ScheduleCardProps) {
  const scheduleDate = new Date(schedule.date);

  return (
    <Card
      className="p-4 hover:bg-muted/50 transition-colors cursor-pointer"
      onClick={onClick}
    >
      <div className="space-y-3">
        {/* 헤더 */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant={schedule.category === "회의" ? "default" : schedule.category === "외근" ? "secondary" : "outline"}>
                {schedule.category === "회의" ? "💼" : schedule.category === "외근" ? "🚗" : "📌"} {schedule.category}
              </Badge>
              {schedule.category === "회의" && schedule.meetingType && (
                <span className="text-sm text-muted-foreground">
                  {schedule.meetingType}
                </span>
              )}
              {schedule.category === "외근" && schedule.outingType && (
                <span className="text-sm text-muted-foreground">
                  {schedule.outingType}
                </span>
              )}
            </div>
            <h3 className="font-semibold text-base">
              {schedule.meetingTopic || schedule.outingTopic || schedule.etcTopic || schedule.etcDescription || "일정"}
            </h3>
          </div>
        </div>

        {/* 일정 정보 */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(scheduleDate)}</span>
            <Clock className="w-4 h-4 ml-2" />
            <span>{schedule.time}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span>{schedule.location}</span>
          </div>

          {/* 외부미팅 기타 정보 */}
          {schedule.category === "회의" && schedule.meetingEtc && (
            <div className="mt-2 p-2 bg-muted rounded text-xs">
              <strong>기타:</strong> {schedule.meetingEtc}
            </div>
          )}

          {/* 외근 정보 */}
          {schedule.category === "외근" && (
            <>
              {schedule.center && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Briefcase className="w-4 h-4" />
                  <span>
                    {schedule.center}
                    {schedule.rmName && ` - ${schedule.rmName}`}
                    {schedule.contact && ` (${schedule.contact})`}
                  </span>
                </div>
              )}
              {schedule.customerName && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>
                    {schedule.customerName}
                    {schedule.customerInfo && ` - ${schedule.customerInfo}`}
                  </span>
                </div>
              )}
              {schedule.preparationItems && (
                <div className="mt-2 p-2 bg-muted rounded text-xs">
                  <strong>준비물:</strong> {schedule.preparationItems}
                </div>
              )}
            </>
          )}

          {/* 기타 정보 */}
          {schedule.category === "기타" && schedule.etcDescription && schedule.etcTopic && (
            <div className="mt-2 p-2 bg-muted rounded text-sm">
              {schedule.etcDescription}
            </div>
          )}
        </div>

        {/* 작성자 */}
        {schedule.createdBy && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground pt-2 border-t">
            <User className="w-3 h-3" />
            <span>{schedule.createdBy}</span>
          </div>
        )}
      </div>
    </Card>
  );
}
