import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { Slot } from "radix-ui"
import { clickable, ease, focusRing } from "@/lib/styles"

const buttonVariants = cva(
  cn(
    "group/button inline-flex shrink-0 items-center justify-center rounded-[10px] border border-transparent bg-clip-padding text-[15px] font-normal whitespace-nowrap select-none",
    clickable,
    ease,
    focusRing,
    "disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
  ),
  {
    variants: {
      variant: {
        default: "bg-deep-navy text-white hover:bg-[#142c47]",
        outline:
          "border-deep-navy/15 bg-white text-deep-navy hover:bg-cloud aria-expanded:bg-cloud",
        secondary:
          "bg-marigold text-deep-navy hover:bg-[#d88d16]",
        ghost:
          "bg-transparent text-deep-navy hover:bg-cloud",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20",
        link: "text-deep-navy underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 min-h-11 gap-2 px-4",
        xs: "h-9 min-h-9 gap-1 px-2.5",
        sm: "h-10 min-h-10 gap-1.5 px-3",
        lg: "h-12 min-h-12 gap-2 px-5",
        icon: "size-11",
        "icon-xs": "size-9",
        "icon-sm": "size-10",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
