"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyHint, PageHeader } from "@/components/shared/PageHeader";
import { PageShell } from "@/components/shared/PageShell";
import { AttendanceSkeleton } from "@/components/shared/Skeleton";
import { ATTENDANCE_OPTIONS } from "@/components/shared/StatusBadge";
import { StaggerContainer, StaggerItem } from "@/components/ui/animations";
import { attendanceApi, studentsApi } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { cn, getErrorMessage, todayKey } from "@/lib/utils";
import type { AttendanceStatus } from "@/types";

const STATUSES: AttendanceStatus[] = ["PRESENT", "ABSENT", "LATE", "LEAVE"];

export default function AttendancePage() {
  const queryClient = useQueryClient();
  const branchId = useAuthStore((state) => state.activeBranchId ?? state.user?.branchId);
  const [date, setDate] = useState(todayKey());
  const [classFilter, setClassFilter] = useState("all");
  const [draft, setDraft] = useState<{ date: string; marks: Record<string, AttendanceStatus> }>({
    date,
    marks: {},
  });

  if (draft.date !== date) {
    setDraft({ date, marks: {} });
  }

  const studentsQuery = useQuery({
    queryKey: ["students", branchId],
    queryFn: () => studentsApi.list(),
    enabled: Boolean(branchId),
  });

  const attendanceQuery = useQuery({
    queryKey: ["attendance", branchId, date],
    queryFn: () => attendanceApi.list({ date }),
    enabled: Boolean(branchId && date),
  });

  const savedMarks = useMemo(() => {
    const next: Record<string, AttendanceStatus> = {};
    for (const record of attendanceQuery.data ?? []) {
      next[record.studentId] = record.status;
    }
    return next;
  }, [attendanceQuery.data]);

  const marks = { ...savedMarks, ...draft.marks };

  const classSections = useMemo(() => {
    const values = new Set((studentsQuery.data ?? []).map((student) => student.classSection));
    return Array.from(values).sort();
  }, [studentsQuery.data]);

  const visibleStudents = useMemo(() => {
    return (studentsQuery.data ?? []).filter(
      (student) =>
        student.status === "ACTIVE" &&
        (classFilter === "all" || student.classSection === classFilter),
    );
  }, [studentsQuery.data, classFilter]);

  const markMutation = useMutation({
    mutationFn: attendanceApi.mark,
    onSuccess: async () => {
      toast.success("Attendance saved");
      setDraft({ date, marks: {} });
      await queryClient.invalidateQueries({ queryKey: ["attendance", branchId, date] });
    },
    onError: (error) => toast.error(getErrorMessage(error, "Unable to save attendance")),
  });

  function submit() {
    const records = visibleStudents
      .filter((student) => marks[student.id])
      .map((student) => ({ studentId: student.id, status: marks[student.id] }));

    if (records.length === 0) {
      toast.error("Mark at least one student before submitting");
      return;
    }

    markMutation.mutate({ date, records });
  }

  if (!branchId) {
    return (
      <EmptyHint
        icon={Building2}
        title="Select a branch"
        description="Choose a campus before marking attendance."
      />
    );
  }

  const loading = studentsQuery.isLoading || attendanceQuery.isLoading;

  return (
    <PageShell>
      <PageHeader
        title="Attendance"
        description="Mark daily attendance by class, then submit the full grid in one batch."
        action={
          <Button onClick={submit} disabled={markMutation.isPending || visibleStudents.length === 0}>
            {markMutation.isPending ? "Saving…" : "Submit attendance"}
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Input
          id="attendance-date"
          type="date"
          label="Date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
        />
        <div className="grid gap-1.5">
          <Label>Class / Section</Label>
          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger className="w-full bg-background" aria-label="Filter attendance by class">
              <SelectValue placeholder="All classes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All classes</SelectItem>
              {classSections.map((section) => (
                <SelectItem key={section} value={section}>
                  {section}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <AttendanceSkeleton />
      ) : (
        <div className="overflow-hidden rounded-[10px] border border-cloud bg-card">
          {visibleStudents.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">
              No active students found for this filter.
            </p>
          ) : (
            <StaggerContainer className="divide-y">
              {visibleStudents.map((student) => (
                <StaggerItem key={student.id}>
                  <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium">{student.fullName}</p>
                      <p className="text-xs text-muted-foreground">
                        Roll {student.rollNumber} · {student.classSection}
                      </p>
                    </div>
                    <div
                      role="radiogroup"
                      aria-label={`Attendance for ${student.fullName}`}
                      className="flex flex-wrap gap-1.5"
                    >
                      {STATUSES.map((status) => {
                        const option = ATTENDANCE_OPTIONS[status];
                        const selected = marks[student.id] === status;
                        const Icon = option.icon;
                        return (
                          <button
                            key={status}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            onClick={() =>
                              setDraft((current) => ({
                                date,
                                marks: { ...current.marks, [student.id]: status },
                              }))
                            }
                            className={cn(
                              "inline-flex min-h-11 items-center gap-1.5 rounded-md border px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                              selected
                                ? option.activeClass
                                : "border-border bg-background text-muted-foreground hover:bg-muted",
                            )}
                          >
                            <Icon className="size-4" strokeWidth={2} aria-hidden />
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          )}
        </div>
      )}
    </PageShell>
  );
}
