"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2 } from "lucide-react";
import { toast } from "sonner";
import { branchesApi } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/shared/Skeleton";
import { cn } from "@/lib/utils";

export function BranchSwitcher({
  placement = "header",
}: {
  placement?: "header" | "sidebar";
}) {
  const user = useAuthStore((state) => state.user);
  const activeBranchId = useAuthStore((state) => state.activeBranchId);
  const setActiveBranchId = useAuthStore((state) => state.setActiveBranchId);
  const queryClient = useQueryClient();
  const inSidebar = placement === "sidebar";

  const { data: branches = [], isLoading } = useQuery({
    queryKey: ["branches"],
    queryFn: branchesApi.list,
    enabled: user?.role === "SUPER_ADMIN",
  });

  const shellClass = inSidebar ? "w-full lg:hidden" : "hidden shrink-0 lg:block";

  if (user?.role !== "SUPER_ADMIN") {
    return (
      <div
        className={cn(
          "flex items-center gap-2 rounded-[10px] border px-3 py-2 text-[15px]",
          inSidebar
            ? "w-full min-w-0 border-white/20 bg-white text-deep-navy lg:hidden"
            : "hidden border-deep-navy/15 bg-white lg:flex",
        )}
      >
        <Building2 className="size-5 shrink-0 text-deep-navy" strokeWidth={1.75} aria-hidden />
        <span className={cn("min-w-0 text-deep-navy", inSidebar ? "truncate" : "whitespace-nowrap")}>
          {user?.branch?.name ?? "Assigned branch"}
        </span>
      </div>
    );
  }

  if (isLoading) {
    return <Skeleton className={cn("h-12", inSidebar ? "w-full lg:hidden" : "hidden w-64 lg:block")} />;
  }

  return (
    <div className={shellClass}>
      <Select
        value={activeBranchId ?? undefined}
        onValueChange={(value) => {
          setActiveBranchId(value);
          const name = branches.find((branch) => branch.id === value)?.name;
          toast.success(name ? `Campus: ${name}` : "Campus updated");
          void queryClient.invalidateQueries();
        }}
      >
        <SelectTrigger
          className={cn(
            "bg-white text-deep-navy [&_svg]:text-deep-navy",
            inSidebar
              ? "h-12 w-full min-w-0 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:block *:data-[slot=select-value]:truncate *:data-[slot=select-value]:whitespace-nowrap"
              : "w-fit *:data-[slot=select-value]:line-clamp-none *:data-[slot=select-value]:whitespace-nowrap",
          )}
          aria-label="Select campus"
        >
          <Building2 className="size-5 shrink-0 text-deep-navy" strokeWidth={1.75} aria-hidden />
          <SelectValue placeholder="Select campus" />
        </SelectTrigger>
        <SelectContent>
          {branches.map((branch) => (
            <SelectItem key={branch.id} value={branch.id}>
              {branch.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
