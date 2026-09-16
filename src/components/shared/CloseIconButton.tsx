"use client";

import { X } from "lucide-react";
import { clickable, focusRing } from "@/lib/styles";
import { cn } from "@/lib/utils";

export function CloseIconButton({
  className,
  "aria-label": ariaLabel = "Close",
  ...props
}: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex shrink-0 items-center justify-center bg-transparent p-0 text-deep-navy",
        "origin-center scale-100 transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-110 active:scale-90 motion-reduce:transition-none motion-reduce:hover:scale-100",
        clickable,
        focusRing,
        className,
      )}
      {...props}
    >
      <X className="size-6" strokeWidth={2} aria-hidden />
    </button>
  );
}
