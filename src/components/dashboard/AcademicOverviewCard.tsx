import { Award, CircleAlert } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { DashboardAnalytics } from "@/types";

const STANDING: Record<
  DashboardAnalytics["overallAcademicStanding"],
  { label: string; className: string; bar: string }
> = {
  EXCELLENT: { label: "Excellent", className: "bg-leaf/15 text-leaf", bar: "bg-leaf" },
  SATISFACTORY: { label: "Satisfactory", className: "bg-marigold/20 text-deep-navy", bar: "bg-marigold" },
  NEEDS_ATTENTION: { label: "Needs attention", className: "bg-destructive/10 text-destructive", bar: "bg-destructive" },
};

export function AcademicOverviewCard({ analytics }: { analytics: DashboardAnalytics }) {
  const standing = STANDING[analytics.overallAcademicStanding] ?? STANDING.SATISFACTORY;
  const passRate = Math.max(0, Math.min(100, analytics.overallPassPercentage ?? 0));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Academic health</CardTitle>
        <CardDescription>Pass rate and class performance from the latest graded assessments.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5">
        <div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-deep-navy">Overall school pass rate</p>
            <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", standing.className)}>
              {standing.label}
            </span>
          </div>
          <p className="mt-1 font-display text-3xl font-semibold text-deep-navy">{passRate}%</p>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-cloud">
            <div className={cn("h-full rounded-full", standing.bar)} style={{ width: `${passRate}%` }} />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-[10px] border border-cloud bg-leaf/5 p-3">
            <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-leaf">
              <Award className="size-4" strokeWidth={1.75} />
              Top performing class
            </p>
            <p className="mt-1 font-medium text-deep-navy">
              {analytics.topPerformingClass?.className ?? "Not enough data"}
            </p>
            <p className="text-xs text-muted-foreground">
              {analytics.topPerformingClass
                ? `${analytics.topPerformingClass.averageScore}% average`
                : "Grades will appear here after the first term is marked."}
            </p>
          </div>
          <div className="rounded-[10px] border border-cloud bg-destructive/5 p-3">
            <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-destructive">
              <CircleAlert className="size-4" strokeWidth={1.75} />
              Class needing support
            </p>
            <p className="mt-1 font-medium text-deep-navy">
              {analytics.needsAttentionClass?.className ?? "Not enough data"}
            </p>
            <p className="text-xs text-muted-foreground">
              {analytics.needsAttentionClass
                ? `${analytics.needsAttentionClass.averageScore}% average · schedule revision`
                : "Intervention flags appear once class averages are available."}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
