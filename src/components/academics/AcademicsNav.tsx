"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { portalPath, toAppPathname } from "@/lib/paths";
import { useAuthStore } from "@/lib/store";

const LINKS = [
  { path: "/academics/classes", label: "Classes" },
  { path: "/academics/exams", label: "Exam terms" },
  { path: "/academics/grades", label: "Gradebook" },
  { path: "/academics/homework", label: "Homework" },
];

export function AcademicsNav() {
  const pathname = usePathname();
  const role = useAuthStore((state) => state.user?.role);
  const appPath = toAppPathname(pathname);

  return (
    <nav aria-label="Academic sections" className="flex flex-wrap gap-2">
      {LINKS.map((link) => {
        const active =
          appPath === link.path || (link.path === "/academics/classes" && appPath === "/academics");
        return (
          <Link
            key={link.path}
            href={portalPath(role, link.path)}
            className={cn(
              "inline-flex h-10 items-center rounded-[10px] px-3 text-[15px]",
              active
                ? "bg-deep-navy text-white"
                : "border border-deep-navy/15 bg-white text-deep-navy hover:bg-cloud",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
