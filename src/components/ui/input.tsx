"use client"

import * as React from "react"
import { cn } from "cn"
import { Label } from "@/components/ui/label"
import { controlField, controlFieldFloating, ease, floatingLabel, focusField } from "@/lib/styles"

function Input({
  className,
  type,
  label,
  labelClassName,
  id,
  placeholder,
  floating = false,
  ...props
}: React.ComponentProps<"input"> & {
  label?: string
  labelClassName?: string
  floating?: boolean
}) {
  const generatedId = React.useId()
  const inputId = id ?? generatedId

  const input = (
    <input
      id={inputId}
      type={type}
      data-slot="input"
      placeholder={floating && label ? " " : placeholder}
      className={cn(
        floating && label ? controlFieldFloating : controlField,
        ease,
        focusField,
        "transition-[border-color] focus:border-[#1b3a5c] focus-visible:border-[#1b3a5c] file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-base file:font-medium file:text-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-cloud disabled:opacity-50 aria-invalid:!border-destructive",
        className
      )}
      {...props}
    />
  )

  if (label && floating) {
    return (
      <div className="relative">
        {input}
        <label htmlFor={inputId} className={cn(floatingLabel, labelClassName)}>
          {label}
        </label>
      </div>
    )
  }

  if (label) {
    return (
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={inputId}>{label}</Label>
        {input}
      </div>
    )
  }

  return input
}

export { Input }
