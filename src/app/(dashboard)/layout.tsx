"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { CommandPaletteProvider } from "@/components/layout/CommandPalette";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { SkipLink } from "@/components/shared/SkipLink";
import { PageTransition } from "@/components/ui/animations";
import { authApi, branchesApi } from "@/lib/api";
import { canAccessRoute, homePath, isStaffRole } from "@/lib/rbac";
import { matchPortalPrefix, portalBase, portalPath, toAppPathname } from "@/lib/paths";
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

  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: authApi.me,
    enabled: hasHydrated && Boolean(token),
  });
  const profile = meQuery.data;

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
    if (!token || (!user && meQuery.isError)) {
      clearAuth();
      router.replace("/login");
      return;
    }
    if (user && user.role !== "PARENT" && !isStaffRole(user.role)) {
      clearAuth();
      router.replace("/login");
      return;
    }
    if (user && !canAccessRoute(pathname, user.role)) {
      router.replace(homePath(user.role));
      return;
    }
    if (user) {
      const expected = portalBase(user.role);
      const current = matchPortalPrefix(pathname);
      if (current && current !== expected) {
        router.replace(`${portalPath(user.role, toAppPathname(pathname))}${window.location.search}`);
      }
    }
  }, [hasHydrated, token, user, pathname, router, clearAuth, meQuery.isError]);

  if (!hasHydrated || !token || !user) {
    return <LoadingSpinner fullPage label="Preparing portal" />;
  }

  if (!canAccessRoute(pathname, user.role)) {
    return <LoadingSpinner fullPage label="Redirecting" />;
  }

  return (
    <CommandPaletteProvider>
      <div className="flex min-h-dvh bg-background">
        <SkipLink />
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Header
            menuOpen={sidebarOpen}
            onMenuClick={() => setSidebarOpen((current) => !current)}
          />
          <main id="main-content" tabIndex={-1} className="flex-1 scroll-mt-4 p-4 outline-none md:p-8">
            <div className="mx-auto w-full max-w-screen-2xl">
              <PageTransition routeKey={pathname}>{children}</PageTransition>
            </div>
          </main>
        </div>
      </div>
    </CommandPaletteProvider>
  );
}
