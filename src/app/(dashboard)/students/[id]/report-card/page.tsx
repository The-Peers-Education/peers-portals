"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Printer } from "lucide-react";
import { ReportCardSheet } from "@/components/academics/ReportCardSheet";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field } from "@/components/shared/Field";
import { EmptyHint, PageHeader } from "@/components/shared/PageHeader";
import { PageShell } from "@/components/shared/PageShell";
import { ReportSheetSkeleton } from "@/components/shared/Skeleton";
import { academicsApi } from "@/lib/api";
import { printDocument } from "@/lib/pdf";
import { portalPath } from "@/lib/paths";
import { useAuthStore } from "@/lib/store";
import { getErrorMessage } from "@/lib/utils";

export default function StudentReportCardPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const studentId = params.id;
  const examTermId = searchParams.get("examTermId") ?? "";
  const user = useAuthStore((state) => state.user);
  const branchId = useAuthStore((state) => state.activeBranchId ?? state.user?.branchId);

  const examsQuery = useQuery({
    queryKey: ["exams", branchId],
    queryFn: academicsApi.listExams,
    enabled: Boolean(branchId),
  });

  const reportQuery = useQuery({
    queryKey: ["report-card", studentId, examTermId || "latest"],
    queryFn: () => academicsApi.reportCard(studentId, examTermId || undefined),
    enabled: Boolean(studentId && branchId),
    retry: false,
  });

  const errorMessage = useMemo(() => {
    if (!reportQuery.error) return null;
    return getErrorMessage(reportQuery.error, "Report card is not ready yet");
  }, [reportQuery.error]);

  return (
    <PageShell>
      <PageHeader
        title="Report card"
        description="Downloadable term summary with subject marks, percentage, and teacher signature."
        action={
          <div className="no-print flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href={portalPath(user?.role, "/students")}>
                <ArrowLeft className="size-5" strokeWidth={1.75} />
                Students
              </Link>
            </Button>
            <Button
              type="button"
              className="no-print"
              onClick={() => printDocument()}
              disabled={!reportQuery.data}
            >
              <Printer className="size-5" strokeWidth={1.75} />
              Download PDF
            </Button>
          </div>
        }
      />

      <div className="no-print print:hidden max-w-xs">
        <Field id="report-exam-term" label="Exam term">
        <Select
          value={examTermId || undefined}
          onValueChange={(value) => {
            const next = new URLSearchParams(searchParams.toString());
            if (value) next.set("examTermId", value);
            else next.delete("examTermId");
            router.replace(`${portalPath(user?.role, `/students/${studentId}/report-card`)}?${next.toString()}`);
          }}
        >
          <SelectTrigger id="report-exam-term" className="w-full bg-white">
            <SelectValue placeholder="Latest graded term" />
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
      </div>

      {reportQuery.isLoading ? (
        <ReportSheetSkeleton />
      ) : reportQuery.data ? (
        <div
          id="printable-report-card"
          className="printable-area print-break-inside-avoid mx-auto max-w-3xl rounded-[10px] border border-cloud bg-white"
        >
          <ReportCardSheet report={reportQuery.data} />
        </div>
      ) : (
        <EmptyHint
          icon={Printer}
          title="No report card yet"
          description={errorMessage ?? "Enter grades for this student in the gradebook first."}
        />
      )}
    </PageShell>
  );
}
