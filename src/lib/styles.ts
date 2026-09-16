/**
 * Peers design system — shared class tokens.
 * Prefer these over one-off Tailwind so buttons, fields, and chrome stay consistent.
 */

export const ease =
  "duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none";

export const focusRing =
  "outline-none focus-visible:ring-2 focus-visible:ring-deep-navy focus-visible:ring-offset-2";

export const focusRingOnNavy =
  "outline-none focus-visible:ring-2 focus-visible:ring-marigold focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar";

/** Form controls: recolor the existing border only, no extra ring. */
export const focusField =
  "outline-none ring-0 shadow-none focus:!border-deep-navy focus-visible:!border-deep-navy focus:ring-0 focus-visible:ring-0 focus:shadow-none";

export const clickable =
  "cursor-pointer disabled:cursor-not-allowed disabled:opacity-60";

export const controlField =
  "h-12 min-h-12 w-full rounded-[10px] border border-deep-navy/15 bg-white px-4 text-base text-ink placeholder:text-base placeholder:text-muted-foreground";

export const controlFieldFloating =
  "peer h-14 min-h-14 w-full rounded-[10px] border border-deep-navy/15 bg-white px-4 pt-5 pb-2 text-base text-ink placeholder:text-transparent";

export const floatingLabel =
  "pointer-events-none absolute left-4 top-1/2 origin-left -translate-y-1/2 text-base text-muted-foreground transition-[top,transform,font-size,color] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none peer-focus:top-2 peer-focus:translate-y-0 peer-focus:text-xs peer-focus:text-deep-navy peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-deep-navy";

export const stack = {
  page: "flex flex-col gap-6",
  section: "flex flex-col gap-4",
  fields: "flex flex-col gap-1.5",
  row: "flex flex-col gap-3 sm:flex-row sm:items-center",
} as const;
