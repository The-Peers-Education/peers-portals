import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-cloud/70", className)}
      aria-hidden
    />
  );
}

export function KpiChipSkeleton() {
  return (
    <div className="flex min-w-0 items-center justify-between gap-2 rounded-[10px] bg-card px-3 py-2 ring-1 ring-foreground/10">
      <div className="min-w-0 space-y-1.5">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-5 w-12 shrink-0 rounded-full" />
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-28" />
        </div>
        <Skeleton className="size-11 rounded-[10px]" />
      </div>
      <Skeleton className="mt-4 h-3 w-40" />
    </div>
  );
}

export function ChartCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl bg-card p-4 ring-1 ring-foreground/10", className)}>
      <Skeleton className="h-5 w-40" />
      <Skeleton className="mt-2 h-4 w-64 max-w-full" />
      <Skeleton className="mt-6 h-[220px] w-full rounded-[10px] sm:h-[280px]" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <KpiChipSkeleton key={index} />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <ChartCardSkeleton className="md:col-span-2" />
        <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="mt-2 h-4 w-56 max-w-full" />
          <Skeleton className="mx-auto mt-10 size-44 rounded-full" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="mt-2 h-4 w-64 max-w-full" />
          <Skeleton className="mt-6 h-8 w-20" />
          <Skeleton className="mt-3 h-2.5 w-full rounded-full" />
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Skeleton className="h-20 rounded-[10px]" />
            <Skeleton className="h-20 rounded-[10px]" />
          </div>
        </div>
        <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="mt-2 h-4 w-60 max-w-full" />
          <Skeleton className="mt-4 h-24 rounded-[10px]" />
          <div className="mt-4 grid gap-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-14 rounded-[10px]" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function TableSkeleton({
  rows = 6,
  cols = 5,
  paged = true,
}: {
  rows?: number;
  cols?: number;
  paged?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-[10px] border border-cloud bg-card">
      <div
        className="grid gap-3 border-b border-cloud bg-muted/40 px-3 py-3"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: cols }).map((_, index) => (
          <Skeleton key={`head-${index}`} className="h-3 w-20" />
        ))}
      </div>
      <div className="divide-y divide-cloud">
        {Array.from({ length: rows }).map((_, row) => (
          <div
            key={`row-${row}`}
            className="grid gap-3 px-3 py-3"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: cols }).map((_, col) => (
              <Skeleton key={`cell-${row}-${col}`} className="h-4 w-full" />
            ))}
          </div>
        ))}
      </div>
      {paged ? (
        <div className="flex flex-col gap-3 border-t border-cloud px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-4 w-40" />
          <div className="flex gap-1.5">
            <Skeleton className="h-9 w-24 rounded-[10px]" />
            <Skeleton className="size-9 rounded-[10px]" />
            <Skeleton className="size-9 rounded-[10px]" />
            <Skeleton className="h-9 w-20 rounded-[10px]" />
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function AttendanceSkeleton() {
  return (
    <div className="overflow-hidden rounded-[10px] border border-cloud bg-card">
      <div className="divide-y divide-cloud">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="space-y-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-40" />
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Skeleton className="h-11 w-[5.5rem] rounded-md" />
              <Skeleton className="h-11 w-[5.5rem] rounded-md" />
              <Skeleton className="h-11 w-16 rounded-md" />
              <Skeleton className="h-11 w-16 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ClassListSkeleton({ count = 2 }: { count?: number }) {
  return (
    <div className="grid gap-4">
      {Array.from({ length: count }).map((_, index) => (
        <section key={index} className="rounded-[10px] border border-cloud bg-card p-5">
          <Skeleton className="h-6 w-28" />
          <Skeleton className="mt-2 h-4 w-24" />
          <div className="mt-4 grid gap-3">
            <div className="rounded-[10px] border border-cloud p-3">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="mt-2 h-4 w-48 max-w-full" />
              <div className="mt-3 flex flex-wrap gap-2">
                <Skeleton className="h-9 w-24 rounded-[10px]" />
                <Skeleton className="h-9 w-28 rounded-[10px]" />
              </div>
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}

export function KanbanSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex min-w-full gap-4">
        {Array.from({ length: columns }).map((_, column) => (
          <section
            key={column}
            className="flex min-h-48 w-[min(20rem,calc(100vw-2.5rem))] shrink-0 flex-col gap-3 rounded-[12px] bg-cloud p-3"
          >
            <div className="flex items-center justify-between gap-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-6" />
            </div>
            {Array.from({ length: 2 }).map((_, card) => (
              <div key={card} className="flex flex-col gap-3 rounded-[10px] bg-white p-3 ring-1 ring-deep-navy/10">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-44" />
                <Skeleton className="h-11 w-full rounded-[10px]" />
                <Skeleton className="h-11 w-full rounded-[10px]" />
              </div>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}

export function TimetableSkeleton() {
  return (
    <div className="overflow-x-auto rounded-[10px] border border-cloud bg-white">
      <div className="grid min-w-[720px] grid-cols-7 border-b border-cloud bg-paper px-1 py-2">
        {Array.from({ length: 7 }).map((_, index) => (
          <Skeleton key={index} className="mx-2 h-4 w-16" />
        ))}
      </div>
      {Array.from({ length: 6 }).map((_, row) => (
        <div key={row} className="grid min-w-[720px] grid-cols-7 border-b border-cloud p-1.5">
          <Skeleton className="m-1.5 h-4 w-24 self-center" />
          {Array.from({ length: 6 }).map((_, cell) => (
            <Skeleton key={cell} className="m-1.5 h-16 rounded-[10px]" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="rounded-[12px] border border-deep-navy/10 bg-white p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
            <div className="space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-64 max-w-full" />
            </div>
            <Skeleton className="h-9 w-24 rounded-[10px]" />
          </div>
          <Skeleton className="mt-4 h-16 w-full rounded-[10px]" />
        </div>
      ))}
    </div>
  );
}

export function ProfileHubSkeleton({ tabs = 4 }: { tabs?: number }) {
  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-11 w-28 rounded-[10px]" />
          <Skeleton className="h-11 w-36 rounded-[10px]" />
        </div>
      </div>
      <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Skeleton className="size-16 rounded-full" />
          <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-28" />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex gap-3 overflow-x-auto border-b border-cloud pb-2">
        {Array.from({ length: tabs }).map((_, index) => (
          <Skeleton key={index} className="h-8 w-28 shrink-0 rounded-[10px]" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="mt-2 h-4 w-56" />
          <div className="mt-4 grid gap-3">
            <Skeleton className="h-16 rounded-[10px]" />
            <Skeleton className="h-16 rounded-[10px]" />
          </div>
        </div>
        <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="mt-2 h-4 w-48" />
          <Skeleton className="mt-6 h-24 rounded-[10px]" />
        </div>
      </div>
    </div>
  );
}

export function ReportSheetSkeleton() {
  return (
    <div className="mx-auto max-w-3xl rounded-[10px] border border-cloud bg-white p-6">
      <Skeleton className="h-7 w-56" />
      <Skeleton className="mt-2 h-4 w-40" />
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="mt-6">
        <TableSkeleton rows={6} cols={5} paged={false} />
      </div>
    </div>
  );
}

export function ParentDashboardSkeleton() {
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-11 w-32 rounded-[10px]" />
        <Skeleton className="h-11 w-36 rounded-[10px]" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <StatCardSkeleton key={index} />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="mt-2 h-4 w-56" />
          <div className="mt-4 grid gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="grid gap-1.5">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="mt-2 h-4 w-64 max-w-full" />
          <div className="mt-4 grid gap-3">
            <Skeleton className="h-12 rounded-[10px]" />
            <Skeleton className="h-12 rounded-[10px]" />
            <Skeleton className="h-12 rounded-[10px]" />
          </div>
        </div>
      </div>
    </div>
  );
}
