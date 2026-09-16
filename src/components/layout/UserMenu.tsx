"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, CircleUser, LogOut } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { portalPath } from "@/lib/paths";
import { useAuthStore } from "@/lib/store";
import { clickable, focusRing } from "@/lib/styles";
import { cn, displayUserName } from "@/lib/utils";

function ProfileIcon({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-marigold text-deep-navy",
        className,
      )}
    >
      <CircleUser className="size-5" strokeWidth={1.75} aria-hidden />
    </span>
  );
}

export function UserMenu() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const name = displayUserName(user);

  function logout() {
    clearAuth();
    toast.success("Signed out");
    router.replace("/login");
  }

  if (!user) return null;

  const pillClass = cn(
    "hidden max-w-[16rem] items-center gap-2 rounded-[10px] px-2 py-1.5 text-left lg:inline-flex",
    clickable,
    focusRing,
    "hover:bg-cloud",
  );

  return (
    <div className="hidden items-center lg:flex">
      {user.role === "PARENT" ? (
        <p className={pillClass}>
          <ProfileIcon className="size-8" />
          <span className="min-w-0 truncate text-[15px] font-medium text-deep-navy">{name}</span>
        </p>
      ) : (
        <Link href={portalPath(user.role, "/profile")} className={pillClass} aria-label="Open my profile">
          <ProfileIcon className="size-8" />
          <span className="min-w-0 truncate text-[15px] font-medium text-deep-navy">{name}</span>
        </Link>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            "inline-flex size-8 items-center justify-center rounded-[10px] text-deep-navy",
            clickable,
            focusRing,
            "hover:bg-cloud",
          )}
          aria-label="Account options"
        >
          <ChevronDown className="size-5" strokeWidth={1.75} />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" avoidCollisions className="w-44 min-w-44">
          <DropdownMenuItem className="cursor-pointer gap-2 px-2 py-2 text-[15px] no-underline" onSelect={logout}>
            <LogOut className="size-5" strokeWidth={1.75} />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
