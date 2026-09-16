"use client";

import Image from "next/image";
import type { StudentFullProfile } from "@/types";

export function StudentIdCard({ student }: { student: StudentFullProfile }) {
  const campus = student.branch?.name ?? "The Peers Education System";
  const initials = student.fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <article className="mx-auto w-[86mm] overflow-hidden rounded-[12px] border border-deep-navy bg-white text-deep-navy">
      <header className="flex items-center gap-3 bg-deep-navy px-4 py-3 text-white">
        <Image
          src="/logo.png"
          alt="The Peers Education System"
          width={120}
          height={32}
          className="h-8 w-auto object-contain brightness-0 invert"
        />
        <p className="text-xs font-medium">Student identity card</p>
      </header>
      <div className="grid grid-cols-[auto_1fr] gap-3 px-4 py-4">
        <div className="flex size-16 items-center justify-center rounded-[10px] bg-cloud text-lg font-semibold">
          {initials || "S"}
        </div>
        <dl className="grid gap-1 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">Name</dt>
            <dd className="font-semibold">{student.fullName}</dd>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <dt className="text-xs text-muted-foreground">Roll no</dt>
              <dd className="font-medium">{student.rollNumber}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Class</dt>
              <dd className="font-medium">{student.classSection}</dd>
            </div>
          </div>
        </dl>
      </div>
      <footer className="border-t border-cloud px-4 py-2 text-xs text-muted-foreground">{campus}</footer>
    </article>
  );
}
