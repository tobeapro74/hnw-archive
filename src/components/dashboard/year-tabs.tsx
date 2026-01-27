"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface YearTabsProps {
  years: number[];
  selectedYear: number | "all";
  onYearChange: (year: number | "all") => void;
}

export function YearTabs({ years, selectedYear, onYearChange }: YearTabsProps) {
  return (
    <Tabs
      value={selectedYear === "all" ? "all" : selectedYear.toString()}
      onValueChange={(value) =>
        onYearChange(value === "all" ? "all" : parseInt(value))
      }
      className="w-full"
    >
      <TabsList className="w-full grid" style={{ gridTemplateColumns: `repeat(${years.length + 1}, 1fr)` }}>
        {years.map((year) => (
          <TabsTrigger key={year} value={year.toString()} className="text-sm">
            {year}년
          </TabsTrigger>
        ))}
        <TabsTrigger value="all" className="text-sm">
          전체
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
