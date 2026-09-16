"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { BranchSwitcher } from "@/components/layout/BranchSwitcher";
import { UserMenu } from "@/components/layout/UserMenu";
import { headerBreadcrumbs } from "@/lib/breadcrumbs";
import { portalPath, toAppPathname } from "@/lib/paths";
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
  const crumbs = headerBreadcrumbs(toAppPathname(pathname), user?.role);

  return (
    <header className="no-print sticky top-0 z-30 flex min-h-16 items-center justify-between gap-3 border-b border-cloud bg-paper/95 px-4 backdrop-blur md:px-6">
      <Image
        src="/logo.png"
        alt="The Peers Education System"
        width={160}
        height={40}
        className="h-10 w-auto object-contain object-left lg:hidden"
        priority
      />

      <nav aria-label="Breadcrumb" className="hidden min-w-0 flex-1 lg:block">
        <ol className="flex min-w-0 items-center gap-2 text-sm">
          {crumbs.map((crumb, index) => (
            <li key={`${crumb.label}-${index}`} className="flex min-w-0 items-center gap-2">
              {index > 0 ? (
                <span className="text-muted-foreground" aria-hidden>
                  /
                </span>
              ) : null}
              {crumb.href && user?.role ? (
                <Link
                  href={portalPath(user.role, crumb.href)}
                  className={cn("truncate text-muted-foreground hover:text-deep-navy", focusRing)}
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="truncate font-medium text-deep-navy">{crumb.label}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>

      <div className="flex shrink-0 items-center gap-3">
        <BranchSwitcher placement="header" />
        <UserMenu />

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
            <X size={24} strokeWidth={2} aria-hidden />
          ) : (
            <Menu size={24} strokeWidth={2} aria-hidden />
          )}
        </button>
      </div>
    </header>
  );
}
