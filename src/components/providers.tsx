"use client";

import { useState } from "react";
import { QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getErrorMessage, isReachabilityError } from "@/lib/utils";

let lastReachabilityToastAt = 0;

function notifyReachability(error: unknown) {
  if (!isReachabilityError(error)) return;
  const now = Date.now();
  if (now - lastReachabilityToastAt < 4000) return;
  lastReachabilityToastAt = now;
  toast.error(getErrorMessage(error, "Unable to reach the server"));
}

function createQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: notifyReachability,
    }),
    defaultOptions: {
      queries: {
        staleTime: 20_000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(createQueryClient);

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          {children}
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
