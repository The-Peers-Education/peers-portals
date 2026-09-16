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
  const spinner = (
    <span
      className={cn(
        "animate-spin rounded-full border-cloud border-t-deep-navy",
        fullPage ? "size-12 border-[3px]" : "size-6 border-2",
        className,
      )}
      aria-hidden
    />
  );

  if (fullPage) {
    return (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-background"
        role="status"
        aria-label={label}
      >
        {spinner}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center" role="status" aria-label={label}>
      {spinner}
    </div>
  );
}
