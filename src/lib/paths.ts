import type { Role } from "@/types";

export const ROLE_PORTAL_SLUG: Record<Role, string> = {
  SUPER_ADMIN: "super-admin",
  BRANCH_ADMIN: "branch-admin",
  ACCOUNTANT: "accountant",
  TEACHER: "teacher",
  PARENT: "parent",
};

export const LEGACY_PORTAL_PREFIXES = [
  "/super-admin-portal",
  "/branch-admin-portal",
  "/accountant-portal",
  "/teacher-portal",
  "/parent-portal",
  "/staff-portal",
] as const;

export const PORTAL_BASES = Object.values(ROLE_PORTAL_SLUG).map((slug) => `/${slug}`);

const ALL_PREFIXES = [...PORTAL_BASES, ...LEGACY_PORTAL_PREFIXES].sort(
  (a, b) => b.length - a.length,
);

export const STAFF_APP_PREFIXES = [
  "/dashboard",
  "/students",
  "/staff",
  "/attendance",
  "/academics",
  "/timetable",
  "/fees",
  "/payroll",
  "/expenses",
  "/admissions",
  "/profile",
  "/settings",
  "/library",
] as const;

const ROLE_BY_SLUG = Object.fromEntries(
  Object.entries(ROLE_PORTAL_SLUG).map(([role, slug]) => [slug, role]),
) as Record<string, Role>;

const LEGACY_SLUG_TO_ROLE: Record<string, Role | undefined> = {
  "super-admin-portal": "SUPER_ADMIN",
  "branch-admin-portal": "BRANCH_ADMIN",
  "accountant-portal": "ACCOUNTANT",
  "teacher-portal": "TEACHER",
  "parent-portal": "PARENT",
  "staff-portal": undefined,
};

export function portalBase(role?: Role | null) {
  if (!role) return `/${ROLE_PORTAL_SLUG.TEACHER}`;
  return `/${ROLE_PORTAL_SLUG[role]}`;
}

export function isRole(value: string | undefined | null): value is Role {
  return Boolean(value && value in ROLE_PORTAL_SLUG);
}

export function portalPath(role: Role | null | undefined, path = "/dashboard") {
  let normalized = path.startsWith("/") ? path : `/${path}`;
  if (normalized === "/parent" || normalized.startsWith("/parent/")) {
    normalized = normalized.slice("/parent".length) || "/dashboard";
  }
  return `${portalBase(role)}${normalized}`;
}

export function isStaffAppPath(pathname: string) {
  return STAFF_APP_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function matchPortalPrefix(pathname: string) {
  return ALL_PREFIXES.find((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)) ?? null;
}

export function isLegacyPortalPrefix(prefix: string | null) {
  return Boolean(prefix && (LEGACY_PORTAL_PREFIXES as readonly string[]).includes(prefix));
}

export function toAppPathname(pathname: string) {
  const prefix = matchPortalPrefix(pathname);
  if (!prefix) return pathname;

  const rest = pathname.slice(prefix.length) || "/dashboard";
  const inner = rest.startsWith("/") ? rest : `/${rest}`;
  const slug = prefix.slice(1);
  const role = ROLE_BY_SLUG[slug] ?? LEGACY_SLUG_TO_ROLE[slug];

  if (role === "PARENT") {
    if (inner === "/" || inner === "/dashboard") return "/parent/dashboard";
    return `/parent${inner}`;
  }

  return inner === "/" ? "/dashboard" : inner;
}
