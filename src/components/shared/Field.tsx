import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Field({
  id,
  label,
  hint,
  className,
  children,
}: {
  id?: string;
  label: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}) {
  const child = Children.only(children);
  const control = isValidElement(child)
    ? cloneElement(child as ReactElement<{ id?: string; label?: string }>, { id, label })
    : children;

  return (
    <div className={cn(className)}>
      {control}
      {hint ? <p className="mt-1.5 text-sm text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
