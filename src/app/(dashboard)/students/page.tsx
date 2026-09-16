"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, CirclePlus, FileText, Pencil, Search } from "lucide-react";
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
import { Field } from "@/components/shared/Field";
import { EmptyHint, PageHeader } from "@/components/shared/PageHeader";
import { PageShell } from "@/components/shared/PageShell";
import { SlideOver } from "@/components/shared/SlideOver";
import { TableSkeleton } from "@/components/shared/Skeleton";
import { FeeStatusBadge, StudentStatusBadge } from "@/components/shared/StatusBadge";
import { studentsApi } from "@/lib/api";
import { canEnterGrades, canRegisterStudents } from "@/lib/rbac";
import { portalPath } from "@/lib/paths";
import { useAuthStore } from "@/lib/store";
import { formatDate, formatMonthYear, formatPkr, getErrorMessage } from "@/lib/utils";
import type { Student, StudentStatus } from "@/types";

const STUDENT_STATUSES: StudentStatus[] = [
  "ACTIVE",
  "INACTIVE",
  "GRADUATED",
  "TRANSFERRED",
  "WITHDRAWN",
];

export default function StudentsPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const branchId = useAuthStore((state) => state.activeBranchId ?? state.user?.branchId);
  const canEdit = canRegisterStudents(user?.role);
  const canViewReport = canEnterGrades(user?.role);

  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState({
    fullName: "",
    rollNumber: "",
    classSection: "",
    guardianPhone: "",
  });
  const [editForm, setEditForm] = useState({
    fullName: "",
    classSection: "",
    guardianPhone: "",
    status: "ACTIVE" as StudentStatus,
  });

  const studentsQuery = useQuery({
    queryKey: ["students", branchId],
    queryFn: () => studentsApi.list(),
    enabled: Boolean(branchId),
  });

  const profileQuery = useQuery({
    queryKey: ["student", selectedId],
    queryFn: () => studentsApi.getById(selectedId!),
    enabled: Boolean(selectedId),
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

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: typeof editForm }) =>
      studentsApi.update(id, payload),
    onSuccess: async () => {
      toast.success("Student profile updated");
      await queryClient.invalidateQueries({ queryKey: ["students", branchId] });
      await queryClient.invalidateQueries({ queryKey: ["student", selectedId] });
    },
    onError: (error) => toast.error(getErrorMessage(error, "Unable to update student")),
  });

  const withdrawMutation = useMutation({
    mutationFn: studentsApi.remove,
    onSuccess: async () => {
      toast.success("Student marked as withdrawn");
      await queryClient.invalidateQueries({ queryKey: ["students", branchId] });
      await queryClient.invalidateQueries({ queryKey: ["student", selectedId] });
    },
    onError: (error) => toast.error(getErrorMessage(error, "Unable to withdraw student")),
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
    {
      key: "actions",
      header: "",
      className: "text-right",
      cell: (row) => (
        <div className="flex justify-end gap-2">
          {canViewReport ? (
            <Button size="sm" variant="outline" asChild>
              <Link href={portalPath(user?.role, `/students/${row.id}/report-card`)}>
                <FileText className="size-4" strokeWidth={1.75} />
                Report card
              </Link>
            </Button>
          ) : null}
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSelectedId(row.id);
              setEditForm({
                fullName: row.fullName,
                classSection: row.classSection,
                guardianPhone: row.guardianPhone ?? "",
                status: row.status,
              });
            }}
          >
            <Pencil className="size-4" strokeWidth={1.75} />
            {canEdit ? "Edit" : "View"}
          </Button>
        </div>
      ),
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

  function onEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedId) return;
    updateMutation.mutate({
      id: selectedId,
      payload: {
        fullName: editForm.fullName,
        classSection: editForm.classSection,
        guardianPhone: editForm.guardianPhone,
        status: editForm.status,
      },
    });
  }

  const profile = profileQuery.data;

  useEffect(() => {
    if (!profile) return;
    setEditForm({
      fullName: profile.fullName,
      classSection: profile.classSection,
      guardianPhone: profile.guardianPhone ?? "",
      status: profile.status,
    });
  }, [profile]);

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
          canEdit ? (
            <Button onClick={() => setOpen(true)}>
              <CirclePlus className="size-5" strokeWidth={1.75} />
              Register student
            </Button>
          ) : null
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 z-10 size-5 -translate-y-1/2 text-muted-foreground"
            strokeWidth={1.75}
            aria-hidden
          />
          <Input
            id="student-search"
            type="search"
            placeholder="Name or roll number"
            aria-label="Search students"
            className="pl-10"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <Field id="student-class-filter" label="Class">
        <Select value={classFilter} onValueChange={setClassFilter}>
          <SelectTrigger id="student-class-filter" className="w-full bg-white sm:w-52">
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
        </Field>
      </div>

      {studentsQuery.isLoading ? (
        <TableSkeleton rows={5} cols={6} />
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

      <SlideOver
        open={Boolean(selectedId)}
        onClose={() => setSelectedId(null)}
        title={profile?.fullName ?? "Student profile"}
        description={profile ? `Roll ${profile.rollNumber} · ${profile.classSection}` : "Loading student details"}
        wide
        footer={
          canEdit && selectedId ? (
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="destructive"
                disabled={withdrawMutation.isPending || profile?.status === "WITHDRAWN"}
                onClick={() => withdrawMutation.mutate(selectedId)}
              >
                Mark withdrawn
              </Button>
            </div>
          ) : null
        }
      >
        {profileQuery.isLoading || !profile ? (
          <p className="text-sm text-muted-foreground">Loading profile…</p>
        ) : (
          <div className="flex flex-col gap-6">
            {canEdit ? (
              <form className="grid gap-3" onSubmit={onEdit}>
                <Input
                  id="edit-fullName"
                  label="Full name"
                  required
                  value={editForm.fullName}
                  onChange={(event) =>
                    setEditForm((current) => ({ ...current, fullName: event.target.value }))
                  }
                />
                <Input
                  id="edit-classSection"
                  label="Class / Section"
                  required
                  value={editForm.classSection}
                  onChange={(event) =>
                    setEditForm((current) => ({ ...current, classSection: event.target.value }))
                  }
                />
                <Input
                  id="edit-guardianPhone"
                  label="Guardian phone"
                  value={editForm.guardianPhone}
                  onChange={(event) =>
                    setEditForm((current) => ({ ...current, guardianPhone: event.target.value }))
                  }
                />
                <Field id="edit-status" label="Status">
                <Select
                  value={editForm.status}
                  onValueChange={(value) =>
                    setEditForm((current) => ({ ...current, status: value as StudentStatus }))
                  }
                >
                  <SelectTrigger id="edit-status" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STUDENT_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                </Field>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Saving…" : "Save changes"}
                </Button>
              </form>
            ) : (
              <div className="grid gap-2 text-sm">
                <p>Guardian: {profile.guardianPhone || "—"}</p>
                <StudentStatusBadge status={profile.status} />
              </div>
            )}

            <section>
              <h3 className="mb-2 text-sm font-semibold text-deep-navy">Fee history</h3>
              {(profile.feeChallans ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">No fee challans yet.</p>
              ) : (
                <ul className="space-y-2">
                  {profile.feeChallans?.map((challan) => (
                    <li key={challan.id} className="flex items-center justify-between gap-3 rounded-[10px] border border-cloud px-3 py-2 text-sm">
                      <span>
                        {formatMonthYear(challan.month, challan.year)} · {formatPkr(challan.amount)}
                      </span>
                      <FeeStatusBadge status={challan.status} />
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h3 className="mb-2 text-sm font-semibold text-deep-navy">Recent attendance</h3>
              {(profile.attendance ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">No attendance records yet.</p>
              ) : (
                <ul className="space-y-1 text-sm">
                  {profile.attendance?.map((record) => (
                    <li key={record.id} className="flex justify-between gap-3">
                      <span>{formatDate(record.date)}</span>
                      <span>{record.status}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </SlideOver>
    </PageShell>
  );
}
