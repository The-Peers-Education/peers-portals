import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-cloud/70", className)}
      aria-hidden
    />
  );
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-[10px] bg-card p-4 ring-1 ring-cloud">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-7 w-20" />
        </div>
        <Skeleton className="size-9 rounded-lg" />
      </div>
      <Skeleton className="mt-4 h-3 w-40" />
    </div>
  );
}

export function TableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-hidden rounded-[10px] border border-cloud bg-card">
      <div className="grid gap-3 border-b bg-muted/40 px-3 py-3" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {Array.from({ length: cols }).map((_, index) => (
          <Skeleton key={`head-${index}`} className="h-3 w-20" />
        ))}
      </div>
      <div className="divide-y">
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
    </div>
  );
}

export function AttendanceSkeleton() {
  return (
    <div className="overflow-hidden rounded-[10px] border border-cloud bg-card divide-y">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="flex items-center justify-between px-4 py-3">
          <div className="space-y-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-28" />
          </div>
          <div className="flex gap-1.5">
            <Skeleton className="h-11 w-20" />
            <Skeleton className="h-11 w-20" />
            <Skeleton className="h-11 w-16" />
            <Skeleton className="h-11 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}
