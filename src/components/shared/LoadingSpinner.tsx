import { cn } from "@/lib/utils";

export function LoadingSpinner({
  className,
  label = "Loading",
  fullPage = false,
}: {
  className?: string;
  label?: string;
  fullPage?: boolean;
}) {
  const body = (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 text-muted-foreground",
        className,
      )}
    >
      <span
        className="size-6 animate-spin rounded-full border-2 border-cloud border-t-primary"
        aria-hidden
      />
      <p className="text-sm">{label}…</p>
    </div>
  );

  if (fullPage) {
    return <div className="flex min-h-[50vh] items-center justify-center">{body}</div>;
  }

  return body;
}
