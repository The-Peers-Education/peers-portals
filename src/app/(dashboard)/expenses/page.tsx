"use client";

import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, CirclePlus } from "lucide-react";
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
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { EmptyHint, PageHeader } from "@/components/shared/PageHeader";
import { PageShell } from "@/components/shared/PageShell";
import { TableSkeleton } from "@/components/shared/Skeleton";
import { expensesApi } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { EXPENSE_CATEGORIES, formatDate, formatPkr, getErrorMessage, toAmount } from "@/lib/utils";
import type { Expense } from "@/types";

export default function ExpensesPage() {
  const queryClient = useQueryClient();
  const branchId = useAuthStore((state) => state.activeBranchId ?? state.user?.branchId);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    category: "Supplies",
    title: "",
    amount: "",
    receiptUrl: "",
  });

  const expensesQuery = useQuery({
    queryKey: ["expenses", branchId],
    queryFn: expensesApi.list,
    enabled: Boolean(branchId),
  });

  const createMutation = useMutation({
    mutationFn: expensesApi.create,
    onSuccess: async () => {
      toast.success("Expense logged");
      setOpen(false);
      setForm({ category: "Supplies", title: "", amount: "", receiptUrl: "" });
      await queryClient.invalidateQueries({ queryKey: ["expenses", branchId] });
    },
    onError: (error) => toast.error(getErrorMessage(error, "Unable to log expense")),
  });

  const total = useMemo(
    () => (expensesQuery.data ?? []).reduce((sum, item) => sum + toAmount(item.amount), 0),
    [expensesQuery.data],
  );

  const columns: DataTableColumn<Expense>[] = [
    { key: "title", header: "Title", cell: (row) => <span className="font-medium">{row.title}</span> },
    { key: "category", header: "Category", cell: (row) => row.category },
    { key: "amount", header: "Amount", cell: (row) => formatPkr(row.amount) },
    { key: "by", header: "Logged by", cell: (row) => row.createdBy?.email ?? "—" },
    { key: "date", header: "Date", cell: (row) => formatDate(row.createdAt) },
  ];

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    createMutation.mutate({
      category: form.category,
      title: form.title,
      amount: Number(form.amount),
      receiptUrl: form.receiptUrl || undefined,
    });
  }

  if (!branchId) {
    return (
      <EmptyHint
        icon={Building2}
        title="Select a branch"
        description="Choose a campus to review and log expenses."
      />
    );
  }

  return (
    <PageShell>
      <PageHeader
        title="Expenses"
        description={`Branch spend to date: ${formatPkr(total)}`}
        action={
          <Button onClick={() => setOpen(true)}>
            <CirclePlus className="size-5" strokeWidth={1.75} />
            Log expense
          </Button>
        }
      />

      {expensesQuery.isLoading ? (
        <TableSkeleton rows={5} cols={5} />
      ) : (
        <DataTable
          columns={columns}
          data={expensesQuery.data ?? []}
          rowKey={(row) => row.id}
          empty="No expenses logged for this branch yet."
        />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Log expense</DialogTitle>
            <DialogDescription>Record a branch expense against the active campus.</DialogDescription>
          </DialogHeader>
          <form className="grid gap-3" onSubmit={onSubmit}>
            <div className="grid gap-1.5">
              <Label>Category</Label>
              <Select
                value={form.category}
                onValueChange={(value) => setForm((current) => ({ ...current, category: value }))}
              >
                <SelectTrigger className="w-full" aria-label="Expense category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Input
              id="title"
              label="Title"
              required
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            />
            <Input
              id="expense-amount"
              label="Amount (PKR)"
              type="number"
              min="1"
              required
              value={form.amount}
              onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
            />
            <Input
              id="receiptUrl"
              label="Receipt URL"
              type="url"
              value={form.receiptUrl}
              onChange={(event) => setForm((current) => ({ ...current, receiptUrl: event.target.value }))}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Saving…" : "Save expense"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
