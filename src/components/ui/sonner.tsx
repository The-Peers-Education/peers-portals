"use client"

import type { CSSProperties, ReactNode } from "react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import {
  CircleAlert,
  CircleCheck,
  CircleX,
  Info,
  LoaderCircle,
} from "lucide-react"

function ToastIcon({
  className,
  children,
}: {
  className: string
  children: ReactNode
}) {
  return (
    <span
      className={`flex size-7 shrink-0 items-center justify-center rounded-full ${className}`}
    >
      {children}
    </span>
  )
}

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: (
          <ToastIcon className="bg-leaf/15 text-leaf">
            <CircleCheck className="size-4" strokeWidth={2.25} />
          </ToastIcon>
        ),
        info: (
          <ToastIcon className="bg-deep-navy/10 text-deep-navy">
            <Info className="size-4" strokeWidth={2.25} />
          </ToastIcon>
        ),
        warning: (
          <ToastIcon className="bg-marigold/20 text-deep-navy">
            <CircleAlert className="size-4" strokeWidth={2.25} />
          </ToastIcon>
        ),
        error: (
          <ToastIcon className="bg-red-600/10 text-red-700">
            <CircleX className="size-4" strokeWidth={2.25} />
          </ToastIcon>
        ),
        loading: (
          <ToastIcon className="bg-cloud text-deep-navy">
            <LoaderCircle className="size-4 animate-spin" strokeWidth={2.25} />
          </ToastIcon>
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "rounded-[10px] border-cloud bg-white text-ink",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
