"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { CircleUser } from "lucide-react";
import { EmptyHint } from "@/components/shared/PageHeader";
import { PageShell } from "@/components/shared/PageShell";
import { TableSkeleton } from "@/components/shared/Skeleton";
import { StaffProfileView } from "@/components/staff/StaffProfileView";
import { staffApi } from "@/lib/api";
import { getErrorMessage } from "@/lib/utils";

function ProfilePageContent() {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") ?? "overview";

  const profileQuery = useQuery({
    queryKey: ["staff-profile", "me"],
    queryFn: staffApi.me,
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
        icon={CircleUser}
        title="Unable to load your profile"
        description={getErrorMessage(profileQuery.error, "Try signing in again.")}
      />
    );
  }

  return (
    <PageShell>
      <StaffProfileView staff={profileQuery.data} isSelf initialTab={tab} />
    </PageShell>
  );
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <PageShell>
          <TableSkeleton rows={6} cols={2} />
        </PageShell>
      }
    >
      <ProfilePageContent />
    </Suspense>
  );
}
