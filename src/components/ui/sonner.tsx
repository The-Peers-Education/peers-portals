"use client"

import type { CSSProperties, ReactNode } from "react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { AlertCircle, Check, Info, LoaderCircle, X } from "lucide-react"

function CircleGlyph({
  children,
  className,
}: {
  children: ReactNode
  className: string
}) {
  return (
    <span
      className={`inline-flex size-6 shrink-0 items-center justify-center rounded-full ${className}`}
      aria-hidden
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
      position="bottom-right"
      icons={{
        success: (
          <CircleGlyph className="bg-deep-navy text-white">
            <Check className="size-3.5" strokeWidth={3} />
          </CircleGlyph>
        ),
        info: <Info className="size-6 text-deep-navy" strokeWidth={2} />,
        warning: <AlertCircle className="size-6 text-deep-navy" strokeWidth={2} />,
        error: <X className="size-6 text-deep-navy" strokeWidth={2} />,
        loading: <LoaderCircle className="size-6 animate-spin text-deep-navy" strokeWidth={2} />,
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
