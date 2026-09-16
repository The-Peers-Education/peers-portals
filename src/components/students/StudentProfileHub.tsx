"use client";

import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Banknote, CalendarCheck, FileText, IdCard, Printer, Receipt, Users } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { EmptyHint, PageHeader } from "@/components/shared/PageHeader";
import { FeeStatusBadge, StudentStatusBadge } from "@/components/shared/StatusBadge";
import { StatCard } from "@/components/shared/StatCard";
import { StudentIdCard } from "@/components/students/StudentIdCard";
import { feesApi } from "@/lib/api";
import { printDocument } from "@/lib/pdf";
import { portalPath } from "@/lib/paths";
import { canEnterGrades, canManageFees } from "@/lib/rbac";
import { useAuthStore } from "@/lib/store";
import {
  formatMonthYear,
  formatPkr,
  getErrorMessage,
  remainingBalance,
  todayKey,
} from "@/lib/utils";
import type { AttendanceStatus, FeeChallan, ParentRelationship, StudentFullProfile } from "@/types";

const RELATION_LABELS: Record<ParentRelationship, string> = {
  FATHER: "Father",
  MOTHER: "Mother",
  GUARDIAN: "Guardian",
};

const ATTENDANCE_TONE: Record<AttendanceStatus, string> = {
  PRESENT: "bg-deep-navy text-white",
  LATE: "bg-marigold text-deep-navy",
  ABSENT: "bg-white text-deep-navy ring-1 ring-deep-navy",
  LEAVE: "bg-cloud text-deep-navy",
};

function initials(name: string) {
  const parts = name.split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "S") + (parts[1]?.[0] ?? "")).toUpperCase();
}

function AttendanceHeatmap({ records }: { records: StudentFullProfile["attendance"] }) {
  const months = useMemo(() => {
    const map = new Map<string, Array<{ date: string; status: AttendanceStatus }>>();
    for (const record of records) {
      const date = new Date(record.date);
      const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
      const list = map.get(key) ?? [];
      list.push({ date: record.date, status: record.status });
      map.set(key, list);
    }
    return [...map.entries()]
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, 3)
      .map(([key, days]) => {
        const [year, month] = key.split("-").map(Number);
        const lookup = new Map(days.map((day) => [new Date(day.date).getUTCDate(), day.status]));
        const total = new Date(Date.UTC(year, month, 0)).getUTCDate();
        return { key, year, month, lookup, total };
      });
  }, [records]);

  if (months.length === 0) {
    return <p className="text-sm text-muted-foreground">No attendance records to plot yet.</p>;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {months.map((block) => (
        <div key={block.key} className="grid gap-2">
          <p className="text-sm font-medium">{formatMonthYear(block.month, block.year)}</p>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: block.total }, (_, index) => {
              const day = index + 1;
              const status = block.lookup.get(day);
              return (
                <span
                  key={day}
                  title={status ? `${day}: ${status}` : `${day}`}
                  className={`flex size-7 items-center justify-center rounded-md text-[11px] ${
                    status ? ATTENDANCE_TONE[status] : "bg-muted text-muted-foreground"
                  }`}
                >
                  {day}
                </span>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export function StudentProfileHub({
  student,
  backHref,
  action,
}: {
  student: StudentFullProfile;
  backHref?: string;
  action?: ReactNode;
}) {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const canFees = canManageFees(user?.role) || user?.role === "PARENT";
  const canIssue = canManageFees(user?.role);
  const canReport = canEnterGrades(user?.role) || user?.role === "PARENT";
  const [idOpen, setIdOpen] = useState(false);
  const [challanOpen, setChallanOpen] = useState(false);
  const now = new Date();
  const [form, setForm] = useState({
    month: String(now.getMonth() + 1),
    year: String(now.getFullYear()),
    amount: "",
    dueDate: todayKey(),
  });

  const feeColumns = useMemo<DataTableColumn<FeeChallan>[]>(
    () => [
      { key: "period", header: "Period", cell: (row) => formatMonthYear(row.month, row.year) },
      { key: "issued", header: "Issued", cell: (row) => formatPkr(row.amount) },
      { key: "paid", header: "Collected", cell: (row) => formatPkr(row.paidAmount ?? 0) },
      {
        key: "due",
        header: "Outstanding",
        cell: (row) => formatPkr(remainingBalance(row)),
      },
      { key: "status", header: "Status", cell: (row) => <FeeStatusBadge status={row.status} /> },
    ],
    [],
  );

  const createMutation = useMutation({
    mutationFn: () =>
      feesApi.create({
        studentId: student.id,
        month: Number(form.month),
        year: Number(form.year),
        amount: Number(form.amount),
        dueDate: form.dueDate,
      }),
    onSuccess: async () => {
      toast.success("Fee challan issued");
      setChallanOpen(false);
      setForm((current) => ({ ...current, amount: "" }));
      await queryClient.invalidateQueries({ queryKey: ["student-full", student.id] });
    },
    onError: (error) => toast.error(getErrorMessage(error, "Unable to issue challan")),
  });

  function onIssue(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    createMutation.mutate();
  }

  const classLabel = student.section
    ? `${student.section.class.name} ${student.section.name}`
    : student.classSection;
  const primaryGuardian = student.guardians[0];
  const percent = student.attendanceSummary.percentage;

  return (
    <div className="grid gap-6">
      <PageHeader
        title={student.fullName}
        description={`Roll ${student.rollNumber} · ${classLabel}`}
        action={
          <div className="flex flex-wrap justify-end gap-2">
            {action}
            {backHref ? (
              <Button variant="outline" asChild>
                <Link href={backHref}>Directory</Link>
              </Button>
            ) : null}
            {canReport ? (
              user?.role === "PARENT" ? (
                <Button type="button" onClick={() => printDocument()}>
                  <FileText className="size-5" strokeWidth={1.75} />
                  Print official report card
                </Button>
              ) : (
                <Button asChild>
                  <Link href={portalPath(user?.role, `/students/${student.id}/report-card`)}>
                    <FileText className="size-5" strokeWidth={1.75} />
                    Print official report card
                  </Link>
                </Button>
              )
            ) : null}
            {canIssue ? (
              <Button type="button" variant="outline" onClick={() => setChallanOpen(true)}>
                <Receipt className="size-5" strokeWidth={1.75} />
                Issue fee challan
              </Button>
            ) : null}
            <Button type="button" variant="outline" onClick={() => setIdOpen(true)}>
              <IdCard className="size-5" strokeWidth={1.75} />
              Print student ID card
            </Button>
          </div>
        }
      />

      <Card>
        <CardContent className="flex flex-col gap-4 pt-0 sm:flex-row sm:items-center">
          <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-deep-navy text-lg font-semibold text-white">
            {initials(student.fullName)}
          </div>
          <dl className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-sm text-muted-foreground">Class / section</dt>
              <dd className="font-medium">{classLabel}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Guardian</dt>
              <dd className="font-medium">
                {primaryGuardian?.fullName?.trim() ||
                  (primaryGuardian ? RELATION_LABELS[primaryGuardian.relationship] : "—")}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Guardian phone</dt>
              <dd className="font-medium">{student.guardianPhone || "—"}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Status</dt>
              <dd>
                <StudentStatusBadge status={student.status} />
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="w-full gap-4">
        <TabsList variant="line" className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="overview">Overview & guardian</TabsTrigger>
          <TabsTrigger value="academics">Academic grades</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          {canFees ? <TabsTrigger value="fees">Fee history</TabsTrigger> : null}
        </TabsList>

        <TabsContent value="overview" className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Guardian contacts</CardTitle>
              <CardDescription>Linked parent accounts and phone on the student record.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              <p className="text-sm">
                Phone on file: <span className="font-medium">{student.guardianPhone || "—"}</span>
              </p>
              {student.guardians.length === 0 ? (
                <p className="text-sm text-muted-foreground">No parent accounts are linked yet.</p>
              ) : (
                <ul className="grid gap-3">
                  {student.guardians.map((guardian) => (
                    <li key={`${guardian.relationship}-${guardian.email}`} className="rounded-[10px] border border-cloud px-3 py-2">
                      <p className="font-medium">
                        {guardian.fullName?.trim() || guardian.email || "Parent"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {RELATION_LABELS[guardian.relationship]}
                        {guardian.email ? ` · ${guardian.email}` : ""}
                      </p>
                      {guardian.occupation ? (
                        <p className="text-sm text-muted-foreground">{guardian.occupation}</p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Documents & health</CardTitle>
              <CardDescription>B-Form, medical notes, and scans are kept with the office copy.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm text-muted-foreground">
              <p>B-Form / birth certificate: not on file.</p>
              <p>Medical notes: none recorded.</p>
              <p>Campus: {student.branch?.name ?? "—"}</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="academics" className="grid gap-4">
          {student.academicTerms.length === 0 ? (
            <EmptyHint
              icon={FileText}
              title="No graded terms yet"
              description="Marks from the gradebook will group here by exam term."
            />
          ) : (
            <div
              id="printable-student-report"
              className="printable-area grid gap-4 print:block"
            >
              {student.academicTerms.map((term) => (
                <Card key={term.examTerm.id}>
                  <CardHeader>
                    <CardTitle>{term.examTerm.name}</CardTitle>
                    <CardDescription>
                      {term.percentage}% · {term.letter} · GPA {term.gpa}
                      {term.rank ? ` · Rank ${term.rank} of ${term.cohortSize}` : ""}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-muted-foreground">
                          <th className="py-2 font-medium">Subject</th>
                          <th className="py-2 font-medium">Marks</th>
                          <th className="py-2 font-medium">Grade</th>
                          <th className="py-2 font-medium">GPA</th>
                        </tr>
                      </thead>
                      <tbody>
                        {term.subjects.map((subject) => (
                          <tr key={subject.subjectId} className="border-b last:border-0">
                            <td className="py-2">{subject.name}</td>
                            <td className="py-2">
                              {subject.marksObtained}/{subject.totalMarks}
                            </td>
                            <td className="py-2">{subject.letter}</td>
                            <td className="py-2">{subject.gpa}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="attendance" className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Attendance"
              value={percent === null ? "—" : `${percent}%`}
              hint={percent === null ? "No days marked yet" : `${student.attendanceSummary.marked} marked days`}
              icon={CalendarCheck}
            />
            <StatCard title="Present" value={String(student.attendanceSummary.present)} icon={Users} />
            <StatCard title="Absent" value={String(student.attendanceSummary.absent)} icon={Banknote} />
            <StatCard title="Leave" value={String(student.attendanceSummary.leave)} icon={IdCard} />
          </div>
          {percent !== null ? (
            <div className="h-3 overflow-hidden rounded-full bg-cloud">
              <div className="h-full rounded-full bg-deep-navy" style={{ width: `${Math.min(100, percent)}%` }} />
            </div>
          ) : null}
          <Card>
            <CardHeader>
              <CardTitle>Monthly heat map</CardTitle>
              <CardDescription>Navy present, gold late, outlined absent, cloud leave.</CardDescription>
            </CardHeader>
            <CardContent>
              <AttendanceHeatmap records={student.attendance} />
            </CardContent>
          </Card>
        </TabsContent>

        {canFees ? (
          <TabsContent value="fees" className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard title="Issued" value={formatPkr(student.feeSummary?.issued ?? 0)} icon={Receipt} />
              <StatCard title="Collected" value={formatPkr(student.feeSummary?.collected ?? 0)} icon={Banknote} />
              <StatCard
                title="Outstanding"
                value={formatPkr(student.feeSummary?.outstanding ?? 0)}
                hint={
                  student.feeSummary?.overdueCount
                    ? `${student.feeSummary.overdueCount} overdue challan(s)`
                    : "All current challans are on track"
                }
                icon={FileText}
              />
            </div>
            {(student.feeChallans ?? []).length === 0 ? (
              <EmptyHint
                icon={Receipt}
                title="No fee challans"
                description="Issued challans and partial receipts will appear here."
              />
            ) : (
              <DataTable
                columns={feeColumns}
                data={student.feeChallans ?? []}
                rowKey={(row) => row.id}
                empty="No fee challans."
              />
            )}
          </TabsContent>
        ) : null}
      </Tabs>

      <Dialog open={idOpen} onOpenChange={setIdOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Student ID card</DialogTitle>
            <DialogDescription>Print on A4; the card is sized for a standard badge.</DialogDescription>
          </DialogHeader>
          <div id="printable-student-id" className="printable-area py-2">
            <StudentIdCard student={student} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIdOpen(false)}>
              Close
            </Button>
            <Button type="button" onClick={() => printDocument()}>
              <Printer className="size-5" strokeWidth={1.75} />
              Print
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={challanOpen} onOpenChange={setChallanOpen}>
        <DialogContent className="sm:max-w-md">
          <form className="grid gap-3" onSubmit={onIssue}>
            <DialogHeader>
              <DialogTitle>Issue fee challan</DialogTitle>
              <DialogDescription>
                Create a challan for {student.fullName} in the current campus.
              </DialogDescription>
            </DialogHeader>
            <Input
              id="challan-month"
              label="Month (1-12)"
              type="number"
              min={1}
              max={12}
              required
              value={form.month}
              onChange={(event) => setForm((current) => ({ ...current, month: event.target.value }))}
            />
            <Input
              id="challan-year"
              label="Year"
              type="number"
              min={2020}
              required
              value={form.year}
              onChange={(event) => setForm((current) => ({ ...current, year: event.target.value }))}
            />
            <Input
              id="challan-amount"
              label="Amount (PKR)"
              type="number"
              min={1}
              required
              value={form.amount}
              onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
            />
            <Input
              id="challan-due"
              label="Due date"
              type="date"
              required
              value={form.dueDate}
              onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setChallanOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Issuing…" : "Issue challan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
