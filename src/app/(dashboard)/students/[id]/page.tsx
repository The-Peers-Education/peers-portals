"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, FileText, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyHint, PageHeader } from "@/components/shared/PageHeader";
import { PageShell } from "@/components/shared/PageShell";
import { TableSkeleton } from "@/components/shared/Skeleton";
import { FeeStatusBadge, StudentStatusBadge } from "@/components/shared/StatusBadge";
import { studentsApi } from "@/lib/api";
import { canEnterGrades } from "@/lib/rbac";
import { portalPath } from "@/lib/paths";
import { useAuthStore } from "@/lib/store";
import { formatDate, formatMonthYear, formatPkr, getErrorMessage } from "@/lib/utils";

export default function StudentProfilePage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const user = useAuthStore((state) => state.user);
  const canViewReport = canEnterGrades(user?.role);

  const profileQuery = useQuery({
    queryKey: ["student", id],
    queryFn: () => studentsApi.getById(id),
    enabled: Boolean(id),
    retry: false,
  });

  if (profileQuery.isLoading) {
    return (
      <PageShell>
        <TableSkeleton rows={6} cols={2} />
      </PageShell>
    );
  }

  const profile = profileQuery.data;
  if (!profile) {
    return (
      <EmptyHint
        icon={Users}
        title="Student not found"
        description={getErrorMessage(profileQuery.error, "This student record is unavailable.")}
      />
    );
  }

  return (
    <PageShell>
      <PageHeader
        title={profile.fullName}
        description={`Roll ${profile.rollNumber} · ${profile.classSection}`}
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href={portalPath(user?.role, "/students")}>
                <ArrowLeft className="size-5" strokeWidth={1.75} />
                Directory
              </Link>
            </Button>
            {canViewReport ? (
              <Button asChild>
                <Link href={portalPath(user?.role, `/students/${profile.id}/report-card`)}>
                  <FileText className="size-5" strokeWidth={1.75} />
                  Report card
                </Link>
              </Button>
            ) : null}
          </div>
        }
      />

      <div className="grid gap-2 text-sm">
        <p>Guardian: {profile.guardianPhone || "—"}</p>
        <StudentStatusBadge status={profile.status} />
      </div>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-deep-navy">Fee history</h2>
        {(profile.feeChallans ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">No fee challans yet.</p>
        ) : (
          <ul className="space-y-2">
            {profile.feeChallans?.map((challan) => (
              <li
                key={challan.id}
                className="flex items-center justify-between gap-3 rounded-[10px] border border-cloud px-3 py-2 text-sm"
              >
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
        <h2 className="mb-2 text-sm font-semibold text-deep-navy">Recent attendance</h2>
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
    </PageShell>
  );
}
