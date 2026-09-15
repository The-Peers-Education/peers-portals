"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Banknote, Building2, CirclePlus } from "lucide-react";
import { toast } from "sonner";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { EmptyHint, PageHeader } from "@/components/shared/PageHeader";
import { PageShell } from "@/components/shared/PageShell";
import { TableSkeleton } from "@/components/shared/Skeleton";
import { FeeStatusBadge } from "@/components/shared/StatusBadge";
import { feesApi, studentsApi } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import {
  formatDate,
  formatMonthYear,
  formatPkr,
  getErrorMessage,
  MONTHS,
  todayKey,
} from "@/lib/utils";
import type { FeeChallan, FeeStatus } from "@/types";

export default function FeesPage() {
  const queryClient = useQueryClient();
  const branchId = useAuthStore((state) => state.activeBranchId ?? state.user?.branchId);
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const [status, setStatus] = useState<"ALL" | FeeStatus>("ALL");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    studentId: "",
    month: String(currentMonth),
    year: String(currentYear),
    amount: "",
    dueDate: todayKey(),
  });

  const studentsQuery = useQuery({
    queryKey: ["students", branchId],
    queryFn: () => studentsApi.list(),
    enabled: Boolean(branchId),
  });

  const feesQuery = useQuery({
    queryKey: ["fees", branchId, status],
    queryFn: () => feesApi.list(status === "ALL" ? undefined : status),
    enabled: Boolean(branchId),
  });

  const createMutation = useMutation({
    mutationFn: feesApi.create,
    onSuccess: async () => {
      toast.success("Fee challan issued");
      setOpen(false);
      setForm((current) => ({ ...current, studentId: "", amount: "" }));
      await queryClient.invalidateQueries({ queryKey: ["fees", branchId] });
    },
    onError: (error) => toast.error(getErrorMessage(error, "Unable to issue challan")),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, nextStatus }: { id: string; nextStatus: FeeStatus }) =>
      feesApi.updateStatus(id, nextStatus),
    onSuccess: async () => {
      toast.success("Challan marked as paid");
      await queryClient.invalidateQueries({ queryKey: ["fees", branchId] });
    },
    onError: (error) => toast.error(getErrorMessage(error, "Unable to update challan")),
  });

  const columns: DataTableColumn<FeeChallan>[] = [
    {
      key: "student",
      header: "Student",
      cell: (row) => row.student?.fullName ?? "—",
    },
    {
      key: "roll",
      header: "Roll No",
      cell: (row) => row.student?.rollNumber ?? "—",
    },
    {
      key: "amount",
      header: "Amount",
      cell: (row) => formatPkr(row.amount),
    },
    {
      key: "period",
      header: "Month / Year",
      cell: (row) => formatMonthYear(row.month, row.year),
    },
    {
      key: "due",
      header: "Due Date",
      cell: (row) => formatDate(row.dueDate),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => <FeeStatusBadge status={row.status} />,
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      cell: (row) =>
        row.status === "PAID" ? null : (
          <Button
            size="sm"
            variant="outline"
            disabled={statusMutation.isPending}
            onClick={() => statusMutation.mutate({ id: row.id, nextStatus: "PAID" })}
          >
            Mark paid
          </Button>
        ),
    },
  ];

  const years = [currentYear - 1, currentYear, currentYear + 1];

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    createMutation.mutate({
      studentId: form.studentId,
      month: Number(form.month),
      year: Number(form.year),
      amount: Number(form.amount),
      dueDate: form.dueDate,
    });
  }

  if (!branchId) {
    return (
      <EmptyHint
        icon={Building2}
        title="Select a branch"
        description="Choose a campus to manage fee challans."
      />
    );
  }

  return (
    <PageShell>
      <PageHeader
        title="Fee Management"
        description="Generate challans and track pending versus collected payments."
        action={
          <Button onClick={() => setOpen(true)}>
            <CirclePlus className="size-4" strokeWidth={1.75} />
            Issue challan
          </Button>
        }
      />

      <Tabs value={status} onValueChange={(value) => setStatus(value as typeof status)}>
        <TabsList className="bg-cloud/60">
          <TabsTrigger value="ALL">All</TabsTrigger>
          <TabsTrigger value="PENDING">Pending</TabsTrigger>
          <TabsTrigger value="PAID">Paid</TabsTrigger>
        </TabsList>
      </Tabs>

      {feesQuery.isLoading ? (
        <TableSkeleton rows={6} cols={7} />
      ) : (
        <DataTable
          columns={columns}
          data={feesQuery.data ?? []}
          rowKey={(row) => row.id}
          empty="No fee challans for this filter."
        />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Issue fee challan</DialogTitle>
            <DialogDescription>Create a monthly challan for a student in this branch.</DialogDescription>
          </DialogHeader>
          <form className="grid gap-3" onSubmit={onSubmit}>
            <div className="grid gap-1.5">
              <Label>Student</Label>
              <Select
                value={form.studentId || undefined}
                onValueChange={(value) => setForm((current) => ({ ...current, studentId: value }))}
              >
                <SelectTrigger className="w-full" aria-label="Select student">
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent>
                  {(studentsQuery.data ?? []).map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.fullName} · {student.rollNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Month</Label>
                <Select
                  value={form.month}
                  onValueChange={(value) => setForm((current) => ({ ...current, month: value }))}
                >
                  <SelectTrigger className="w-full" aria-label="Fee month">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((label, index) => (
                      <SelectItem key={label} value={String(index + 1)}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Year</Label>
                <Select
                  value={form.year}
                  onValueChange={(value) => setForm((current) => ({ ...current, year: value }))}
                >
                  <SelectTrigger className="w-full" aria-label="Fee year">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={String(year)}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Input
              id="amount"
              label="Amount (PKR)"
              type="number"
              min="1"
              required
              value={form.amount}
              onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
            />
            <Input
              id="dueDate"
              label="Due date"
              type="date"
              required
              value={form.dueDate}
              onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending || !form.studentId}>
                {createMutation.isPending ? "Issuing…" : "Issue challan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
