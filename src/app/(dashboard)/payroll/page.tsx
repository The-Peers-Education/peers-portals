"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Printer } from "lucide-react";
import { toast } from "sonner";
import { PayslipSheet } from "@/components/payroll/PayslipSheet";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { Field } from "@/components/shared/Field";
import { EmptyHint, PageHeader } from "@/components/shared/PageHeader";
import { PageShell } from "@/components/shared/PageShell";
import { LeaveStatusBadge, PayrollStatusBadge } from "@/components/shared/StatusBadge";
import { TableSkeleton } from "@/components/shared/Skeleton";
import { payrollApi } from "@/lib/api";
import { canManageStaff, ROLE_LABELS } from "@/lib/rbac";
import { useAuthStore } from "@/lib/store";
import { formatDate, formatMonthYear, formatPkr, getErrorMessage, MONTHS, displayUserName } from "@/lib/utils";
import type { LeaveRequest, PayrollSlip, StaffSalaryProfile } from "@/types";

export default function PayrollPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const branchId = useAuthStore((state) => state.activeBranchId ?? state.user?.branchId);
  const canEditProfiles = canManageStaff(user?.role) || user?.role === "ACCOUNTANT";
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [slip, setSlip] = useState<PayrollSlip | null>(null);
  const [profile, setProfile] = useState<StaffSalaryProfile | null>(null);
  const [salaryForm, setSalaryForm] = useState({ baseSalary: "", designation: "", joinedDate: "" });

  const slipsQuery = useQuery({
    queryKey: ["payroll", branchId, month, year],
    queryFn: () => payrollApi.list({ month, year }),
    enabled: Boolean(branchId),
  });
  const leavesQuery = useQuery({
    queryKey: ["leaves", branchId],
    queryFn: payrollApi.listLeaves,
    enabled: Boolean(branchId),
  });
  const profilesQuery = useQuery({
    queryKey: ["salary-profiles", branchId],
    queryFn: payrollApi.listProfiles,
    enabled: Boolean(branchId),
  });

  const generateMutation = useMutation({
    mutationFn: payrollApi.generate,
    onSuccess: async () => {
      toast.success("Payroll generated");
      await queryClient.invalidateQueries({ queryKey: ["payroll", branchId, month, year] });
    },
    onError: (error) => toast.error(getErrorMessage(error, "Unable to generate payroll")),
  });
  const payMutation = useMutation({
    mutationFn: payrollApi.markPaid,
    onSuccess: async () => {
      toast.success("Payslip marked paid");
      await queryClient.invalidateQueries({ queryKey: ["payroll", branchId, month, year] });
    },
    onError: (error) => toast.error(getErrorMessage(error, "Unable to mark payslip paid")),
  });
  const leaveMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "APPROVED" | "REJECTED" }) =>
      payrollApi.reviewLeave(id, status),
    onSuccess: async () => {
      toast.success("Leave request updated");
      await queryClient.invalidateQueries({ queryKey: ["leaves", branchId] });
    },
    onError: (error) => toast.error(getErrorMessage(error, "Unable to review leave")),
  });
  const profileMutation = useMutation({
    mutationFn: payrollApi.upsertProfile,
    onSuccess: async () => {
      toast.success("Salary profile saved");
      setProfile(null);
      await queryClient.invalidateQueries({ queryKey: ["salary-profiles", branchId] });
    },
    onError: (error) => toast.error(getErrorMessage(error, "Unable to save salary profile")),
  });

  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1];

  const slipColumns: DataTableColumn<PayrollSlip>[] = [
    { key: "staff", header: "Name", cell: (row) => <span className="font-medium">{row.user?.fullName?.trim() || "—"}</span> },
    { key: "gross", header: "Gross", cell: (row) => formatPkr(row.baseSalary) },
    { key: "deductions", header: "Deductions", cell: (row) => formatPkr(row.deductions) },
    { key: "net", header: "Net", cell: (row) => formatPkr(row.netSalary) },
    {
      key: "status",
      header: "Status",
      cell: (row) => <PayrollStatusBadge status={row.status} />,
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      cell: (row) => (
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="outline" onClick={() => setSlip(row)}>
            <Printer className="size-4" strokeWidth={1.75} />
            Payslip
          </Button>
          {row.status === "PENDING" ? (
            <Button size="sm" onClick={() => payMutation.mutate(row.id)} disabled={payMutation.isPending}>
              Mark paid
            </Button>
          ) : null}
        </div>
      ),
    },
  ];

  const leaveColumns: DataTableColumn<LeaveRequest>[] = [
    { key: "staff", header: "Name", cell: (row) => row.user?.fullName?.trim() || "—" },
    { key: "type", header: "Type", cell: (row) => row.leaveType },
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
    {
      key: "actions",
      header: "",
      className: "text-right",
      cell: (row) =>
        row.status === "PENDING" ? (
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => leaveMutation.mutate({ id: row.id, status: "REJECTED" })}
            >
              Reject
            </Button>
            <Button size="sm" onClick={() => leaveMutation.mutate({ id: row.id, status: "APPROVED" })}>
              Approve
            </Button>
          </div>
        ) : null,
    },
  ];

  const profileColumns: DataTableColumn<StaffSalaryProfile>[] = [
    { key: "name", header: "Name", cell: (row) => <span className="font-medium">{row.fullName?.trim() || "—"}</span> },
    { key: "email", header: "Email", cell: (row) => row.email },
    { key: "role", header: "Role", cell: (row) => ROLE_LABELS[row.role] },
    { key: "title", header: "Designation", cell: (row) => row.designation ?? "—" },
    { key: "salary", header: "Base salary", cell: (row) => (row.baseSalary === null ? "—" : formatPkr(row.baseSalary)) },
    {
      key: "actions",
      header: "",
      className: "text-right",
      cell: (row) =>
        canEditProfiles ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setProfile(row);
              setSalaryForm({
                baseSalary: row.baseSalary === null ? "" : String(row.baseSalary),
                designation: row.designation ?? "",
                joinedDate: row.joinedDate ? row.joinedDate.slice(0, 10) : "",
              });
            }}
          >
            Edit salary
          </Button>
        ) : null,
    },
  ];

  function onSaveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile) return;
    profileMutation.mutate({
      userId: profile.userId,
      baseSalary: Number(salaryForm.baseSalary),
      designation: salaryForm.designation,
      joinedDate: salaryForm.joinedDate,
    });
  }

  if (!branchId) {
    return (
      <EmptyHint
        icon={Building2}
        title="Select a branch"
        description="Choose a campus to run payroll."
      />
    );
  }

  return (
    <PageShell>
      <PageHeader
        title="Payroll & HR"
        description="Generate monthly salary rolls, review leave, and print payslips."
        action={
          <Button
            onClick={() => generateMutation.mutate({ month, year })}
            disabled={generateMutation.isPending}
          >
            {generateMutation.isPending ? "Generating…" : "Generate payroll"}
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:max-w-md">
        <Field id="payroll-month" label="Month">
        <Select value={String(month)} onValueChange={(value) => setMonth(Number(value))}>
          <SelectTrigger id="payroll-month" className="w-full bg-white">
            <SelectValue placeholder="Select month" />
          </SelectTrigger>
          <SelectContent>
            {MONTHS.map((label, index) => (
              <SelectItem key={label} value={String(index + 1)}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        </Field>
        <Field id="payroll-year" label="Year">
        <Select value={String(year)} onValueChange={(value) => setYear(Number(value))}>
          <SelectTrigger id="payroll-year" className="w-full bg-white">
            <SelectValue placeholder="Select year" />
          </SelectTrigger>
          <SelectContent>
            {years.map((item) => (
              <SelectItem key={item} value={String(item)}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        </Field>
      </div>

      <section className="grid gap-3">
        <h2 className="font-display text-lg font-semibold">
          Salary roll · {formatMonthYear(month, year)}
        </h2>
        {slipsQuery.isLoading ? (
          <TableSkeleton rows={4} cols={6} />
        ) : (
          <DataTable
            columns={slipColumns}
            data={slipsQuery.data ?? []}
            rowKey={(row) => row.id}
            empty="No payslips for this month yet. Generate payroll after salary profiles are set."
          />
        )}
      </section>

      <section className="grid gap-3">
        <h2 className="font-display text-lg font-semibold">Leave requests</h2>
        {leavesQuery.isLoading ? (
          <TableSkeleton rows={4} cols={5} />
        ) : (
          <DataTable
            columns={leaveColumns}
            data={leavesQuery.data ?? []}
            rowKey={(row) => row.id}
            empty="No leave requests."
          />
        )}
      </section>

      <section className="grid gap-3">
        <h2 className="font-display text-lg font-semibold">Staff salaries</h2>
        {profilesQuery.isLoading ? (
          <TableSkeleton rows={4} cols={5} />
        ) : (
          <DataTable
            columns={profileColumns}
            data={profilesQuery.data ?? []}
            rowKey={(row) => row.userId}
            empty="No staff found for this campus."
          />
        )}
      </section>

      <Dialog open={Boolean(slip)} onOpenChange={(next) => !next && setSlip(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Payslip</DialogTitle>
            <DialogDescription>Print or save this salary statement.</DialogDescription>
          </DialogHeader>
          {slip ? (
            <div id="printable-payslip" className="printable-area print-break-inside-avoid">
              <PayslipSheet slip={slip} />
            </div>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setSlip(null)}>
              Close
            </Button>
            <Button type="button" className="no-print" onClick={() => window.print()}>
              <Printer className="size-5" strokeWidth={1.75} />
              Print
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(profile)} onOpenChange={(next) => !next && setProfile(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Salary profile</DialogTitle>
            <DialogDescription>{profile ? displayUserName(profile) : ""}</DialogDescription>
          </DialogHeader>
          <form className="grid gap-3" onSubmit={onSaveProfile}>
            <Input
              id="salary-designation"
              label="Designation"
              required
              value={salaryForm.designation}
              onChange={(event) =>
                setSalaryForm((current) => ({ ...current, designation: event.target.value }))
              }
            />
            <Input
              id="salary-amount"
              label="Base salary (PKR)"
              type="number"
              min={0}
              required
              value={salaryForm.baseSalary}
              onChange={(event) =>
                setSalaryForm((current) => ({ ...current, baseSalary: event.target.value }))
              }
            />
            <Input
              id="salary-joined"
              label="Joined date"
              type="date"
              required
              value={salaryForm.joinedDate}
              onChange={(event) =>
                setSalaryForm((current) => ({ ...current, joinedDate: event.target.value }))
              }
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setProfile(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={profileMutation.isPending}>
                {profileMutation.isPending ? "Saving…" : "Save profile"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
