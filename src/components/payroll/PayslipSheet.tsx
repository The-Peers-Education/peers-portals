"use client";

import Image from "next/image";
import { PayrollStatusBadge } from "@/components/shared/StatusBadge";
import { displayUserName, formatMonthYear, formatPkr } from "@/lib/utils";
import type { PayrollSlip } from "@/types";

export function PayslipSheet({
  slip,
  campusName,
}: {
  slip: PayrollSlip;
  campusName?: string;
}) {
  return (
    <article className="bg-white p-6 text-deep-navy print:p-0">
      <header className="flex items-start justify-between gap-4 border-b border-cloud pb-4">
        <div>
          <Image
            src="/logo.png"
            alt="The Peers Education System"
            width={180}
            height={48}
            className="h-12 w-auto object-contain"
          />
          <p className="mt-2 text-sm font-medium">{campusName ?? "The Peers Education System"}</p>
        </div>
        <div className="text-right">
          <p className="font-display text-lg font-semibold">Salary payslip</p>
          <p className="text-sm text-muted-foreground">{formatMonthYear(slip.month, slip.year)}</p>
          <div className="mt-2 flex justify-end">
            <PayrollStatusBadge status={slip.status} />
          </div>
        </div>
      </header>

      <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
        <div>
          <dt className="text-muted-foreground">Name</dt>
          <dd className="font-medium">{displayUserName(slip.user)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Role</dt>
          <dd className="font-medium">{slip.user?.role ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Gross salary</dt>
          <dd className="font-medium">{formatPkr(slip.baseSalary)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Unpaid-leave deductions</dt>
          <dd className="font-medium">{formatPkr(slip.deductions)}</dd>
        </div>
      </dl>

      <div className="mt-6 rounded-[10px] bg-paper px-4 py-3 text-sm">
        <p className="text-muted-foreground">Net payable</p>
        <p className="font-display text-2xl font-semibold">{formatPkr(slip.netSalary)}</p>
      </div>

      <footer className="mt-16 grid grid-cols-2 gap-10 text-sm">
        <div className="pt-10">
          <p className="border-t border-deep-navy pt-2 font-medium">Accountant</p>
          <p className="text-muted-foreground">Signature &amp; date</p>
        </div>
        <div className="pt-10">
          <p className="border-t border-deep-navy pt-2 font-medium">Branch admin</p>
          <p className="text-muted-foreground">Signature &amp; stamp</p>
        </div>
      </footer>
    </article>
  );
}
