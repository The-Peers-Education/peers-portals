"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/academics/classes", label: "Classes" },
  { href: "/academics/exams", label: "Exam terms" },
  { href: "/academics/grades", label: "Gradebook" },
];

export function AcademicsNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Academic sections" className="flex flex-wrap gap-2">
      {LINKS.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
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
