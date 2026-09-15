"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Banknote,
  Building2,
  CalendarCheck,
  CircleAlert,
  Users,
  Wallet,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyHint, PageHeader } from "@/components/shared/PageHeader";
import { PageShell } from "@/components/shared/PageShell";
import { StatCardSkeleton } from "@/components/shared/Skeleton";
import { StatCard } from "@/components/shared/StatCard";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/ui/animations";
import { expensesApi, feesApi, studentsApi } from "@/lib/api";
import { canManageFees, canMarkAttendance } from "@/lib/rbac";
import { useAuthStore } from "@/lib/store";
import { formatPkr, remainingBalance, toAmount, cn } from "@/lib/utils";

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const branchId = useAuthStore((state) => state.activeBranchId ?? state.user?.branchId);

  const studentsQuery = useQuery({
    queryKey: ["students", branchId],
    queryFn: () => studentsApi.list(),
    enabled: Boolean(branchId),
  });
  const feesQuery = useQuery({
    queryKey: ["fees", branchId],
    queryFn: () => feesApi.list(),
    enabled: Boolean(branchId) && canManageFees(user?.role),
  });
  const expensesQuery = useQuery({
    queryKey: ["expenses", branchId],
    queryFn: expensesApi.list,
    enabled: Boolean(branchId) && canManageFees(user?.role),
  });

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const kpis = useMemo(() => {
    const students = studentsQuery.data ?? [];
    const challans = feesQuery.data ?? [];
    const expenses = expensesQuery.data ?? [];

    const collectedThisMonth = challans
      .filter((item) => item.month === month && item.year === year)
      .reduce((sum, item) => sum + toAmount(item.paidAmount ?? (item.status === "PAID" ? item.amount : 0)), 0);
    const pendingFees = challans
      .filter((item) => item.status === "PENDING" || item.status === "PARTIAL")
      .reduce((sum, item) => sum + remainingBalance(item), 0);
    const totalExpenses = expenses.reduce((sum, item) => sum + toAmount(item.amount), 0);

    return {
      students: students.length,
      collectedThisMonth,
      pendingFees,
      totalExpenses,
    };
  }, [studentsQuery.data, feesQuery.data, expensesQuery.data, month, year]);

  if (!branchId) {
    return (
      <EmptyHint
        icon={Building2}
        title="Select a branch"
        description="Choose an active campus from the header to load analytics."
      />
    );
  }

  const loading = studentsQuery.isLoading || feesQuery.isLoading || expensesQuery.isLoading;

  return (
    <PageShell>
      <FadeIn>
        <PageHeader
          title="Overview"
          description="Live snapshot of enrolment, collections, and branch spend."
        />
      </FadeIn>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <StatCardSkeleton key={index} />
          ))}
        </div>
      ) : (
        <StaggerContainer className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StaggerItem>
            <StatCard
              title="Total Students"
              value={String(kpis.students)}
              hint="Active directory for the selected branch"
              icon={Users}
            />
          </StaggerItem>
          {canManageFees(user?.role) ? (
            <>
              <StaggerItem>
                <StatCard
                  title="Collected Fees"
                  value={formatPkr(kpis.collectedThisMonth)}
                  hint="Paid challans this month"
                  icon={Banknote}
                />
              </StaggerItem>
              <StaggerItem>
                <StatCard
                  title="Pending Fees"
                  value={formatPkr(kpis.pendingFees)}
                  hint="Outstanding and partial challans"
                  icon={CircleAlert}
                />
              </StaggerItem>
              <StaggerItem>
                <StatCard
                  title="Branch Expenses"
                  value={formatPkr(kpis.totalExpenses)}
                  hint="All logged expenses for this branch"
                  icon={Wallet}
                />
              </StaggerItem>
            </>
          ) : null}
        </StaggerContainer>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Quick actions</CardTitle>
          <CardDescription>Jump into the most common daily operations.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {canMarkAttendance(user?.role) ? (
            <Link href="/attendance" className={cn(buttonVariants())}>
              <CalendarCheck className="size-4" strokeWidth={1.75} />
              Mark Attendance
            </Link>
          ) : null}
          {canManageFees(user?.role) ? (
            <Link href="/fees" className={cn(buttonVariants({ variant: "outline" }))}>
              <Banknote className="size-4" strokeWidth={1.75} />
              Issue Fee Challan
            </Link>
          ) : null}
          <Link href="/students" className={cn(buttonVariants({ variant: "outline" }))}>
            <Users className="size-4" strokeWidth={1.75} />
            Open Student Directory
          </Link>
        </CardContent>
      </Card>
    </PageShell>
  );
}
