"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Banknote, Building2, CirclePlus, Printer, Receipt } from "lucide-react";
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
import { ChallanReceipt } from "@/components/fees/ChallanReceipt";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { EmptyHint, PageHeader } from "@/components/shared/PageHeader";
import { PageShell } from "@/components/shared/PageShell";
import { TableSkeleton } from "@/components/shared/Skeleton";
import { StatCard } from "@/components/shared/StatCard";
import { FeeStatusBadge } from "@/components/shared/StatusBadge";
import { feesApi, studentsApi, branchesApi } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import {
  formatDate,
  formatMonthYear,
  formatPkr,
  getErrorMessage,
  MONTHS,
  remainingBalance,
  todayKey,
} from "@/lib/utils";
import type { FeeChallan, FeeStatus, PaymentMethod } from "@/types";

export default function FeesPage() {
  const queryClient = useQueryClient();
  const branchId = useAuthStore((state) => state.activeBranchId ?? state.user?.branchId);
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const [status, setStatus] = useState<"ALL" | FeeStatus>("ALL");
  const [open, setOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [receipt, setReceipt] = useState<FeeChallan | null>(null);
  const [selected, setSelected] = useState<FeeChallan | null>(null);
  const [form, setForm] = useState({
    studentId: "",
    month: String(currentMonth),
    year: String(currentYear),
    amount: "",
    dueDate: todayKey(),
  });
  const [payment, setPayment] = useState({
    amount: "",
    method: "CASH" as PaymentMethod,
    note: "",
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

  const reportQuery = useQuery({
    queryKey: ["fee-reports", branchId],
    queryFn: () => feesApi.reports(),
    enabled: Boolean(branchId),
  });

  const branchesQuery = useQuery({
    queryKey: ["branches"],
    queryFn: branchesApi.list,
    enabled: Boolean(branchId),
  });

  const createMutation = useMutation({
    mutationFn: feesApi.create,
    onSuccess: async () => {
      toast.success("Fee challan issued");
      setOpen(false);
      setForm((current) => ({ ...current, studentId: "", amount: "" }));
      await queryClient.invalidateQueries({ queryKey: ["fees", branchId] });
      await queryClient.invalidateQueries({ queryKey: ["fee-reports", branchId] });
    },
    onError: (error) => toast.error(getErrorMessage(error, "Unable to issue challan")),
  });

  const payMutation = useMutation({
    mutationFn: ({ id, amount, method, note }: { id: string; amount: number; method: PaymentMethod; note?: string }) =>
      feesApi.recordPayment(id, { amount, method, note }),
    onSuccess: async (challan) => {
      toast.success(challan.status === "PAID" ? "Challan settled" : "Partial payment recorded");
      setPayOpen(false);
      setSelected(null);
      setPayment({ amount: "", method: "CASH", note: "" });
      await queryClient.invalidateQueries({ queryKey: ["fees", branchId] });
      await queryClient.invalidateQueries({ queryKey: ["fee-reports", branchId] });
    },
    onError: (error) => toast.error(getErrorMessage(error, "Unable to record payment")),
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
      header: "Total",
      cell: (row) => formatPkr(row.amount),
    },
    {
      key: "paid",
      header: "Paid",
      cell: (row) => formatPkr(row.paidAmount ?? 0),
    },
    {
      key: "due",
      header: "Balance",
      cell: (row) => formatPkr(remainingBalance(row)),
    },
    {
      key: "period",
      header: "Month / Year",
      cell: (row) => formatMonthYear(row.month, row.year),
    },
    {
      key: "dueDate",
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
      cell: (row) => (
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="outline" onClick={() => setReceipt(row)}>
            <Receipt className="size-3.5" strokeWidth={1.75} />
            Receipt
          </Button>
          {row.status === "PAID" ? null : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSelected(row);
                setPayment({
                  amount: String(remainingBalance(row)),
                  method: "CASH",
                  note: "",
                });
                setPayOpen(true);
              }}
            >
              Record payment
            </Button>
          )}
        </div>
      ),
    },
  ];

  const campusName = branchesQuery.data?.find((branch) => branch.id === branchId)?.name;
  const years = [currentYear - 1, currentYear, currentYear + 1];
  const report = reportQuery.data;

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

  function onPay(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    payMutation.mutate({
      id: selected.id,
      amount: Number(payment.amount),
      method: payment.method,
      note: payment.note || undefined,
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
        description="Issue challans, record partial collections, and print receipts."
        action={
          <Button onClick={() => setOpen(true)}>
            <CirclePlus className="size-4" strokeWidth={1.75} />
            Issue challan
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          title="Collected"
          value={formatPkr(report?.totalCollected ?? 0)}
          hint="Total paid across challans"
          icon={Banknote}
        />
        <StatCard
          title="Outstanding"
          value={formatPkr(report?.totalPending ?? report?.outstandingBalance ?? 0)}
          hint="Pending and partial balances"
          icon={Receipt}
        />
        <StatCard
          title="Invoiced"
          value={formatPkr(report?.invoicedAmount ?? 0)}
          hint={`${report?.counts.paid ?? 0} paid · ${report?.counts.partial ?? 0} partial · ${report?.counts.pending ?? 0} pending`}
          icon={Building2}
        />
      </div>

      <Tabs value={status} onValueChange={(value) => setStatus(value as typeof status)}>
        <TabsList className="bg-cloud/60">
          <TabsTrigger value="ALL">All</TabsTrigger>
          <TabsTrigger value="PENDING">Pending</TabsTrigger>
          <TabsTrigger value="PARTIAL">Partial</TabsTrigger>
          <TabsTrigger value="PAID">Paid</TabsTrigger>
        </TabsList>
      </Tabs>

      {feesQuery.isLoading ? (
        <TableSkeleton rows={6} cols={9} />
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

      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record payment</DialogTitle>
            <DialogDescription>
              {selected
                ? `Balance due ${formatPkr(remainingBalance(selected))} for ${selected.student?.fullName ?? "student"}.`
                : "Log a cash or bank collection against this challan."}
            </DialogDescription>
          </DialogHeader>
          <form className="grid gap-3" onSubmit={onPay}>
            <Input
              id="pay-amount"
              label="Amount (PKR)"
              type="number"
              min="1"
              step="1"
              required
              value={payment.amount}
              onChange={(event) => setPayment((current) => ({ ...current, amount: event.target.value }))}
            />
            <div className="grid gap-1.5">
              <Label>Method</Label>
              <Select
                value={payment.method}
                onValueChange={(value) =>
                  setPayment((current) => ({ ...current, method: value as PaymentMethod }))
                }
              >
                <SelectTrigger className="w-full" aria-label="Payment method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="BANK">Bank</SelectItem>
                  <SelectItem value="ONLINE">Online</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Input
              id="pay-note"
              label="Note (optional)"
              value={payment.note}
              onChange={(event) => setPayment((current) => ({ ...current, note: event.target.value }))}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPayOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={payMutation.isPending || !selected}>
                {payMutation.isPending ? "Saving…" : "Save payment"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(receipt)} onOpenChange={(next) => !next && setReceipt(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Challan receipt</DialogTitle>
            <DialogDescription>Print or save this challan for the student record.</DialogDescription>
          </DialogHeader>
          {receipt ? <ChallanReceipt challan={receipt} campusName={campusName} /> : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setReceipt(null)}>
              Close
            </Button>
            <Button type="button" onClick={() => window.print()}>
              <Printer className="size-4" strokeWidth={1.75} />
              Print
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {receipt ? (
        <div id="printable-challan" className="hidden">
          <ChallanReceipt challan={receipt} campusName={campusName} />
        </div>
      ) : null}
    </PageShell>
  );
}
