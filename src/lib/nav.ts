import {
  Banknote,
  CalendarCheck,
  CalendarRange,
  ClipboardList,
  GraduationCap,
  LayoutGrid,
  Receipt,
  UserCog,
  Users,
  UserRound,
  CircleUser,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@/types";
import { ROUTE_ROLES } from "@/lib/rbac";

export interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
  roles: Role[];
}

export const NAV_ITEMS: NavItem[] = [
  {
    path: "/parent/dashboard",
    label: "My children",
    icon: UserRound,
    roles: ROUTE_ROLES["/parent"],
  },
  {
    path: "/dashboard",
    label: "Overview",
    icon: LayoutGrid,
    roles: ROUTE_ROLES["/dashboard"],
  },
  {
    path: "/students",
    label: "Students",
    icon: Users,
    roles: ROUTE_ROLES["/students"],
  },
  {
    path: "/staff",
    label: "Staff",
    icon: UserCog,
    roles: ROUTE_ROLES["/staff"],
  },
  {
    path: "/attendance",
    label: "Attendance",
    icon: CalendarCheck,
    roles: ROUTE_ROLES["/attendance"],
  },
  {
    path: "/academics",
    label: "Academics",
    icon: GraduationCap,
    roles: ROUTE_ROLES["/academics"],
  },
  {
    path: "/timetable",
    label: "Timetable",
    icon: CalendarRange,
    roles: ROUTE_ROLES["/timetable"],
  },
  {
    path: "/fees",
    label: "Fees",
    icon: Banknote,
    roles: ROUTE_ROLES["/fees"],
  },
  {
    path: "/payroll",
    label: "Payroll",
    icon: Receipt,
    roles: ROUTE_ROLES["/payroll"],
  },
  {
    path: "/expenses",
    label: "Expenses",
    icon: Wallet,
    roles: ROUTE_ROLES["/expenses"],
  },
  {
    path: "/admissions",
    label: "Admissions",
    icon: ClipboardList,
    roles: ROUTE_ROLES["/admissions"],
  },
  {
    path: "/profile",
    label: "My profile",
    icon: CircleUser,
    roles: ROUTE_ROLES["/profile"],
  },
];
