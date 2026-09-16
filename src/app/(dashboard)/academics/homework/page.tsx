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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyHint, PageHeader } from "@/components/shared/PageHeader";
import { PageShell } from "@/components/shared/PageShell";
import { TableSkeleton } from "@/components/shared/Skeleton";
import { HomeworkStatusBadge } from "@/components/shared/StatusBadge";
import { academicsApi, homeworkApi } from "@/lib/api";
import { canEnterGrades } from "@/lib/rbac";
import { useAuthStore } from "@/lib/store";
import { controlField } from "@/lib/styles";
import { formatDate, getErrorMessage, todayKey } from "@/lib/utils";

export default function HomeworkPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const branchId = useAuthStore((state) => state.activeBranchId ?? state.user?.branchId);
  const canAssign = canEnterGrades(user?.role);
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    subjectId: "",
    title: "",
    description: "",
    dueDate: todayKey(),
  });

  const classesQuery = useQuery({
    queryKey: ["classes", branchId],
    queryFn: academicsApi.listClasses,
    enabled: Boolean(branchId),
  });
  const selectedClass = (classesQuery.data ?? []).find((item) => item.id === classId);
  const sections = selectedClass?.sections ?? [];
  const subjects = selectedClass?.subjects ?? [];

  const homeworkQuery = useQuery({
    queryKey: ["homework", branchId, sectionId],
    queryFn: () => homeworkApi.listBySection(sectionId),
    enabled: Boolean(branchId && sectionId),
  });

  const createMutation = useMutation({
    mutationFn: homeworkApi.create,
    onSuccess: async () => {
      toast.success("Homework assigned");
      setOpen(false);
      setForm({ subjectId: "", title: "", description: "", dueDate: todayKey() });
      await queryClient.invalidateQueries({ queryKey: ["homework", branchId, sectionId] });
    },
    onError: (error) => toast.error(getErrorMessage(error, "Unable to assign homework")),
  });

  function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    createMutation.mutate({
      sectionId,
      subjectId: form.subjectId,
      title: form.title,
      description: form.description,
      dueDate: `${form.dueDate}T16:00:00.000Z`,
    });
  }

  if (!branchId) {
    return (
      <EmptyHint
        icon={Building2}
        title="Select a branch"
        description="Choose an active campus from the header to manage homework."
      />
    );
  }

  return (
    <PageShell>
      <PageHeader
        title="Homework"
        description="Assign classwork and track parent or student submissions."
        action={
          canAssign ? (
            <Button disabled={!sectionId} onClick={() => setOpen(true)}>
              <CirclePlus className="size-5" strokeWidth={1.75} />
              Assign homework
            </Button>
          ) : null
        }
      />
      <AcademicsNav />

      <div className="grid gap-3 sm:grid-cols-2">
        <Select
          value={classId || undefined}
          onValueChange={(value) => {
            setClassId(value);
            setSectionId("");
          }}
        >
          <SelectTrigger className="w-full" aria-label="Class">
            <SelectValue placeholder="Select class" />
          </SelectTrigger>
          <SelectContent>
            {(classesQuery.data ?? []).map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sectionId || undefined} onValueChange={setSectionId} disabled={!classId}>
          <SelectTrigger className="w-full" aria-label="Section">
            <SelectValue placeholder="Select section" />
          </SelectTrigger>
          <SelectContent>
            {sections.map((section) => (
              <SelectItem key={section.id} value={section.id}>
                Section {section.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!sectionId ? (
        <EmptyHint
          icon={CirclePlus}
          title="Choose a section"
          description="Pick a class and section to view assigned homework."
        />
      ) : homeworkQuery.isLoading ? (
        <TableSkeleton rows={5} />
      ) : (homeworkQuery.data ?? []).length === 0 ? (
        <EmptyHint
          icon={CirclePlus}
          title="No homework yet"
          description="Assign the first piece of classwork for this section."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {(homeworkQuery.data ?? []).map((item) => (
            <div key={item.id} className="rounded-[12px] border border-deep-navy/10 bg-white p-4">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.subject.name} · Due {formatDate(item.dueDate)}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">{item.submissions.length} submitted</p>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{item.description}</p>
              {item.submissions.length > 0 ? (
                <ul className="mt-4 flex flex-col gap-2">
                  {item.submissions.map((submission) => (
                    <li
                      key={submission.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] bg-cloud px-3 py-2"
                    >
                      <span className="text-sm">
                        {submission.student?.fullName ?? "Student"} · {submission.student?.rollNumber}
                      </span>
                      <HomeworkStatusBadge status={submission.status} />
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <form onSubmit={onCreate} className="grid gap-4">
            <DialogHeader>
              <DialogTitle>Assign homework</DialogTitle>
              <DialogDescription>Post an assignment with a due date for this section.</DialogDescription>
            </DialogHeader>
            <Select
              value={form.subjectId || undefined}
              onValueChange={(value) => setForm((current) => ({ ...current, subjectId: value }))}
            >
              <SelectTrigger className="w-full" aria-label="Subject">
                <SelectValue placeholder="Subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              required
              placeholder="Title"
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            />
            <textarea
              required
              placeholder="Instructions"
              className={`${controlField} h-auto min-h-24 py-3`}
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            />
            <Input
              required
              type="date"
              value={form.dueDate}
              onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))}
            />
            <DialogFooter>
              <Button type="submit" disabled={createMutation.isPending || !form.subjectId}>
                {createMutation.isPending ? "Saving…" : "Assign"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
