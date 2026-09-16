"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatPkr } from "@/lib/utils";
import type { DashboardAnalytics } from "@/types";

const NAVY = "#1b3a5c";
const MARIGOLD = "#e89b24";
const LEAF = "#3f6f45";
const TOOLTIP = {
  background: "#ffffff",
  border: "1px solid #e6dfd0",
  borderRadius: 10,
  color: "#1f2937",
};

export function FinanceTrendChart({
  data,
}: {
  data: DashboardAnalytics["monthlyRevenueVsExpenses"];
}) {
  return (
    <div className="h-full min-h-[140px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barGap={6}>
          <CartesianGrid stroke="#e6dfd0" vertical={false} />
          <XAxis dataKey="month" tick={{ fill: "#374151", fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis
            tick={{ fill: "#374151", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value: number) => `${Math.round(value / 1000)}k`}
          />
          <Tooltip
            contentStyle={TOOLTIP}
            formatter={(value) => formatPkr(Number(value ?? 0))}
          />
          <Legend />
          <Bar dataKey="expenses" name="Expenses" fill={MARIGOLD} radius={[6, 6, 0, 0]} />
          <Bar dataKey="collectedFees" name="Fees collected" fill={NAVY} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function FeeStatusDonut({
  breakdown,
}: {
  breakdown: DashboardAnalytics["feeStatusBreakdown"];
}) {
  const data = [
    { name: "Outstanding", value: breakdown.pendingCount, color: NAVY },
    { name: "Paid", value: breakdown.paidCount, color: LEAF },
    { name: "Partial", value: breakdown.partialCount, color: MARIGOLD },
  ];
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="h-full min-h-[140px] w-full">
      {total === 0 ? (
        <p className="flex h-full items-center justify-center text-sm text-muted-foreground">
          No fee challans for this campus yet.
        </p>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={62} outerRadius={88} paddingAngle={3}>
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip contentStyle={TOOLTIP} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export function AttendanceMeter({
  overview,
}: {
  overview: DashboardAnalytics["attendanceOverview"];
}) {
  const rows = [
    { label: "Present", value: overview.presentPercentage, color: "bg-leaf" },
    { label: "Absent", value: overview.absentPercentage, color: "bg-destructive" },
    { label: "Leave", value: overview.leavePercentage, color: "bg-marigold" },
  ];

  return (
    <div className="flex min-h-[15.5rem] flex-col justify-center gap-5">
      <div>
        <p className="text-4xl font-semibold tracking-tight text-deep-navy">
          {overview.presentPercentage}%
        </p>
        <p className="text-sm text-muted-foreground">
          {overview.markedCount} of {overview.studentCount} students marked today
        </p>
      </div>
      <div className="grid gap-3">
        {rows.map((row) => (
          <div key={row.label} className="grid gap-1.5">
            <div className="flex items-center justify-between text-sm">
              <span>{row.label}</span>
              <span className="font-medium">{row.value}%</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-cloud">
              <div className={`h-full rounded-full ${row.color}`} style={{ width: `${Math.min(100, row.value)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
