import { CalendarClock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatDate } from "@/lib/utils";
import type { DashboardAnalytics } from "@/types";

const STATUS: Record<
  DashboardAnalytics["boardMilestones"][number]["status"],
  { label: string; className: string }
> = {
  COMPLETE: { label: "Complete", className: "bg-leaf/15 text-leaf" },
  DUE_SOON: { label: "Due soon", className: "bg-marigold/20 text-deep-navy" },
  UPCOMING: { label: "Upcoming", className: "bg-cloud text-deep-navy" },
};

export function BoardExamTrackerCard({
  milestones,
}: {
  milestones: DashboardAnalytics["boardMilestones"];
}) {
  const next = milestones.find((item) => item.status !== "COMPLETE") ?? milestones[0];
  const countdown = next?.status === "COMPLETE" ? null : next;

  return (
    <Card className="overflow-x-hidden">
      <CardHeader>
        <CardTitle>BISE Lahore board tracker</CardTitle>
        <CardDescription>
          Matric and Intermediate roll slips, practicals, and written paper dates.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {countdown ? (
          <div className="rounded-[10px] bg-deep-navy px-4 py-3 text-white">
            <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-marigold">
              <CalendarClock className="size-4" strokeWidth={1.75} />
              Next milestone
            </p>
            <p className="mt-1 font-display text-lg font-semibold">{countdown.title}</p>
            <p className="text-sm text-white/80">
              {formatDate(countdown.date)} ·{" "}
              {countdown.daysRemaining === 0
                ? "Today"
                : countdown.daysRemaining === 1
                  ? "1 day remaining"
                  : `${countdown.daysRemaining} days remaining`}
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">All listed BISE Lahore milestones are complete.</p>
        )}
        <ul className="grid max-h-[calc(4*3.55rem+3*0.5rem)] gap-2 overflow-y-auto overflow-x-hidden overscroll-contain pr-1">
          {milestones.map((item) => {
            const status = STATUS[item.status];
            return (
              <li
                key={item.id}
                className="flex min-h-[3.55rem] items-start justify-between gap-3 rounded-[10px] border border-cloud px-3 py-2"
              >
                <span className="min-w-0">
                  <span className="block truncate text-[15px] font-medium text-deep-navy">{item.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {item.category === "MATRIC" ? "Matric 9th / 10th" : "Intermediate 11th / 12th"} ·{" "}
                    {formatDate(item.date)}
                  </span>
                </span>
                <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold", status.className)}>
                  {status.label}
                </span>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
