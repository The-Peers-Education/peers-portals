"use client";

import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Banknote, CalendarOff, CalendarRange, FileText, IdCard, Pencil, Receipt, UserMinus } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { PasswordChangeForm } from "@/components/staff/PasswordChangeForm";
import { LeaveStatusBadge, PayrollStatusBadge } from "@/components/shared/StatusBadge";
import { StatCard } from "@/components/shared/StatCard";
import { PayslipSheet } from "@/components/payroll/PayslipSheet";
import { staffApi } from "@/lib/api";
import { printDocument } from "@/lib/pdf";
import { portalPath } from "@/lib/paths";
import { canManagePayroll, canManageStaff, ROLE_LABELS } from "@/lib/rbac";
import { useAuthStore } from "@/lib/store";
import { formatDate, formatMonthYear, formatPkr, formatTimeRange, getErrorMessage } from "@/lib/utils";
import type { DayOfWeek, LeaveRequest, LeaveType, StaffProfile } from "@/types";

const DAY_ORDER: DayOfWeek[] = ["MON", "TUE", "WED", "THU", "FRI", "SAT"];
const DAY_LABELS: Record<DayOfWeek, string> = {
  MON: "Monday",
  TUE: "Tuesday",
  WED: "Wednesday",
  THU: "Thursday",
  FRI: "Friday",
  SAT: "Saturday",
};
const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  CASUAL: "Casual",
  SICK: "Sick",
  UNPAID: "Unpaid",
};

function displayName(staff: StaffProfile) {
  return staff.fullName?.trim() || staff.staffProfile?.designation?.trim() || staff.email;
}

function initials(staff: StaffProfile) {
  const name = displayName(staff);
  const parts = name.split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "S") + (parts[1]?.[0] ?? "")).toUpperCase();
}

function employmentLabel(staff: StaffProfile) {
  if (staff.employmentStatus === "ON_LEAVE") return "On leave";
  if (staff.employmentStatus === "INACTIVE" || staff.isActive === false) return "Inactive";
  return "Active";
}

export function StaffProfileView({
  staff,
  isSelf,
  initialTab = "overview",
  action,
}: {
  staff: StaffProfile;
  isSelf: boolean;
  initialTab?: string;
  action?: ReactNode;
}) {
  const queryClient = useQueryClient();
  const authUser = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const joined = staff.staffProfile?.joinedDate ?? staff.createdAt;
  const canAdmin = canManageStaff(authUser?.role);
  const tab = isSelf && initialTab === "security" ? "security" : "overview";
  const [open, setOpen] = useState(false);
  const [payslip, setPayslip] = useState<StaffProfile["payroll"][number] | null>(null);
  const [form, setForm] = useState({
    fullName: staff.fullName ?? "",
    email: staff.email,
    designation: staff.staffProfile?.designation ?? "",
  });

  const classColumns = useMemo<DataTableColumn<StaffProfile["assignedClasses"][number]>[]>(
    () => [
      {
        key: "day",
        header: "Day",
        cell: (row) => DAY_LABELS[row.dayOfWeek] ?? row.dayOfWeek,
      },
      {
        key: "time",
        header: "Time",
        cell: (row) => formatTimeRange(row.startTime, row.endTime),
      },
      {
        key: "class",
        header: "Class",
        cell: (row) => `${row.section.class.name} ${row.section.name}`,
      },
      {
        key: "subject",
        header: "Subject",
        cell: (row) => (
          <span>
            {row.subject.name}{" "}
            <span className="text-muted-foreground">({row.subject.code})</span>
          </span>
        ),
      },
      {
        key: "room",
        header: "Room",
        cell: (row) => row.classroom?.roomNumber ?? "—",
      },
    ],
    [],
  );

  const leaveColumns = useMemo<DataTableColumn<LeaveRequest>[]>(
    () => [
      { key: "type", header: "Type", cell: (row) => LEAVE_TYPE_LABELS[row.leaveType] ?? row.leaveType },
      {
        key: "dates",
        header: "Dates",
        cell: (row) => `${formatDate(row.startDate)} – ${formatDate(row.endDate)}`,
      },
      { key: "reason", header: "Reason", cell: (row) => row.reason },
      {
        key: "status",
        header: "Status",
        cell: (row) => <LeaveStatusBadge status={row.status} />,
      },
    ],
    [],
  );

  const payrollColumns = useMemo<DataTableColumn<StaffProfile["payroll"][number]>[]>(
    () => [
      {
        key: "period",
        header: "Period",
        cell: (row) => formatMonthYear(row.month, row.year),
      },
      { key: "gross", header: "Gross", cell: (row) => formatPkr(row.baseSalary) },
      { key: "deductions", header: "Deductions", cell: (row) => formatPkr(row.deductions) },
      { key: "net", header: "Net", cell: (row) => formatPkr(row.netSalary) },
      {
        key: "status",
        header: "Status",
        cell: (row) => <PayrollStatusBadge status={row.status} />,
      },
      {
        key: "print",
        header: "",
        className: "text-right",
        cell: (row) => (
          <Button size="sm" variant="outline" onClick={() => setPayslip(row)}>
            Payslip
          </Button>
        ),
      },
    ],
    [],
  );

  const slotsByDay = useMemo(() => {
    const map = new Map<DayOfWeek, StaffProfile["assignedClasses"]>();
    for (const day of DAY_ORDER) map.set(day, []);
    for (const slot of staff.assignedClasses) {
      map.get(slot.dayOfWeek)?.push(slot);
    }
    return map;
  }, [staff.assignedClasses]);

  const updateMutation = useMutation({
    mutationFn: () =>
      staffApi.updateProfile(isSelf ? "me" : staff.id, {
        fullName: form.fullName.trim() || null,
        email: form.email.trim(),
        designation: form.designation.trim() || undefined,
      }),
    onSuccess: async (updated) => {
      toast.success("Profile updated");
      setOpen(false);
      if (isSelf && authUser) {
        setUser({
          ...authUser,
          email: updated.email,
          fullName: updated.fullName ?? null,
        });
      }
      await queryClient.invalidateQueries({ queryKey: ["staff-profile"] });
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      await queryClient.invalidateQueries({ queryKey: ["staff"] });
    },
    onError: (error) => toast.error(getErrorMessage(error, "Unable to update profile")),
  });

  const deactivateMutation = useMutation({
    mutationFn: () => staffApi.update(staff.id, { isActive: staff.isActive === false }),
    onSuccess: async () => {
      toast.success(staff.isActive === false ? "Account activated" : "Account deactivated");
      await queryClient.invalidateQueries({ queryKey: ["staff-profile"] });
      await queryClient.invalidateQueries({ queryKey: ["staff"] });
    },
    onError: (error) => toast.error(getErrorMessage(error, "Unable to update account")),
  });

  const details = [
    { label: "Name", value: displayName(staff) },
    { label: "Email", value: staff.email },
    { label: "Role", value: ROLE_LABELS[staff.role] },
    {
      label: "Assigned branch",
      value: staff.branch?.name ?? (staff.role === "SUPER_ADMIN" ? "All campuses" : "—"),
    },
    { label: "Joined", value: formatDate(joined) },
    { label: "Staff ID", value: staff.id },
    { label: "CNIC / ID number", value: "Not on file" },
    { label: "Emergency contact", value: "Not on file" },
  ];

  function openEditor() {
    setForm({
      fullName: staff.fullName ?? "",
      email: staff.email,
      designation: staff.staffProfile?.designation ?? "",
    });
    setOpen(true);
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateMutation.mutate();
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        title={isSelf ? "My profile" : displayName(staff)}
        description={
          isSelf
            ? "Your academic roles, assigned classes, payroll history, and account security."
            : "Employment, teaching load, leave, and payroll in one place."
        }
        action={
          <div className="flex flex-wrap justify-end gap-2">
            {action}
            <Button type="button" variant="outline" onClick={openEditor}>
              <Pencil className="size-5" strokeWidth={1.75} />
              Edit profile
            </Button>
            {canAdmin && canManagePayroll(authUser?.role) ? (
              <Button variant="outline" asChild>
                <Link href={portalPath(authUser?.role, "/payroll")}>
                  <Banknote className="size-5" strokeWidth={1.75} />
                  Manage salary
                </Link>
              </Button>
            ) : null}
            {canAdmin && !isSelf && staff.role !== "SUPER_ADMIN" ? (
              <Button
                type="button"
                variant="outline"
                disabled={deactivateMutation.isPending}
                onClick={() => deactivateMutation.mutate()}
              >
                <UserMinus className="size-5" strokeWidth={1.75} />
                {staff.isActive === false ? "Activate account" : "Deactivate account"}
              </Button>
            ) : null}
          </div>
        }
      />

      <Card>
        <CardContent className="flex flex-col gap-4 pt-0 sm:flex-row sm:items-center">
          <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-deep-navy text-lg font-semibold text-white">
            {initials(staff)}
          </div>
          <dl className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-sm text-muted-foreground">Designation</dt>
              <dd className="font-medium">{staff.staffProfile?.designation || ROLE_LABELS[staff.role]}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Campus</dt>
              <dd className="font-medium">{staff.branch?.name ?? (staff.role === "SUPER_ADMIN" ? "All campuses" : "—")}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Contact</dt>
              <dd className="font-medium break-all">{staff.email}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Status</dt>
              <dd>
                <Badge variant={employmentLabel(staff) === "Active" ? "default" : "secondary"}>
                  {employmentLabel(staff)}
                </Badge>
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Tabs defaultValue={tab} className="w-full gap-4">
        <TabsList variant="line" className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="classes">Teaching schedule</TabsTrigger>
          <TabsTrigger value="leave">Attendance & leaves</TabsTrigger>
          <TabsTrigger value="payroll">Payroll</TabsTrigger>
          {isSelf ? <TabsTrigger value="security">Security & password</TabsTrigger> : null}
        </TabsList>

        <TabsContent value="overview" className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Employment details</CardTitle>
              <CardDescription>Joined date, identity, and campus assignment.</CardDescription>
              <CardAction>
                <Button type="button" variant="outline" size="sm" onClick={openEditor}>
                  <Pencil className="size-4" strokeWidth={1.75} />
                  Edit
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 sm:grid-cols-2">
                {details.map((item) => (
                  <div key={item.label} className="grid gap-1">
                    <dt className="text-sm text-muted-foreground">{item.label}</dt>
                    <dd className="font-medium break-all">{item.value}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Qualifications</CardTitle>
                <CardDescription>Academic credentials recorded for this staff member.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">No qualifications on file yet.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Documents</CardTitle>
                <CardDescription>CV and employment scans stay with the HR record.</CardDescription>
              </CardHeader>
              <CardContent className="flex items-start gap-3 text-sm text-muted-foreground">
                <FileText className="mt-0.5 size-5 shrink-0" strokeWidth={1.75} />
                No CV or identity documents have been uploaded.
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="classes" className="grid gap-4">
          {(staff.teachingAssignments ?? []).length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {staff.teachingAssignments?.map((assignment) => (
                <Card key={assignment.section.id}>
                  <CardHeader>
                    <CardTitle>
                      {assignment.section.class.name} {assignment.section.name}
                    </CardTitle>
                    <CardDescription>
                      {assignment.subjects.map((subject) => subject.name).join(", ")}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : null}

          {staff.assignedClasses.length === 0 ? (
            <EmptyHint
              icon={CalendarRange}
              title="No assigned classes"
              description="Timetable slots for this staff member will appear here."
            />
          ) : (
            <>
              <div className="overflow-x-auto rounded-[10px] border border-cloud">
                <table className="w-full min-w-[40rem] text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40 text-left">
                      <th className="px-3 py-2 font-medium">Time</th>
                      {DAY_ORDER.map((day) => (
                        <th key={day} className="px-3 py-2 font-medium">
                          {DAY_LABELS[day]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from(
                      new Set(staff.assignedClasses.map((slot) => `${slot.startTime}-${slot.endTime}`)),
                    ).map((timeKey) => {
                      const [startTime, endTime] = timeKey.split("-");
                      return (
                        <tr key={timeKey} className="border-b last:border-0">
                          <td className="px-3 py-2 text-muted-foreground">
                            {formatTimeRange(startTime, endTime)}
                          </td>
                          {DAY_ORDER.map((day) => {
                            const slot = (slotsByDay.get(day) ?? []).find(
                              (item) => item.startTime === startTime && item.endTime === endTime,
                            );
                            return (
                              <td key={day} className="px-3 py-2 align-top">
                                {slot ? (
                                  <div>
                                    <p className="font-medium">{slot.subject.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {slot.section.class.name} {slot.section.name}
                                      {slot.classroom?.roomNumber ? ` · ${slot.classroom.roomNumber}` : ""}
                                    </p>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">—</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <DataTable
                columns={classColumns}
                data={staff.assignedClasses}
                rowKey={(row) => row.id}
                empty="No assigned classes."
              />
            </>
          )}

          {(staff.classAttendance ?? []).length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Class attendance logs</CardTitle>
                <CardDescription>Marked days for students in assigned sections (last 45 days).</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                {staff.classAttendance?.map((row) => {
                  const assignment = staff.teachingAssignments?.find((item) => item.section.id === row.sectionId);
                  const label = assignment
                    ? `${assignment.section.class.name} ${assignment.section.name}`
                    : row.sectionId;
                  return (
                    <div key={row.sectionId} className="grid gap-2 rounded-[10px] border border-cloud px-3 py-3">
                      <p className="font-medium">{label}</p>
                      <p className="text-sm text-muted-foreground">
                        {row.studentCount} students · {row.presentCount} present · {row.absentCount} absent ·{" "}
                        {row.leaveCount} leave
                      </p>
                      {row.recentAbsences.length > 0 ? (
                        <ul className="text-sm">
                          {row.recentAbsences.map((absence) => (
                            <li key={`${absence.studentId}-${absence.date}`} className="flex justify-between gap-3">
                              <span>
                                {absence.fullName} ({absence.rollNumber})
                              </span>
                              <span className="text-muted-foreground">{formatDate(absence.date)}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground">No recent absences.</p>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ) : null}
        </TabsContent>

        <TabsContent value="leave" className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Present this month"
              value={String(staff.leaveStats?.presentDaysThisMonth ?? "—")}
              hint="Calendar days minus approved leave"
              icon={CalendarRange}
            />
            <StatCard
              title="Leave days"
              value={String(staff.leaveStats?.leaveDaysThisMonth ?? 0)}
              hint="Approved overlap in the current month"
              icon={CalendarOff}
            />
            <StatCard
              title="Pending requests"
              value={String(staff.leaveStats?.pending ?? 0)}
              icon={IdCard}
            />
            <StatCard
              title="Approved requests"
              value={String(staff.leaveStats?.approved ?? 0)}
              icon={Receipt}
            />
          </div>
          {(staff.leaves ?? []).length === 0 ? (
            <EmptyHint
              icon={CalendarOff}
              title="No leave history"
              description="Leave requests for this staff member will appear here."
            />
          ) : (
            <DataTable
              columns={leaveColumns}
              data={staff.leaves ?? []}
              rowKey={(row) => row.id}
              empty="No leave history."
            />
          )}
        </TabsContent>

        <TabsContent value="payroll">
          {staff.payroll.length === 0 ? (
            <EmptyHint
              icon={Receipt}
              title="No payroll history"
              description="Generated payslips will appear here."
            />
          ) : (
            <div className="grid gap-4">
              {staff.staffProfile ? (
                <p className="text-sm text-muted-foreground">
                  Base salary {formatPkr(staff.staffProfile.baseSalary)}. Allowances are not tracked separately;
                  unpaid-leave deductions appear on each slip.
                </p>
              ) : null}
              <DataTable
                columns={payrollColumns}
                data={staff.payroll}
                rowKey={(row) => row.id}
                empty="No payroll history."
              />
            </div>
          )}
        </TabsContent>

        {isSelf ? (
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Security & password</CardTitle>
                <CardDescription>
                  Confirm your current password, then choose a new one that is at least 8 characters.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PasswordChangeForm />
              </CardContent>
            </Card>
          </TabsContent>
        ) : null}
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <form className="grid gap-3" onSubmit={onSubmit}>
            <DialogHeader>
              <DialogTitle>Edit account details</DialogTitle>
              <DialogDescription>Update name, email, and job title for this account.</DialogDescription>
            </DialogHeader>
            <Input
              id="profile-name"
              label="Name"
              required
              value={form.fullName}
              onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
            />
            <Input
              id="profile-email"
              label="Email"
              type="email"
              required
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            />
            <Input
              id="profile-designation"
              label="Designation"
              value={form.designation}
              onChange={(event) =>
                setForm((current) => ({ ...current, designation: event.target.value }))
              }
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Saving…" : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(payslip)} onOpenChange={(next) => !next && setPayslip(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payslip</DialogTitle>
            <DialogDescription>Print or download this monthly slip.</DialogDescription>
          </DialogHeader>
          {payslip ? (
            <div id="printable-payslip" className="printable-area">
              <PayslipSheet
                slip={{
                  ...payslip,
                  userId: staff.id,
                  createdAt: staff.createdAt,
                  user: { id: staff.id, email: staff.email, fullName: staff.fullName, role: staff.role },
                }}
                campusName={staff.branch?.name}
              />
            </div>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPayslip(null)}>
              Close
            </Button>
            <Button type="button" onClick={() => printDocument()}>
              Download PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
