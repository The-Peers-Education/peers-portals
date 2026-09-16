import type { Role } from "@/types";

const SEGMENT_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  students: "Students",
  staff: "Staff",
  attendance: "Attendance",
  academics: "Academics",
  grades: "Gradebook",
  homework: "Homework",
  exams: "Exams",
  classes: "Classes",
  timetable: "Timetable",
  fees: "Fees",
  payroll: "Payroll",
  expenses: "Expenses",
  admissions: "Admissions",
  profile: "My profile",
  settings: "Settings",
  account: "Account",
  library: "Library",
  "report-card": "Report card",
};

export interface Breadcrumb {
  label: string;
  href?: string;
}

function humanize(value: string) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function isRecordId(value: string) {
  return /^c[a-z0-9]{20,}$/i.test(value) || /^[0-9a-f-]{24,}$/i.test(value);
}

export function headerBreadcrumbs(appPath: string, role?: Role | null): Breadcrumb[] {
  const home = role === "PARENT" ? "/parent/dashboard" : "/dashboard";
  const crumbs: Breadcrumb[] = [{ label: "Dashboard", href: home }];
  const path = appPath.replace(/\/$/, "") || home;

  if (path === "/dashboard") {
    return [{ label: "Dashboard" }];
  }
  if (path === "/parent/dashboard") {
    crumbs.push({ label: "My children" });
    return crumbs;
  }

  const parts = path.split("/").filter((part) => part && part !== "parent");
  let href = role === "PARENT" ? "/parent" : "";

  parts.forEach((part, index) => {
    href += `/${part}`;
    const last = index === parts.length - 1;
    const label = isRecordId(part)
      ? parts[0] === "staff"
        ? "Profile"
        : "Details"
      : (SEGMENT_LABELS[part] ?? humanize(part));
    crumbs.push({
      label,
      href: last ? undefined : href,
    });
  });

  return crumbs;
}
