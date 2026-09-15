"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { SkipLink } from "@/components/shared/SkipLink";
import { PageTransition } from "@/components/ui/animations";
import { authApi, branchesApi } from "@/lib/api";
import { canAccessRoute, isStaffRole } from "@/lib/rbac";
import { useAuthStore } from "@/lib/store";
import { useHasHydrated } from "@/hooks/use-has-hydrated";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const hasHydrated = useHasHydrated();
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const activeBranchId = useAuthStore((state) => state.activeBranchId);
  const setUser = useAuthStore((state) => state.setUser);
  const setActiveBranchId = useAuthStore((state) => state.setActiveBranchId);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const { data: profile } = useQuery({
    queryKey: ["me"],
    queryFn: authApi.me,
    enabled: hasHydrated && Boolean(token),
  });

  const { data: branches } = useQuery({
    queryKey: ["branches"],
    queryFn: branchesApi.list,
    enabled: hasHydrated && Boolean(token) && user?.role === "SUPER_ADMIN",
  });

  useEffect(() => {
    if (profile) setUser(profile);
  }, [profile, setUser]);

  useEffect(() => {
    if (user?.role === "SUPER_ADMIN" && !activeBranchId && branches?.length) {
      setActiveBranchId(branches[0].id);
    }
  }, [user?.role, activeBranchId, branches, setActiveBranchId]);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!token) {
      router.replace("/login");
      return;
    }
    if (user && !isStaffRole(user.role)) {
      clearAuth();
      router.replace("/login");
      return;
    }
    if (user && !canAccessRoute(pathname, user.role)) {
      router.replace("/dashboard");
    }
  }, [hasHydrated, token, user, pathname, router, clearAuth]);

  if (!hasHydrated || !token || !user) {
    return <LoadingSpinner fullPage label="Preparing portal" />;
  }

  if (!canAccessRoute(pathname, user.role)) {
    return <LoadingSpinner fullPage label="Redirecting" />;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <SkipLink />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          menuOpen={sidebarOpen}
          onMenuClick={() => setSidebarOpen((current) => !current)}
        />
        <main id="main-content" tabIndex={-1} className="flex-1 scroll-mt-4 p-4 outline-none md:p-8">
          <PageTransition routeKey={pathname}>{children}</PageTransition>
        </main>
      </div>
    </div>
  );
}
