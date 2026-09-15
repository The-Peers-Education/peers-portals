import {
  Banknote,
  CalendarCheck,
  LayoutGrid,
  UserCog,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@/types";
import { ROUTE_ROLES } from "@/lib/rbac";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  roles: Role[];
}

export const NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    label: "Overview",
    icon: LayoutGrid,
    roles: ROUTE_ROLES["/dashboard"],
  },
  {
    href: "/students",
    label: "Students",
    icon: Users,
    roles: ROUTE_ROLES["/students"],
  },
  {
    href: "/staff",
    label: "Staff",
    icon: UserCog,
    roles: ROUTE_ROLES["/staff"],
  },
  {
    href: "/attendance",
    label: "Attendance",
    icon: CalendarCheck,
    roles: ROUTE_ROLES["/attendance"],
  },
  {
    href: "/fees",
    label: "Fees",
    icon: Banknote,
    roles: ROUTE_ROLES["/fees"],
  },
  {
    href: "/expenses",
    label: "Expenses",
    icon: Wallet,
    roles: ROUTE_ROLES["/expenses"],
  },
];
