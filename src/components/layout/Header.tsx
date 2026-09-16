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
    <header className="no-print sticky top-0 z-30 border-b border-cloud bg-paper/95 backdrop-blur">
      <div className="mx-auto flex min-h-16 w-full max-w-screen-2xl items-center justify-between gap-2 px-3 sm:gap-3 sm:px-4 md:px-8">
        <Image
          src="/logo.png"
          alt="The Peers Education System"
          width={160}
          height={40}
          className="h-9 w-auto max-w-[7.25rem] object-contain object-left sm:h-10 sm:max-w-none lg:hidden"
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

      <div className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={openPalette}
          aria-label="Open command palette"
          aria-keyshortcuts="Control+K Meta+K"
          className={cn(
            "inline-flex size-11 items-center justify-center rounded-[10px] border border-deep-navy/15 bg-white text-muted-foreground sm:h-11 sm:w-52 sm:justify-start sm:gap-2 sm:px-3 md:w-72 lg:w-80",
            clickable,
            focusRing,
          )}
        >
          <Search size={20} strokeWidth={1.75} aria-hidden className="shrink-0" />
          <span className="hidden min-w-0 flex-1 truncate text-left text-sm sm:inline">Jump to…</span>
          <kbd className="hidden shrink-0 font-sans text-xs text-muted-foreground md:inline">{shortcut}</kbd>
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
      </div>
    </header>
  );
}
