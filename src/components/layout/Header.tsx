"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search, X } from "lucide-react";
import { BranchSwitcher } from "@/components/layout/BranchSwitcher";
import { useCommandPalette } from "@/components/layout/CommandPalette";
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
  const { openPalette } = useCommandPalette();
  const crumbs = headerBreadcrumbs(toAppPathname(pathname), user?.role);
  const [shortcut, setShortcut] = useState("Ctrl + K");

  useEffect(() => {
    const mac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
    setShortcut(mac ? "⌘K" : "Ctrl + K");
  }, []);

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
        <button
          type="button"
          onClick={openPalette}
          aria-label="Open command palette"
          aria-keyshortcuts="Control+K Meta+K"
          className={cn(
            "inline-flex h-11 w-44 items-center gap-2 rounded-[10px] border border-deep-navy/15 bg-white px-3 text-sm text-muted-foreground sm:w-64 md:w-80",
            clickable,
            focusRing,
          )}
        >
          <Search size={20} strokeWidth={1.75} aria-hidden className="shrink-0" />
          <span className="min-w-0 flex-1 truncate text-left">Jump to…</span>
          <kbd className="hidden shrink-0 font-sans text-xs text-muted-foreground sm:inline">{shortcut}</kbd>
        </button>
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
