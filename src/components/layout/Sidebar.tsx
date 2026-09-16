"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, X } from "lucide-react";
import { LayoutGroup, motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { BranchSwitcher } from "@/components/layout/BranchSwitcher";
import { NAV_ITEMS } from "@/lib/nav";
import { ROLE_LABELS } from "@/lib/rbac";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/store";
import { focusRingOnNavy } from "@/lib/styles";

export function Sidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const role = user?.role;
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const items = NAV_ITEMS.filter((item) => (role ? item.roles.includes(role) : false));
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const sync = () => setIsDesktop(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  const drawerHidden = !isDesktop && !open;

  function logout() {
    clearAuth();
    toast.success("Signed out");
    onClose();
    router.replace("/login");
  }

  return (
    <>
      <button
        type="button"
        aria-label="Close navigation overlay"
        tabIndex={open && !isDesktop ? 0 : -1}
        className={cn(
          "fixed inset-0 z-40 cursor-pointer bg-deep-navy/40 lg:hidden",
          open ? "block" : "hidden",
        )}
        onClick={onClose}
      />
      <aside
        id="staff-sidebar"
        aria-label="Staff navigation"
        aria-hidden={drawerHidden}
        inert={drawerHidden}
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-sidebar text-sidebar-foreground transition-transform lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="h-1.5 bg-marigold" />
        <div className="flex items-start justify-between gap-3 border-b border-sidebar-border px-4 py-4">
          <div className="flex min-w-0 flex-col gap-2">
            <div className="rounded-[10px] bg-paper p-2">
              <Image
                src="/logo.png"
                alt="The Peers Education System"
                width={160}
                height={40}
                className="h-10 w-auto object-contain"
                priority
              />
            </div>
            <span className="w-fit rounded-full bg-marigold px-2 py-0.5 text-xs font-semibold tracking-wide text-deep-navy">
              Staff portal
            </span>
          </div>
          <button
            type="button"
            className={cn(
              "inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-[10px] border border-white/20 text-white hover:bg-white/10 lg:hidden",
              focusRingOnNavy,
            )}
            onClick={onClose}
            aria-label="Close navigation"
          >
            <X size={24} strokeWidth={2} aria-hidden />
          </button>
        </div>

        <LayoutGroup>
          <nav aria-label="Portal pages" className="flex flex-1 flex-col gap-1.5 p-3">
            {items.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex min-h-11 items-center gap-3 rounded-[10px] px-3 py-2 text-[15px] font-medium leading-none transition-colors",
                    focusRingOnNavy,
                    active
                      ? "bg-sidebar-accent text-white"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground",
                  )}
                >
                  {active ? (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-y-1 left-0 w-1 rounded-full bg-marigold"
                      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    />
                  ) : null}
                  <Icon className="size-6 shrink-0" strokeWidth={1.75} aria-hidden />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </LayoutGroup>

        <div className="mt-auto flex flex-col gap-3 border-t border-sidebar-border p-4">
          <BranchSwitcher placement="sidebar" />
          <div className="flex min-w-0 flex-col gap-0.5">
            <p className="truncate text-[15px] font-medium">{user?.email}</p>
            <p className="text-sm text-sidebar-foreground">
              {role ? ROLE_LABELS[role] : "Staff"}
            </p>
          </div>
          <Button
            variant="outline"
            className="w-full border-white/20 bg-transparent text-[15px] text-white hover:bg-white/10 hover:text-white"
            onClick={logout}
          >
            <LogOut className="size-6" strokeWidth={1.75} aria-hidden />
            Logout
          </Button>
        </div>
      </aside>
    </>
  );
}
