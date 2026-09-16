"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, CirclePlus } from "lucide-react";
import { toast } from "sonner";
import { AcademicsNav } from "@/components/academics/AcademicsNav";
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
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { EmptyHint, PageHeader } from "@/components/shared/PageHeader";
import { PageShell } from "@/components/shared/PageShell";
import { TableSkeleton } from "@/components/shared/Skeleton";
import { academicsApi } from "@/lib/api";
import { canEnterGrades } from "@/lib/rbac";
import { useAuthStore } from "@/lib/store";
import { formatDate, getErrorMessage, todayKey } from "@/lib/utils";
import type { ExamTerm } from "@/types";

export default function AcademicExamsPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const branchId = useAuthStore((state) => state.activeBranchId ?? state.user?.branchId);
  const canEdit = canEnterGrades(user?.role);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    startDate: todayKey(),
    endDate: todayKey(),
  });

  const examsQuery = useQuery({
    queryKey: ["exams", branchId],
    queryFn: academicsApi.listExams,
    enabled: Boolean(branchId),
  });

  const createMutation = useMutation({
    mutationFn: academicsApi.createExam,
    onSuccess: async () => {
      toast.success("Exam term created");
      setOpen(false);
      setForm({ name: "", startDate: todayKey(), endDate: todayKey() });
      await queryClient.invalidateQueries({ queryKey: ["exams", branchId] });
    },
    onError: (error) => toast.error(getErrorMessage(error, "Unable to create exam term")),
  });

  const columns: DataTableColumn<ExamTerm>[] = [
    { key: "name", header: "Term", cell: (row) => <span className="font-medium">{row.title ?? row.name}</span> },
    { key: "start", header: "Starts", cell: (row) => formatDate(row.startDate) },
    { key: "end", header: "Ends", cell: (row) => formatDate(row.endDate) },
  ];

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    createMutation.mutate({
      title: form.name,
      name: form.name,
      startDate: form.startDate,
      endDate: form.endDate,
    });
  }

  if (!branchId) {
    return (
      <EmptyHint
        icon={Building2}
        title="Select a branch"
        description="Choose a campus to schedule exam terms."
      />
    );
  }

  return (
    <PageShell>
      <PageHeader
        title="Exam terms"
        description="Create midterms, finals, and other assessment windows for this campus."
        action={
          canEdit ? (
            <Button onClick={() => setOpen(true)}>
              <CirclePlus className="size-5" strokeWidth={1.75} />
              Add exam term
            </Button>
          ) : null
        }
      />
      <AcademicsNav />

      {examsQuery.isLoading ? (
        <TableSkeleton rows={4} cols={3} />
      ) : (
        <DataTable
          columns={columns}
          data={examsQuery.data ?? []}
          rowKey={(row) => row.id}
          empty="No exam terms scheduled yet."
        />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add exam term</DialogTitle>
            <DialogDescription>Teachers can enter marks against an active term.</DialogDescription>
          </DialogHeader>
          <form className="grid gap-3" onSubmit={onSubmit}>
            <Input
              id="exam-name"
              label="Term name"
              required
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            />
            <Input
              id="exam-start"
              label="Start date"
              type="date"
              required
              value={form.startDate}
              onChange={(event) =>
                setForm((current) => ({ ...current, startDate: event.target.value }))
              }
            />
            <Input
              id="exam-end"
              label="End date"
              type="date"
              required
              value={form.endDate}
              onChange={(event) => setForm((current) => ({ ...current, endDate: event.target.value }))}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Saving…" : "Save term"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
