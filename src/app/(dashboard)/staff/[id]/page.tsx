"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyHint } from "@/components/shared/PageHeader";
import { PageShell } from "@/components/shared/PageShell";
import { TableSkeleton } from "@/components/shared/Skeleton";
import { StaffProfileView } from "@/components/staff/StaffProfileView";
import { staffApi } from "@/lib/api";
import { canManageStaff } from "@/lib/rbac";
import { portalPath } from "@/lib/paths";
import { useAuthStore } from "@/lib/store";
import { getErrorMessage } from "@/lib/utils";

export default function StaffMemberPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const user = useAuthStore((state) => state.user);
  const isSelf = Boolean(user?.id && user.id === id);
  const useFull = canManageStaff(user?.role);

  const profileQuery = useQuery({
    queryKey: ["staff-profile", id, useFull ? "full" : "basic"],
    queryFn: () => (useFull ? staffApi.fullProfile(id) : staffApi.getById(id)),
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

  if (!profileQuery.data) {
    return (
      <EmptyHint
        icon={UserCog}
        title="Staff member not found"
        description={getErrorMessage(profileQuery.error, "This profile is unavailable.")}
      />
    );
  }

  return (
    <PageShell>
      <StaffProfileView
        staff={profileQuery.data}
        isSelf={isSelf}
        action={
          canManageStaff(user?.role) ? (
            <Button variant="outline" asChild>
              <Link href={portalPath(user?.role, "/staff")}>
                <ArrowLeft className="size-5" strokeWidth={1.75} />
                Directory
              </Link>
            </Button>
          ) : null
        }
      />
    </PageShell>
  );
}
