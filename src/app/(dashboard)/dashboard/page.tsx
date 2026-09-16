"use client";

import { useQuery } from "@tanstack/react-query";
import { Building2, CircleAlert } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyHint, PageHeader } from "@/components/shared/PageHeader";
import { PageShell } from "@/components/shared/PageShell";
import { StatCardSkeleton } from "@/components/shared/Skeleton";
import { FadeIn } from "@/components/ui/animations";
import { FeeStatusDonut, FinanceTrendChart } from "@/components/dashboard/AnalyticsCharts";
import { AcademicOverviewCard } from "@/components/dashboard/AcademicOverviewCard";
import { BoardExamTrackerCard } from "@/components/dashboard/BoardExamTrackerCard";
import { dashboardApi } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { cn, displayUserName, formatPkr } from "@/lib/utils";

function KpiChip({
  title,
  value,
  hint,
  badge,
}: {
  title: string;
  value: string;
  hint?: string;
  badge?: { label: string; tone?: "positive" | "caution" };
}) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-2 rounded-[10px] bg-card px-3 py-2 ring-1 ring-foreground/10">
      <div className="min-w-0">
        <p className="truncate text-[11px] font-medium text-muted-foreground">{title}</p>
        <p className="truncate font-display text-lg font-semibold leading-tight text-deep-navy">{value}</p>
        {hint ? <p className="truncate text-[11px] text-muted-foreground">{hint}</p> : null}
      </div>
      {badge ? (
        <span
          className={cn(
            "shrink-0 rounded-full px-1.5 py-0.5 text-[11px] font-semibold",
            badge.tone === "caution" ? "bg-destructive/10 text-destructive" : "bg-leaf/15 text-leaf",
          )}
        >
          {badge.label}
        </span>
      ) : null}
    </div>
  );
}

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const branchId = useAuthStore((state) => state.activeBranchId ?? state.user?.branchId);
  const name = displayUserName(user).split(" ")[0] || "there";

  const analyticsQuery = useQuery({
    queryKey: ["dashboard-analytics", branchId],
    queryFn: dashboardApi.analytics,
    enabled: Boolean(branchId),
  });

  if (!branchId) {
    return (
      <EmptyHint
        icon={Building2}
        title="Select a campus"
        description="Choose an active campus from the header to load analytics."
      />
    );
  }

  const analytics = analyticsQuery.data;
  const loading = analyticsQuery.isLoading;

  if (analyticsQuery.isError) {
    return (
      <EmptyHint
        icon={CircleAlert}
        title="Unable to load analytics"
        description="Refresh the page or choose another campus and try again."
      />
    );
  }

  return (
    <PageShell className="gap-4">
      <FadeIn>
        <PageHeader
          title={`Welcome back, ${name}`}
          description={`${analytics?.campusName ?? "Campus"} overview · enrolment, collections, attendance, and spend.`}
        />
      </FadeIn>

      {loading || !analytics ? (
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <StatCardSkeleton key={index} />
          ))}
        </div>
      ) : (
        <>
          <div className="grid shrink-0 grid-cols-2 gap-2 md:grid-cols-4">
            <KpiChip
              title="Students"
              value={String(analytics.studentCount)}
              hint={`+${analytics.newStudentsThisMonth} this month`}
              badge={{
                label: `${analytics.newStudentsChangePct >= 0 ? "+" : ""}${analytics.newStudentsChangePct}%`,
                tone: analytics.newStudentsChangePct >= 0 ? "positive" : "caution",
              }}
            />
            {analytics.canSeeFinance ? (
              <>
                <KpiChip
                  title="Collected this month"
                  value={formatPkr(analytics.collectedThisMonth)}
                  hint={`vs ${formatPkr(analytics.collectedLastMonth)} last month`}
                  badge={{
                    label: `${analytics.collectedChangePct >= 0 ? "+" : ""}${analytics.collectedChangePct}%`,
                    tone: analytics.collectedChangePct >= 0 ? "positive" : "caution",
                  }}
                />
                <KpiChip
                  title="Pending fees"
                  value={formatPkr(analytics.pendingFees)}
                  hint="Outstanding and partial"
                />
                <KpiChip
                  title="Campus spend"
                  value={formatPkr(analytics.expensesThisMonth)}
                  hint="Logged this month"
                  badge={{
                    label: `${analytics.expensesChangePct >= 0 ? "+" : ""}${analytics.expensesChangePct}%`,
                    tone: "caution",
                  }}
                />
              </>
            ) : (
              <>
                <KpiChip
                  title="Pass rate"
                  value={`${analytics.overallPassPercentage}%`}
                  hint={analytics.overallAcademicStanding.replace("_", " ").toLowerCase()}
                />
                <KpiChip
                  title="Present today"
                  value={`${analytics.attendanceOverview.presentPercentage}%`}
                  hint={`${analytics.attendanceOverview.markedCount} marked`}
                />
                <KpiChip
                  title="New enrolments"
                  value={String(analytics.newStudentsThisMonth)}
                  hint="Registered this month"
                />
              </>
            )}
          </div>

          {analytics.canSeeFinance ? (
            <div className="grid shrink-0 gap-4 md:grid-cols-3">
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Financial trends</CardTitle>
                  <CardDescription>Fee collections vs campus expenses over the last six months.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[280px]">
                    <FinanceTrendChart data={analytics.monthlyRevenueVsExpenses} />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Fee collection status</CardTitle>
                  <CardDescription>Paid, partial, and outstanding challans.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[280px]">
                    <FeeStatusDonut breakdown={analytics.feeStatusBreakdown} />
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <AcademicOverviewCard analytics={analytics} />
            <BoardExamTrackerCard milestones={analytics.boardMilestones} />
          </div>
        </>
      )}
    </PageShell>
  );
}
