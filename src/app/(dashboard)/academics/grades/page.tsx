"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { AcademicsNav } from "@/components/academics/AcademicsNav";
import { Button } from "@/components/ui/button";
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
import { TableSkeleton } from "@/components/shared/Skeleton";
import { academicsApi } from "@/lib/api";
import { portalPath } from "@/lib/paths";
import { useAuthStore } from "@/lib/store";
import { getErrorMessage } from "@/lib/utils";
import type { GradebookRow } from "@/types";

export default function AcademicGradesPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const branchId = useAuthStore((state) => state.activeBranchId ?? state.user?.branchId);
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [examTermId, setExamTermId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [drafts, setDrafts] = useState<Record<string, { marksObtained: string; totalMarks: string; remarks: string }>>(
    {},
  );

  const classesQuery = useQuery({
    queryKey: ["classes", branchId],
    queryFn: academicsApi.listClasses,
    enabled: Boolean(branchId),
  });
  const examsQuery = useQuery({
    queryKey: ["exams", branchId],
    queryFn: academicsApi.listExams,
    enabled: Boolean(branchId),
  });

  const selectedClass = (classesQuery.data ?? []).find((item) => item.id === classId);
  const sections = selectedClass?.sections ?? [];
  const subjects = selectedClass?.subjects ?? [];
  const ready = Boolean(classId && sectionId && examTermId && subjectId);

  const gradebookQuery = useQuery({
    queryKey: ["gradebook", branchId, classId, sectionId, subjectId, examTermId],
    queryFn: () => academicsApi.gradebook({ subjectId, examTermId, sectionId }),
    enabled: Boolean(branchId && ready),
  });

  const rows = gradebookQuery.data?.rows ?? [];

  const saveMutation = useMutation({
    mutationFn: academicsApi.saveGrades,
    onSuccess: async () => {
      toast.success("Grades submitted");
      setDrafts({});
      await queryClient.invalidateQueries({
        queryKey: ["gradebook", branchId, classId, sectionId, subjectId, examTermId],
      });
    },
    onError: (error) => toast.error(getErrorMessage(error, "Unable to submit grades")),
  });

  function draftFor(row: GradebookRow) {
    return (
      drafts[row.studentId] ?? {
        marksObtained: row.marksObtained === null ? "" : String(row.marksObtained),
        totalMarks: String(row.totalMarks || 100),
        remarks: row.remarks ?? "",
      }
    );
  }

  function updateDraft(studentId: string, patch: Partial<{ marksObtained: string; totalMarks: string; remarks: string }>) {
    setDrafts((current) => {
      const row = rows.find((item) => item.studentId === studentId);
      const base = current[studentId] ?? {
        marksObtained: row?.marksObtained === null || row?.marksObtained === undefined ? "" : String(row.marksObtained),
        totalMarks: String(row?.totalMarks || 100),
        remarks: row?.remarks ?? "",
      };
      return { ...current, [studentId]: { ...base, ...patch } };
    });
  }

  const columns: DataTableColumn<GradebookRow>[] = useMemo(
    () => [
      { key: "roll", header: "Roll", cell: (row) => row.rollNumber },
      { key: "name", header: "Student", cell: (row) => <span className="font-medium">{row.fullName}</span> },
      {
        key: "marks",
        header: "Marks obtained",
        cell: (row) => (
          <Input
            id={`marks-${row.studentId}`}
            type="number"
            min={0}
            className="h-10 min-h-10 w-28 px-2"
            aria-label={`Marks obtained for ${row.fullName}`}
            value={draftFor(row).marksObtained}
            onChange={(event) => updateDraft(row.studentId, { marksObtained: event.target.value })}
          />
        ),
      },
      {
        key: "total",
        header: "Total",
        cell: (row) => (
          <Input
            id={`total-${row.studentId}`}
            type="number"
            min={1}
            className="h-10 min-h-10 w-24 px-2"
            aria-label={`Total marks for ${row.fullName}`}
            value={draftFor(row).totalMarks}
            onChange={(event) => updateDraft(row.studentId, { totalMarks: event.target.value })}
          />
        ),
      },
      {
        key: "remarks",
        header: "Remarks",
        cell: (row) => (
          <Input
            id={`remarks-${row.studentId}`}
            className="h-10 min-h-10 min-w-40 px-2"
            aria-label={`Remarks for ${row.fullName}`}
            value={draftFor(row).remarks}
            onChange={(event) => updateDraft(row.studentId, { remarks: event.target.value })}
          />
        ),
      },
      {
        key: "report",
        header: "",
        className: "text-right",
        cell: (row) => (
          <Button size="sm" variant="outline" asChild>
            <Link href={`${portalPath(user?.role, `/students/${row.studentId}/report-card`)}?examTermId=${examTermId}`}>
              Report card
            </Link>
          </Button>
        ),
      },
    ],
    [drafts, examTermId, rows, user?.role],
  );

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const entries = rows
      .map((row) => {
        const draft = draftFor(row);
        if (draft.marksObtained === "") return null;
        return {
          studentId: row.studentId,
          marksObtained: Number(draft.marksObtained),
          totalMarks: Number(draft.totalMarks || 100),
          remarks: draft.remarks || undefined,
        };
      })
      .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

    saveMutation.mutate({ subjectId, examTermId, entries });
  }

  if (!branchId) {
    return (
      <EmptyHint
        icon={Building2}
        title="Select a branch"
        description="Choose a campus to enter marks."
      />
    );
  }

  return (
    <PageShell>
      <PageHeader
        title="Gradebook"
        description={
          <span className="inline-flex flex-wrap items-center gap-1">
            Select Class
            <ChevronRight className="size-4 shrink-0" strokeWidth={1.75} aria-hidden />
            Section
            <ChevronRight className="size-4 shrink-0" strokeWidth={1.75} aria-hidden />
            Exam term
            <ChevronRight className="size-4 shrink-0" strokeWidth={1.75} aria-hidden />
            Subject, then enter marks for the roster.
          </span>
        }
      />
      <AcademicsNav />

      <form className="grid gap-3 lg:grid-cols-5" onSubmit={onSubmit}>
        <Field id="grade-class" label="Class">
        <Select
          value={classId}
          onValueChange={(value) => {
            setClassId(value);
            setSectionId("");
            setSubjectId("");
            setDrafts({});
          }}
        >
          <SelectTrigger id="grade-class" className="w-full bg-white">
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
        </Field>
        <Field id="grade-section" label="Section">
        <Select
          value={sectionId}
          onValueChange={(value) => {
            setSectionId(value);
            setDrafts({});
          }}
          disabled={!classId}
        >
          <SelectTrigger id="grade-section" className="w-full bg-white">
            <SelectValue placeholder="Select section" />
          </SelectTrigger>
          <SelectContent>
            {sections.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        </Field>
        <Field id="grade-exam" label="Exam term">
        <Select
          value={examTermId}
          onValueChange={(value) => {
            setExamTermId(value);
            setDrafts({});
          }}
        >
          <SelectTrigger id="grade-exam" className="w-full bg-white">
            <SelectValue placeholder="Select exam term" />
          </SelectTrigger>
          <SelectContent>
            {(examsQuery.data ?? []).map((exam) => (
              <SelectItem key={exam.id} value={exam.id}>
                {exam.title ?? exam.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        </Field>
        <Field id="grade-subject" label="Subject">
        <Select
          value={subjectId}
          onValueChange={(value) => {
            setSubjectId(value);
            setDrafts({});
          }}
          disabled={!classId}
        >
          <SelectTrigger id="grade-subject" className="w-full bg-white">
            <SelectValue placeholder="Select subject" />
          </SelectTrigger>
          <SelectContent>
            {subjects.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        </Field>
        <Button type="submit" disabled={!ready || saveMutation.isPending} className="self-end">
          {saveMutation.isPending ? "Submitting…" : "Submit Grades"}
        </Button>
      </form>

      {!ready ? (
        <p className="text-sm text-muted-foreground">
          Choose a class, section, exam term, and subject to load enrolled students.
        </p>
      ) : gradebookQuery.isLoading ? (
        <TableSkeleton rows={6} cols={6} />
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          rowKey={(row) => row.studentId}
          empty="No students match this class and section yet."
        />
      )}
    </PageShell>
  );
}
