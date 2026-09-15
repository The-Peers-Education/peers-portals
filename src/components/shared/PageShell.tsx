import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { stack } from "@/lib/styles";

export function PageShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn(stack.page, className)}>{children}</div>;
}
