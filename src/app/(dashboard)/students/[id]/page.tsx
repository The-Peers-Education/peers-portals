"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyHint } from "@/components/shared/PageHeader";
import { PageShell } from "@/components/shared/PageShell";
import { ProfileHubSkeleton } from "@/components/shared/Skeleton";
import { StudentProfileHub } from "@/components/students/StudentProfileHub";
import { studentsApi } from "@/lib/api";
import { portalPath } from "@/lib/paths";
import { useAuthStore } from "@/lib/store";
import { getErrorMessage } from "@/lib/utils";

export default function StudentProfilePage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const user = useAuthStore((state) => state.user);

  const profileQuery = useQuery({
    queryKey: ["student-full", id],
    queryFn: () => studentsApi.fullProfile(id),
    enabled: Boolean(id),
    retry: false,
  });

  if (profileQuery.isLoading) {
    return (
      <PageShell>
        <ProfileHubSkeleton />
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
      <StudentProfileHub
        student={profile}
        action={
          <Button variant="outline" asChild>
            <Link href={portalPath(user?.role, "/students")}>
              <ArrowLeft className="size-5" strokeWidth={1.75} />
              Directory
            </Link>
          </Button>
        }
      />
    </PageShell>
  );
}
