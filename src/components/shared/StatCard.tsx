import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  title,
  value,
  hint,
  icon: Icon,
  trend,
  className,
}: {
  title: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  trend?: { value: number; label?: string };
  className?: string;
}) {
  const trendUp = (trend?.value ?? 0) >= 0;
  return (
    <Card className={cn("transition-[box-shadow] duration-500 hover:shadow-brand-lg", className)}>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardDescription>{title}</CardDescription>
          <CardTitle className="mt-1 text-2xl font-semibold tracking-tight">{value}</CardTitle>
        </div>
        <div className="flex size-11 items-center justify-center rounded-[10px] bg-marigold/20 text-deep-navy">
          <Icon className="size-6" strokeWidth={1.75} aria-hidden />
        </div>
      </CardHeader>
      {hint || trend ? (
        <CardContent className="flex flex-col gap-1">
          {trend ? (
            <p className={cn("text-sm font-medium", trendUp ? "text-leaf" : "text-destructive")}>
              {trendUp ? "+" : ""}
              {trend.value}% {trend.label ?? "vs last month"}
            </p>
          ) : null}
          {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
        </CardContent>
      ) : null}
    </Card>
  );
}
