"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Banknote,
  Building2,
  CalendarCheck,
  CircleAlert,
  Receipt,
  Users,
  Wallet,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyHint } from "@/components/shared/PageHeader";
import { PageShell } from "@/components/shared/PageShell";
import { StatCardSkeleton } from "@/components/shared/Skeleton";
import { StatCard } from "@/components/shared/StatCard";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/ui/animations";
import {
  AttendanceMeter,
  FeeStatusDonut,
  FinanceTrendChart,
} from "@/components/dashboard/AnalyticsCharts";
import { dashboardApi } from "@/lib/api";
import { canMarkAttendance } from "@/lib/rbac";
import { portalPath } from "@/lib/paths";
import { useAuthStore } from "@/lib/store";
import { displayUserName, formatDate, formatPkr, cn } from "@/lib/utils";

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
    <PageShell>
      <FadeIn>
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-deep-navy">
            Welcome back, {name}
          </h1>
          <p className="text-sm text-muted-foreground">
            {analytics?.campusName ?? "Campus"} overview · enrolment, collections, attendance, and spend.
          </p>
        </div>
      </FadeIn>

      {loading || !analytics ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <StatCardSkeleton key={index} />
          ))}
        </div>
      ) : (
        <>
          <StaggerContainer className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StaggerItem>
              <StatCard
                title="Total students"
                value={String(analytics.studentCount)}
                hint="Active directory for this campus"
                icon={Users}
              />
            </StaggerItem>
            {analytics.canSeeFinance ? (
              <>
                <StaggerItem>
                  <StatCard
                    title="Collected this month"
                    value={formatPkr(analytics.collectedThisMonth)}
                    hint="Fee payments recorded this month"
                    icon={Banknote}
                    trend={{ value: analytics.collectedChangePct }}
                  />
                </StaggerItem>
                <StaggerItem>
                  <StatCard
                    title="Pending fees"
                    value={formatPkr(analytics.pendingFees)}
                    hint="Outstanding and partial challans"
                    icon={CircleAlert}
                  />
                </StaggerItem>
                <StaggerItem>
                  <StatCard
                    title="Expenses this month"
                    value={formatPkr(analytics.expensesThisMonth)}
                    hint="Logged campus spend"
                    icon={Wallet}
                    trend={{ value: analytics.expensesChangePct }}
                  />
                </StaggerItem>
              </>
            ) : (
              <StaggerItem>
                <StatCard
                  title="Present today"
                  value={`${analytics.attendanceOverview.presentPercentage}%`}
                  hint={`${analytics.attendanceOverview.markedCount} students marked`}
                  icon={CalendarCheck}
                />
              </StaggerItem>
            )}
          </StaggerContainer>

          <div className="grid gap-4 xl:grid-cols-3">
            {analytics.canSeeFinance ? (
              <Card className="xl:col-span-2">
                <CardHeader>
                  <CardTitle>Financial trends</CardTitle>
                  <CardDescription>Fee collections vs campus expenses over the last six months.</CardDescription>
                </CardHeader>
                <CardContent>
                  <FinanceTrendChart data={analytics.monthlyRevenueVsExpenses} />
                </CardContent>
              </Card>
            ) : null}
            {analytics.canSeeFinance ? (
              <Card>
                <CardHeader>
                  <CardTitle>Fee collection status</CardTitle>
                  <CardDescription>Paid, partial, and outstanding challans.</CardDescription>
                </CardHeader>
                <CardContent>
                  <FeeStatusDonut breakdown={analytics.feeStatusBreakdown} />
                </CardContent>
              </Card>
            ) : null}
            <Card className={analytics.canSeeFinance ? "xl:col-span-3" : undefined}>
              <CardHeader>
                <CardTitle>Daily attendance</CardTitle>
                <CardDescription>Present, absent, and leave rates for today.</CardDescription>
              </CardHeader>
              <CardContent>
                <AttendanceMeter overview={analytics.attendanceOverview} />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Quick actions</CardTitle>
                <CardDescription>Jump into the most common daily operations.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                {canMarkAttendance(user?.role) ? (
                  <Link href={portalPath(user?.role, "/attendance")} className={cn(buttonVariants())}>
                    <CalendarCheck className="size-5" strokeWidth={1.75} />
                    Mark attendance
                  </Link>
                ) : null}
                {analytics.canSeeFinance ? (
                  <Link href={portalPath(user?.role, "/fees")} className={cn(buttonVariants({ variant: "outline" }))}>
                    <Banknote className="size-5" strokeWidth={1.75} />
                    Issue fee challan
                  </Link>
                ) : null}
                <Link href={portalPath(user?.role, "/students")} className={cn(buttonVariants({ variant: "outline" }))}>
                  <Users className="size-5" strokeWidth={1.75} />
                  Open student directory
                </Link>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Recent activity</CardTitle>
                <CardDescription>Latest payments and expenses for this campus.</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics.recentActivity.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No recent finance activity yet.</p>
                ) : (
                  <ul className="grid gap-3">
                    {analytics.recentActivity.map((item) => (
                      <li key={`${item.type}-${item.id}`} className="flex items-start gap-3">
                        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-marigold/20 text-deep-navy">
                          {item.type === "PAYMENT" ? (
                            <Receipt className="size-5" strokeWidth={1.75} />
                          ) : (
                            <Wallet className="size-5" strokeWidth={1.75} />
                          )}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-[15px] font-medium">{item.message}</span>
                          <span className="text-xs text-muted-foreground">{formatDate(item.createdAt)}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </PageShell>
  );
}
