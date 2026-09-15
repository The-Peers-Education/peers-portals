"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BranchSwitcher } from "@/components/layout/BranchSwitcher";
import { NAV_ITEMS } from "@/lib/nav";
import { ROLE_LABELS } from "@/lib/rbac";
import { useAuthStore } from "@/lib/store";
import { clickable, focusRing } from "@/lib/styles";
import { cn } from "@/lib/utils";

export function Header({
  onMenuClick,
  menuOpen,
}: {
  onMenuClick: () => void;
  menuOpen: boolean;
}) {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const current = NAV_ITEMS.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );

  return (
    <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-3 border-b border-cloud bg-paper/95 px-4 backdrop-blur md:px-6">
      <Image
        src="/logo.png"
        alt="The Peers Education System"
        width={160}
        height={40}
        className="h-10 w-auto object-contain object-left lg:hidden"
        priority
      />

      <div className="hidden min-w-0 flex-1 lg:block">
        <p className="truncate font-display text-base font-semibold text-deep-navy">
          {current?.label ?? "Staff Portal"}
        </p>
        <p className="truncate text-sm text-muted-foreground">
          The Peers Education System
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <BranchSwitcher placement="header" />

        {user?.role ? (
          <Badge variant="secondary" className="hidden bg-marigold text-deep-navy lg:inline-flex">
            {ROLE_LABELS[user.role]}
          </Badge>
        ) : null}

        <button
          type="button"
          className={cn(
            "inline-flex size-11 items-center justify-center rounded-[10px] border border-deep-navy/10 text-deep-navy lg:hidden",
            clickable,
            focusRing,
          )}
          onClick={onMenuClick}
          aria-expanded={menuOpen}
          aria-controls="staff-sidebar"
          aria-label={menuOpen ? "Close navigation" : "Open navigation"}
        >
          {menuOpen ? (
            <X size={22} strokeWidth={2} aria-hidden />
          ) : (
            <Menu size={22} strokeWidth={2} aria-hidden />
          )}
        </button>
      </div>
    </header>
  );
}
