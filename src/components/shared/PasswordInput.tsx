"use client";

import { useId, useState, type ComponentProps } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function PasswordInput({
  className,
  label,
  labelClassName,
  floating = false,
  id,
  ...props
}: Omit<ComponentProps<typeof Input>, "type">) {
  const [visible, setVisible] = useState(false);
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const toggleLabel = visible ? "Hide password" : "Show password";

  const field = (
    <div className="relative">
      <Input
        id={inputId}
        type={visible ? "text" : "password"}
        floating={floating}
        label={floating ? label : undefined}
        labelClassName={labelClassName}
        className={cn("pr-12", className)}
        {...props}
      />
      <Tooltip content={toggleLabel} side="left">
        <button
          type="button"
          aria-label={toggleLabel}
          aria-pressed={visible}
          onClick={() => setVisible((current) => !current)}
          className="absolute top-1/2 right-1.5 inline-flex size-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-[10px] text-muted-foreground transition-colors hover:bg-cloud hover:text-deep-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deep-navy"
        >
          {visible ? (
            <EyeOff className="size-5" strokeWidth={1.75} aria-hidden />
          ) : (
            <Eye className="size-5" strokeWidth={1.75} aria-hidden />
          )}
        </button>
      </Tooltip>
    </div>
  );

  if (label && !floating) {
    return (
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={inputId}>{label}</Label>
        {field}
      </div>
    );
  }

  return field;
}
