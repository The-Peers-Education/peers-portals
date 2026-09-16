"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Banknote, BookOpen, CalendarCheck, GraduationCap, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { EmptyHint, PageHeader } from "@/components/shared/PageHeader";
import { PageShell } from "@/components/shared/PageShell";
import { StatCard } from "@/components/shared/StatCard";
import { ParentDashboardSkeleton, Skeleton, StatCardSkeleton } from "@/components/shared/Skeleton";
import { FeeStatusBadge, HomeworkStatusBadge, ATTENDANCE_OPTIONS } from "@/components/shared/StatusBadge";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/ui/animations";
import { parentApi, homeworkApi } from "@/lib/api";
import { portalPath } from "@/lib/paths";
import { formatDate, formatMonthYear, formatPkr, getErrorMessage, cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/store";
import type { AttendanceStatus, ParentChild } from "@/types";

export default function ParentDashboardPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const [childId, setChildId] = useState("");
  const [submitOpen, setSubmitOpen] = useState(false);
  const [homeworkId, setHomeworkId] = useState("");
  const [submissionUrl, setSubmissionUrl] = useState("");

  const childrenQuery = useQuery({
    queryKey: ["parent-children"],
    queryFn: parentApi.children,
  });
  const children = childrenQuery.data ?? [];

  useEffect(() => {
    if (!childId && children[0]) setChildId(children[0].id);
  }, [childId, children]);

  const selected: ParentChild | undefined = children.find((child) => child.id === childId) ?? children[0];

  const summaryQuery = useQuery({
    queryKey: ["parent-summary", selected?.id],
    queryFn: () => parentApi.academicSummary(selected!.id),
    enabled: Boolean(selected?.id),
  });
  const summary = summaryQuery.data;

  const submitMutation = useMutation({
    mutationFn: () => homeworkApi.submit(homeworkId, { studentId: selected!.id, submissionUrl }),
    onSuccess: async () => {
      toast.success("Homework submitted");
      setSubmitOpen(false);
      setSubmissionUrl("");
      await queryClient.invalidateQueries({ queryKey: ["parent-summary", selected?.id] });
      await queryClient.invalidateQueries({ queryKey: ["parent-children"] });
    },
    onError: (error) => toast.error(getErrorMessage(error, "Unable to submit homework")),
  });

  const attendanceCounts = useMemo(() => {
    const records = summary?.attendance ?? [];
    return {
      PRESENT: records.filter((row) => row.status === "PRESENT").length,
      LATE: records.filter((row) => row.status === "LATE").length,
      ABSENT: records.filter((row) => row.status === "ABSENT").length,
      LEAVE: records.filter((row) => row.status === "LEAVE").length,
    };
  }, [summary?.attendance]);

  function onSubmitHomework(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    submitMutation.mutate();
  }

  if (childrenQuery.isLoading) {
    return (
      <PageShell>
        <PageHeader title="My children" description="Attendance, fees, and homework for your family." />
        <ParentDashboardSkeleton />
      </PageShell>
    );
  }

  if (!selected) {
    return (
      <EmptyHint
        icon={Users}
        title="No linked students"
        description="Ask the campus office to link your children to this parent account."
      />
    );
  }

  const unpaidFees = (summary?.fees ?? []).filter((fee) => fee.status !== "PAID");

  return (
    <PageShell>
      <FadeIn>
        <PageHeader
          title="Parent dashboard"
          description="Switch between children to review attendance, fees, and homework."
        />
      </FadeIn>

      <div className="flex flex-wrap gap-2">
        {children.map((child) => {
          const active = child.id === selected.id;
          return (
            <button
              key={child.id}
              type="button"
              onClick={() => setChildId(child.id)}
              className={cn(
                "inline-flex h-11 items-center rounded-[10px] px-4 text-[15px]",
                active
                  ? "bg-deep-navy text-white"
                  : "border border-deep-navy/15 bg-white text-deep-navy hover:bg-cloud",
              )}
            >
              {child.fullName}
            </button>
          );
        })}
      </div>

      {selected ? (
        <div>
          <Button variant="outline" asChild>
            <Link href={portalPath(user?.role, `/children/${selected.id}`)}>
              Open {selected.fullName}'s profile
            </Link>
          </Button>
        </div>
      ) : null}

      {summaryQuery.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <StatCardSkeleton key={index} />
          ))}
        </div>
      ) : (
        <StaggerContainer className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StaggerItem>
            <StatCard
              title="Attendance"
              value={selected.attendancePercent === null ? "—" : `${selected.attendancePercent}%`}
              hint={`${selected.classSection} · ${selected.rollNumber}`}
              icon={CalendarCheck}
            />
          </StaggerItem>
          <StaggerItem>
            <StatCard
              title="Fee balance"
              value={formatPkr(selected.unpaidBalance)}
              hint="Outstanding challans for this child"
              icon={Banknote}
            />
          </StaggerItem>
          <StaggerItem>
            <StatCard
              title="Open homework"
              value={String(selected.openHomework)}
              hint="Assignments still waiting for a submission"
              icon={BookOpen}
            />
          </StaggerItem>
          <StaggerItem>
            <StatCard
              title="Latest grade"
              value={selected.recentGrades[0]?.letter ?? "—"}
              hint={selected.recentGrades[0]?.subject ?? "No grades posted yet"}
              icon={GraduationCap}
            />
          </StaggerItem>
        </StaggerContainer>
      )}

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Attendance</CardTitle>
            <CardDescription>Last 30 marked days for {selected.fullName}.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {(Object.keys(attendanceCounts) as AttendanceStatus[]).map((status) => {
              const count = attendanceCounts[status];
              const total = summary?.attendance.length || 1;
              const option = ATTENDANCE_OPTIONS[status];
              return (
                <div key={status} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span>{option.label}</span>
                    <span>{count}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-cloud">
                    <div
                      className={cn("h-full rounded-full bg-deep-navy", status === "LATE" && "bg-marigold")}
                      style={{ width: `${Math.round((count / total) * 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fee shortcuts</CardTitle>
            <CardDescription>Clear outstanding challans at the campus accounts office.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {summaryQuery.isLoading ? (
              <div className="flex flex-col gap-3">
                <Skeleton className="h-14 rounded-[10px]" />
                <Skeleton className="h-14 rounded-[10px]" />
              </div>
            ) : unpaidFees.length === 0 ? (
              <p className="text-sm text-muted-foreground">No unpaid challans for this child.</p>
            ) : (
              unpaidFees.map((fee) => (
                <div
                  key={fee.id}
                  className="flex items-center justify-between gap-3 rounded-[10px] border border-deep-navy/10 bg-white px-3 py-3"
                >
                  <div>
                    <p className="text-[15px] font-medium">{formatMonthYear(fee.month, fee.year)}</p>
                    <p className="text-sm text-muted-foreground">
                      Due {formatPkr(fee.remainingBalance)} of {formatPkr(fee.amount)}
                    </p>
                  </div>
                  <FeeStatusBadge status={fee.status} />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Homework</CardTitle>
          <CardDescription>Submit classwork links before the due date.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {(summary?.homework ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No homework has been assigned to this section yet.</p>
          ) : (
            (summary?.homework ?? []).map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-3 rounded-[10px] border border-deep-navy/10 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.subject} · Due {formatDate(item.dueDate)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {item.submission ? (
                    <HomeworkStatusBadge status={item.submission.status} />
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => {
                        setHomeworkId(item.id);
                        setSubmitOpen(true);
                      }}
                    >
                      Submit
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog open={submitOpen} onOpenChange={setSubmitOpen}>
        <DialogContent>
          <form onSubmit={onSubmitHomework} className="grid gap-4">
            <DialogHeader>
              <DialogTitle>Submit homework</DialogTitle>
              <DialogDescription>Paste a Drive, Classroom, or photo link for {selected.fullName}.</DialogDescription>
            </DialogHeader>
            <Input
              id="homework-url"
              label="Submission link"
              required
              type="url"
              placeholder="https://"
              value={submissionUrl}
              onChange={(event) => setSubmissionUrl(event.target.value)}
            />
            <DialogFooter>
              <Button type="submit" disabled={submitMutation.isPending}>
                {submitMutation.isPending ? "Submitting…" : "Submit link"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
