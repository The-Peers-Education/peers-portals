"use client";

import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, CirclePlus, Search } from "lucide-react";
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
import { StudentStatusBadge } from "@/components/shared/StatusBadge";
import { studentsApi } from "@/lib/api";
import { canRegisterStudents } from "@/lib/rbac";
import { useAuthStore } from "@/lib/store";
import { getErrorMessage } from "@/lib/utils";
import type { Student } from "@/types";

export default function StudentsPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const branchId = useAuthStore((state) => state.activeBranchId ?? state.user?.branchId);
  const canRegister = canRegisterStudents(user?.role);

  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    rollNumber: "",
    classSection: "",
    guardianPhone: "",
  });

  const studentsQuery = useQuery({
    queryKey: ["students", branchId],
    queryFn: () => studentsApi.list(),
    enabled: Boolean(branchId),
  });

  const createMutation = useMutation({
    mutationFn: studentsApi.create,
    onSuccess: async () => {
      toast.success("Student registered");
      setOpen(false);
      setForm({ fullName: "", rollNumber: "", classSection: "", guardianPhone: "" });
      await queryClient.invalidateQueries({ queryKey: ["students", branchId] });
    },
    onError: (error) => toast.error(getErrorMessage(error, "Unable to register student")),
  });

  const classSections = useMemo(() => {
    const values = new Set((studentsQuery.data ?? []).map((student) => student.classSection));
    return Array.from(values).sort();
  }, [studentsQuery.data]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (studentsQuery.data ?? []).filter((student) => {
      const matchesClass = classFilter === "all" || student.classSection === classFilter;
      const matchesSearch =
        !query ||
        student.fullName.toLowerCase().includes(query) ||
        student.rollNumber.toLowerCase().includes(query);
      return matchesClass && matchesSearch;
    });
  }, [studentsQuery.data, classFilter, search]);

  const columns: DataTableColumn<Student>[] = [
    { key: "name", header: "Student", cell: (row) => <span className="font-medium">{row.fullName}</span> },
    { key: "roll", header: "Roll No", cell: (row) => row.rollNumber },
    { key: "class", header: "Class / Section", cell: (row) => row.classSection },
    { key: "phone", header: "Guardian Phone", cell: (row) => row.guardianPhone || "—" },
    {
      key: "status",
      header: "Status",
      cell: (row) => <StudentStatusBadge status={row.status} />,
    },
  ];

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    createMutation.mutate({
      fullName: form.fullName,
      rollNumber: form.rollNumber,
      classSection: form.classSection,
      guardianPhone: form.guardianPhone || undefined,
    });
  }

  if (!branchId) {
    return (
      <EmptyHint
        icon={Building2}
        title="Select a branch"
        description="Choose a campus to view its student directory."
      />
    );
  }

  return (
    <PageShell>
      <PageHeader
        title="Students"
        description="Directory of enrolled students for the active branch."
        action={
          canRegister ? (
            <Button onClick={() => setOpen(true)}>
              <CirclePlus className="size-4" strokeWidth={1.75} />
              Register student
            </Button>
          ) : null
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" strokeWidth={1.75} aria-hidden />
          <Input
            id="student-search"
            label="Search by name or roll number"
            labelClassName="left-10"
            className="pl-10"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <Select value={classFilter} onValueChange={setClassFilter}>
          <SelectTrigger className="w-full bg-background sm:w-52" aria-label="Filter by class">
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

      {studentsQuery.isLoading ? (
        <TableSkeleton rows={5} cols={5} />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          rowKey={(row) => row.id}
          empty="No students match the current filters."
        />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Register student</DialogTitle>
            <DialogDescription>Add a student to the selected branch directory.</DialogDescription>
          </DialogHeader>
          <form className="grid gap-3" onSubmit={onSubmit}>
            <Input
              id="fullName"
              label="Full name"
              required
              value={form.fullName}
              onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
            />
            <Input
              id="rollNumber"
              label="Roll number"
              required
              value={form.rollNumber}
              onChange={(event) => setForm((current) => ({ ...current, rollNumber: event.target.value }))}
            />
            <Input
              id="classSection"
              label="Class / Section"
              required
              value={form.classSection}
              onChange={(event) => setForm((current) => ({ ...current, classSection: event.target.value }))}
            />
            <Input
              id="guardianPhone"
              label="Guardian phone"
              value={form.guardianPhone}
              onChange={(event) => setForm((current) => ({ ...current, guardianPhone: event.target.value }))}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Saving…" : "Save student"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
