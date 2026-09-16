import * as React from "react"
import { cn } from "cn"
import { controlField, controlFieldFloating, ease, floatingLabel, focusField } from "@/lib/styles"

function Input({
  className,
  type,
  label,
  labelClassName,
  id,
  placeholder,
  ...props
}: React.ComponentProps<"input"> & { label?: string; labelClassName?: string }) {
  const input = (
    <input
      id={id}
      type={type}
      data-slot="input"
      placeholder={label ? " " : placeholder}
      className={cn(
        label ? controlFieldFloating : controlField,
        ease,
        focusField,
        "transition-[border-color] focus:border-[#1b3a5c] focus-visible:border-[#1b3a5c] file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-base file:font-medium file:text-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-cloud disabled:opacity-50 aria-invalid:!border-destructive",
        className
      )}
      {...props}
    />
  )

  if (!label) return input

  return (
    <div className="relative">
      {input}
      <label htmlFor={id} className={cn(floatingLabel, labelClassName)}>
        {label}
      </label>
    </div>
  )
}

export { Input }
