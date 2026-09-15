import Image from "next/image";
import { FeeStatusBadge } from "@/components/shared/StatusBadge";
import { formatDate, formatMonthYear, formatPkr, remainingBalance } from "@/lib/utils";
import type { FeeChallan } from "@/types";

export function ChallanReceipt({
  challan,
  campusName,
}: {
  challan: FeeChallan;
  campusName?: string;
}) {
  const paid = challan.paidAmount ?? 0;
  const due = remainingBalance(challan);

  return (
    <article className="bg-white p-6 text-deep-navy">
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
          <p className="font-display text-lg font-semibold">Fee Challan</p>
          <p className="text-sm text-muted-foreground">{formatMonthYear(challan.month, challan.year)}</p>
          <div className="mt-2 flex justify-end">
            <FeeStatusBadge status={challan.status} />
          </div>
        </div>
      </header>

      <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
        <div>
          <dt className="text-muted-foreground">Student</dt>
          <dd className="font-medium">{challan.student?.fullName ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Roll No</dt>
          <dd className="font-medium">{challan.student?.rollNumber ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Class / Section</dt>
          <dd className="font-medium">{challan.student?.classSection ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Issue Date</dt>
          <dd className="font-medium">{formatDate(challan.createdAt)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Due Date</dt>
          <dd className="font-medium">{formatDate(challan.dueDate)}</dd>
        </div>
      </dl>

      <table className="mt-6 w-full text-sm">
        <thead>
          <tr className="border-y border-cloud bg-paper text-left">
            <th className="px-3 py-2 font-medium">Description</th>
            <th className="px-3 py-2 text-right font-medium">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-cloud">
            <td className="px-3 py-2">Tuition / fee challan</td>
            <td className="px-3 py-2 text-right">{formatPkr(challan.amount)}</td>
          </tr>
          <tr className="border-b border-cloud">
            <td className="px-3 py-2">Paid amount</td>
            <td className="px-3 py-2 text-right">{formatPkr(paid)}</td>
          </tr>
          <tr>
            <td className="px-3 py-2 font-semibold">Balance due</td>
            <td className="px-3 py-2 text-right font-semibold">{formatPkr(due)}</td>
          </tr>
        </tbody>
      </table>

      {(challan.payments ?? []).length > 0 ? (
        <section className="mt-5">
          <h3 className="text-sm font-semibold">Payment history</h3>
          <ul className="mt-2 space-y-1 text-sm">
            {challan.payments?.map((payment) => (
              <li key={payment.id} className="flex justify-between gap-3">
                <span>
                  {formatDate(payment.createdAt)} · {payment.method}
                  {payment.note ? ` · ${payment.note}` : ""}
                </span>
                <span>{formatPkr(payment.amount)}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <p className="mt-8 text-xs text-muted-foreground">
        This is a computer-generated challan for The Peers Education System.
      </p>
    </article>
  );
}
