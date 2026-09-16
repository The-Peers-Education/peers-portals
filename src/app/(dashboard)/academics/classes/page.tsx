"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, CirclePlus, GraduationCap } from "lucide-react";
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
import { EmptyHint, PageHeader } from "@/components/shared/PageHeader";
import { PageShell } from "@/components/shared/PageShell";
import { TableSkeleton } from "@/components/shared/Skeleton";
import { academicsApi } from "@/lib/api";
import { canManageAcademics } from "@/lib/rbac";
import { useAuthStore } from "@/lib/store";
import { getErrorMessage } from "@/lib/utils";
import type { AcademicClass } from "@/types";

export default function AcademicClassesPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const branchId = useAuthStore((state) => state.activeBranchId ?? state.user?.branchId);
  const canEdit = canManageAcademics(user?.role);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    code: "",
    section: "A",
    subjectName: "",
    subjectCode: "",
  });

  const classesQuery = useQuery({
    queryKey: ["classes", branchId],
    queryFn: academicsApi.listClasses,
    enabled: Boolean(branchId),
  });

  const createMutation = useMutation({
    mutationFn: academicsApi.createClass,
    onSuccess: async () => {
      toast.success("Class created");
      setOpen(false);
      setForm({ name: "", code: "", section: "A", subjectName: "", subjectCode: "" });
      await queryClient.invalidateQueries({ queryKey: ["classes", branchId] });
    },
    onError: (error) => toast.error(getErrorMessage(error, "Unable to create class")),
  });

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    createMutation.mutate({
      name: form.name,
      code: form.code,
      sections: form.section ? [{ name: form.section }] : undefined,
      subjects:
        form.subjectName && form.subjectCode
          ? [{ name: form.subjectName, code: form.subjectCode }]
          : undefined,
    });
  }

  if (!branchId) {
    return (
      <EmptyHint
        icon={Building2}
        title="Select a branch"
        description="Choose a campus to manage classes, sections, and subjects."
      />
    );
  }

  return (
    <PageShell>
      <PageHeader
        title="Classes & subjects"
        description="Structured class catalog used by the gradebook and report cards."
        action={
          canEdit ? (
            <Button onClick={() => setOpen(true)}>
              <CirclePlus className="size-5" strokeWidth={1.75} />
              Add class
            </Button>
          ) : null
        }
      />
      <AcademicsNav />

      {classesQuery.isLoading ? (
        <TableSkeleton rows={4} cols={3} />
      ) : (classesQuery.data ?? []).length === 0 ? (
        <EmptyHint
          icon={GraduationCap}
          title="No classes yet"
          description="Create a class with at least one section and subject before entering marks."
        />
      ) : (
        <div className="grid gap-4">
          {(classesQuery.data ?? []).map((schoolClass) => (
            <ClassCard key={schoolClass.id} schoolClass={schoolClass} canEdit={canEdit} />
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add class</DialogTitle>
            <DialogDescription>Code must be unique within the selected campus.</DialogDescription>
          </DialogHeader>
          <form className="grid gap-3" onSubmit={onSubmit}>
            <Input
              id="class-name"
              label="Class name"
              required
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            />
            <Input
              id="class-code"
              label="Class code"
              required
              value={form.code}
              onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))}
            />
            <Input
              id="section-name"
              label="First section"
              value={form.section}
              onChange={(event) => setForm((current) => ({ ...current, section: event.target.value }))}
            />
            <Input
              id="subject-name"
              label="First subject name"
              value={form.subjectName}
              onChange={(event) =>
                setForm((current) => ({ ...current, subjectName: event.target.value }))
              }
            />
            <Input
              id="subject-code"
              label="First subject code"
              value={form.subjectCode}
              onChange={(event) =>
                setForm((current) => ({ ...current, subjectCode: event.target.value }))
              }
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Saving…" : "Save class"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

function ClassCard({
  schoolClass,
  canEdit,
}: {
  schoolClass: AcademicClass;
  canEdit: boolean;
}) {
  const queryClient = useQueryClient();
  const branchId = useAuthStore((state) => state.activeBranchId ?? state.user?.branchId);
  const [sectionName, setSectionName] = useState("");
  const [subject, setSubject] = useState({ name: "", code: "" });

  const sectionMutation = useMutation({
    mutationFn: () => academicsApi.addSection(schoolClass.id, { name: sectionName }),
    onSuccess: async () => {
      toast.success("Section added");
      setSectionName("");
      await queryClient.invalidateQueries({ queryKey: ["classes", branchId] });
    },
    onError: (error) => toast.error(getErrorMessage(error, "Unable to add section")),
  });

  const subjectMutation = useMutation({
    mutationFn: () => academicsApi.addSubject(schoolClass.id, subject),
    onSuccess: async () => {
      toast.success("Subject added");
      setSubject({ name: "", code: "" });
      await queryClient.invalidateQueries({ queryKey: ["classes", branchId] });
    },
    onError: (error) => toast.error(getErrorMessage(error, "Unable to add subject")),
  });

  return (
    <section className="rounded-[10px] border border-cloud bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-deep-navy">{schoolClass.name}</h2>
          <p className="text-sm text-muted-foreground">Code {schoolClass.code}</p>
        </div>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <p className="text-sm font-medium text-deep-navy">Sections</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {schoolClass.sections.map((section) => (
              <li
                key={section.id}
                className="rounded-full bg-cloud px-3 py-1 text-sm text-deep-navy"
              >
                {section.name} · {section.capacity} seats
              </li>
            ))}
          </ul>
          {canEdit ? (
            <form
              className="mt-3 flex gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                if (sectionName) sectionMutation.mutate();
              }}
            >
              <Input
                id={`${schoolClass.id}-section`}
                placeholder="Section name"
                className="h-10 min-h-10"
                value={sectionName}
                onChange={(event) => setSectionName(event.target.value)}
              />
              <Button type="submit" size="sm" disabled={sectionMutation.isPending}>
                Add
              </Button>
            </form>
          ) : null}
        </div>
        <div>
          <p className="text-sm font-medium text-deep-navy">Subjects</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {schoolClass.subjects.map((item) => (
              <li key={item.id} className="rounded-full bg-cloud px-3 py-1 text-sm text-deep-navy">
                {item.name} ({item.code})
              </li>
            ))}
          </ul>
          {canEdit ? (
            <form
              className="mt-3 grid grid-cols-[1fr_1fr_auto] gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                if (subject.name && subject.code) subjectMutation.mutate();
              }}
            >
              <Input
                id={`${schoolClass.id}-subject-name`}
                placeholder="Subject"
                className="h-10 min-h-10"
                value={subject.name}
                onChange={(event) => setSubject((current) => ({ ...current, name: event.target.value }))}
              />
              <Input
                id={`${schoolClass.id}-subject-code`}
                placeholder="Code"
                className="h-10 min-h-10"
                value={subject.code}
                onChange={(event) => setSubject((current) => ({ ...current, code: event.target.value }))}
              />
              <Button type="submit" size="sm" disabled={subjectMutation.isPending}>
                Add
              </Button>
            </form>
          ) : null}
        </div>
      </div>
    </section>
  );
}
