export function SkipLink({
  href = "#main-content",
  className,
}: {
  href?: string;
  className?: string;
}) {
  return (
    <a
      href={href}
      className={
        className ??
        "sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-[10px] focus:bg-marigold focus:px-4 focus:py-2.5 focus:text-sm focus:font-medium focus:text-deep-navy focus:shadow-brand-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-deep-navy focus-visible:ring-offset-2"
      }
    >
      Skip to main content
    </a>
  );
}
