"use client";

import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarRange, Pencil, Receipt } from "lucide-react";
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
import { PayrollStatusBadge } from "@/components/shared/StatusBadge";
import { staffApi } from "@/lib/api";
import { ROLE_LABELS } from "@/lib/rbac";
import { useAuthStore } from "@/lib/store";
import { formatDate, formatMonthYear, formatPkr, formatTimeRange, getErrorMessage } from "@/lib/utils";
import type { DayOfWeek, StaffProfile } from "@/types";

const DAY_LABELS: Record<DayOfWeek, string> = {
  MON: "Monday",
  TUE: "Tuesday",
  WED: "Wednesday",
  THU: "Thursday",
  FRI: "Friday",
  SAT: "Saturday",
};

function displayName(staff: StaffProfile) {
  return staff.fullName?.trim() || staff.staffProfile?.designation?.trim() || staff.email;
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
  const tab = isSelf && initialTab === "security" ? "security" : "overview";
  const [open, setOpen] = useState(false);
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
    ],
    [],
  );

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
            : "Staff member details, assigned classes, and payroll history."
        }
        action={action}
      />

      <Tabs defaultValue={tab} className="w-full gap-4">
        <TabsList variant="line" className="w-full justify-start">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="classes">Assigned classes</TabsTrigger>
          <TabsTrigger value="payroll">Payroll</TabsTrigger>
          {isSelf ? <TabsTrigger value="security">Security & password</TabsTrigger> : null}
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Account details</CardTitle>
              <CardDescription className="flex items-center gap-2">
                <Badge variant={staff.isActive === false ? "secondary" : "default"}>
                  {staff.isActive === false ? "Inactive" : "Active"}
                </Badge>
                {staff.staffProfile?.designation ? (
                  <span>{staff.staffProfile.designation}</span>
                ) : null}
              </CardDescription>
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
        </TabsContent>

        <TabsContent value="classes">
          {staff.assignedClasses.length === 0 ? (
            <EmptyHint
              icon={CalendarRange}
              title="No assigned classes"
              description="Timetable slots for this staff member will appear here."
            />
          ) : (
            <DataTable
              columns={classColumns}
              data={staff.assignedClasses}
              rowKey={(row) => row.id}
              empty="No assigned classes."
            />
          )}
        </TabsContent>

        <TabsContent value="payroll">
          {staff.payroll.length === 0 ? (
            <EmptyHint
              icon={Receipt}
              title="No payroll history"
              description="Generated payslips for the last 12 months will appear here."
            />
          ) : (
            <DataTable
              columns={payrollColumns}
              data={staff.payroll}
              rowKey={(row) => row.id}
              empty="No payroll history."
            />
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
    </div>
  );
}
