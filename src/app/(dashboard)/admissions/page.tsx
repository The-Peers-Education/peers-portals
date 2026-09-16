"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/shared/Field";
import { EmptyHint, PageHeader } from "@/components/shared/PageHeader";
import { PageShell } from "@/components/shared/PageShell";
import { KanbanSkeleton } from "@/components/shared/Skeleton";
import { AdmissionsStatusBadge } from "@/components/shared/StatusBadge";
import { admissionsApi } from "@/lib/api";
import { canManageAdmissions } from "@/lib/rbac";
import { useAuthStore } from "@/lib/store";
import { formatDate, getErrorMessage } from "@/lib/utils";
import type { AdmissionsLead, AdmissionsLeadStatus } from "@/types";

const COLUMNS: Array<{ status: AdmissionsLeadStatus; title: string }> = [
  { status: "NEW_INQUIRY", title: "New inquiry" },
  { status: "CONTACTED", title: "Contacted" },
  { status: "INTERVIEW_SCHEDULED", title: "Interview" },
  { status: "ADMITTED", title: "Admitted" },
  { status: "REJECTED", title: "Rejected" },
];

export default function AdmissionsPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const branchId = useAuthStore((state) => state.activeBranchId ?? state.user?.branchId);
  const canManage = canManageAdmissions(user?.role);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const leadsQuery = useQuery({
    queryKey: ["admissions-leads", branchId],
    queryFn: admissionsApi.listLeads,
    enabled: Boolean(branchId && canManage),
  });

  const grouped = useMemo(() => {
    const leads = leadsQuery.data ?? [];
    return COLUMNS.reduce(
      (acc, column) => {
        acc[column.status] = leads.filter((lead) => lead.status === column.status);
        return acc;
      },
      {} as Record<AdmissionsLeadStatus, AdmissionsLead[]>,
    );
  }, [leadsQuery.data]);

  const updateMutation = useMutation({
    mutationFn: ({ id, status, note }: { id: string; status: AdmissionsLeadStatus; note?: string }) =>
      admissionsApi.updateStatus(id, { status, notes: note }),
    onSuccess: async (lead) => {
      toast.success(
        lead.status === "ADMITTED" && lead.enrolledStudentId
          ? `Admitted and enrolled (${lead.enrolledStudentId.slice(-6)})`
          : "Lead updated",
      );
      await queryClient.invalidateQueries({ queryKey: ["admissions-leads", branchId] });
    },
    onError: (error) => toast.error(getErrorMessage(error, "Unable to update lead")),
  });

  if (!branchId) {
    return (
      <EmptyHint
        icon={Building2}
        title="Select a branch"
        description="Choose an active campus from the header to manage admissions."
      />
    );
  }

  return (
    <PageShell>
      <PageHeader
        title="Admissions pipeline"
        description="Convert website inquiries into enrolled students."
      />

      {leadsQuery.isLoading ? (
        <KanbanSkeleton />
      ) : (leadsQuery.data ?? []).length === 0 ? (
        <EmptyHint
          icon={ClipboardList}
          title="No leads yet"
          description="Admission inquiries from the public website will appear in this pipeline."
        />
      ) : (
        <div className="overflow-x-auto pb-2">
          <div className="flex min-w-full gap-4">
          {COLUMNS.map((column) => (
            <section
              key={column.status}
              className="flex min-h-48 w-[min(20rem,calc(100vw-2.5rem))] shrink-0 flex-col gap-3 rounded-[12px] bg-cloud p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-[15px] font-medium text-deep-navy">{column.title}</h2>
                <span className="text-sm text-muted-foreground">{grouped[column.status]?.length ?? 0}</span>
              </div>
              {(grouped[column.status] ?? []).map((lead) => (
                <article key={lead.id} className="flex flex-col gap-3 rounded-[10px] bg-white p-3 ring-1 ring-deep-navy/10">
                  <div>
                    <p className="font-medium">{lead.studentName}</p>
                    <p className="text-sm text-muted-foreground">
                      {lead.guardianName} · {lead.guardianPhone}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {lead.targetClass?.name ?? "Class unassigned"} · {formatDate(lead.createdAt)}
                    </p>
                  </div>
                  <AdmissionsStatusBadge status={lead.status} />
                  <Input
                    id={`note-${lead.id}`}
                    label="Note"
                    value={notes[lead.id] ?? ""}
                    onChange={(event) =>
                      setNotes((current) => ({ ...current, [lead.id]: event.target.value }))
                    }
                    placeholder="Add a note"
                  />
                  <Field id={`status-${lead.id}`} label="Status">
                  <Select
                    value={lead.status}
                    onValueChange={(value) =>
                      updateMutation.mutate({
                        id: lead.id,
                        status: value as AdmissionsLeadStatus,
                        note: notes[lead.id]?.trim() || undefined,
                      })
                    }
                    disabled={updateMutation.isPending}
                  >
                    <SelectTrigger id={`status-${lead.id}`} className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COLUMNS.map((option) => (
                        <SelectItem key={option.status} value={option.status}>
                          {option.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  </Field>
                </article>
              ))}
            </section>
          ))}
          </div>
        </div>
      )}
    </PageShell>
  );
}
