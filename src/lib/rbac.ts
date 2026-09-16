import type { Role } from "@/types";

export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: "Super Admin",
  BRANCH_ADMIN: "Branch Admin",
  ACCOUNTANT: "Accountant",
  TEACHER: "Teacher",
  PARENT: "Parent",
};

export const STAFF_ROLES: Role[] = [
  "SUPER_ADMIN",
  "BRANCH_ADMIN",
  "ACCOUNTANT",
  "TEACHER",
];

export function isStaffRole(role?: Role | null) {
  return Boolean(role && STAFF_ROLES.includes(role));
}

export const ROUTE_ROLES: Record<string, Role[]> = {
  "/dashboard": STAFF_ROLES,
  "/students": STAFF_ROLES,
  "/staff": ["SUPER_ADMIN", "BRANCH_ADMIN"],
  "/attendance": ["SUPER_ADMIN", "BRANCH_ADMIN", "TEACHER"],
  "/academics": ["SUPER_ADMIN", "BRANCH_ADMIN", "TEACHER"],
  "/timetable": ["SUPER_ADMIN", "BRANCH_ADMIN", "TEACHER"],
  "/fees": ["SUPER_ADMIN", "BRANCH_ADMIN", "ACCOUNTANT"],
  "/payroll": ["SUPER_ADMIN", "BRANCH_ADMIN", "ACCOUNTANT"],
  "/expenses": ["SUPER_ADMIN", "BRANCH_ADMIN", "ACCOUNTANT"],
};

export function canAccessRoute(pathname: string, role?: Role | null) {
  if (!role) return false;
  const match = Object.keys(ROUTE_ROLES)
    .sort((a, b) => b.length - a.length)
    .find((route) => pathname === route || pathname.startsWith(`${route}/`));
  if (!match) return true;
  return ROUTE_ROLES[match].includes(role);
}

export function canRegisterStudents(role?: Role | null) {
  return role === "SUPER_ADMIN" || role === "BRANCH_ADMIN";
}

export function canManageStaff(role?: Role | null) {
  return canRegisterStudents(role);
}

export function canManageFees(role?: Role | null) {
  return role === "SUPER_ADMIN" || role === "BRANCH_ADMIN" || role === "ACCOUNTANT";
}

export function canManageExpenses(role?: Role | null) {
  return canManageFees(role);
}

export function canMarkAttendance(role?: Role | null) {
  return role === "SUPER_ADMIN" || role === "BRANCH_ADMIN" || role === "TEACHER";
}

export function canManageAcademics(role?: Role | null) {
  return role === "SUPER_ADMIN" || role === "BRANCH_ADMIN";
}

export function canEnterGrades(role?: Role | null) {
  return canMarkAttendance(role);
}

export function canManageTimetable(role?: Role | null) {
  return canManageAcademics(role);
}

export function canManagePayroll(role?: Role | null) {
  return canManageFees(role);
}

export function canSubmitLeave(role?: Role | null) {
  return isStaffRole(role);
}
