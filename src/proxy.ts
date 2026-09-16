import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE, ROLE_COOKIE } from "@/lib/cookies";
import {
  isLegacyPortalPrefix,
  isRole,
  isStaffAppPath,
  matchPortalPrefix,
  portalBase,
  toAppPathname,
} from "@/lib/paths";
import type { Role } from "@/types";

const INTERNAL_REWRITE = "x-peers-internal-rewrite";

function roleFromRequest(request: NextRequest): Role | null {
  const value = request.cookies.get(ROLE_COOKIE)?.value;
  return isRole(value) ? value : null;
}

function withPortal(pathname: string, role: Role | null) {
  const appPath = toAppPathname(pathname);
  const rest =
    appPath === "/parent/dashboard" || appPath.startsWith("/parent/")
      ? appPath.slice("/parent".length) || "/dashboard"
      : appPath;
  return `${portalBase(role)}${rest.startsWith("/") ? rest : `/${rest}`}`;
}

export function proxy(request: NextRequest) {
  if (request.headers.get(INTERNAL_REWRITE) === "1") {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  const { pathname } = url;
  const isAuthed = request.cookies.has(AUTH_COOKIE);
  const role = roleFromRequest(request);
  const home = `${portalBase(role)}/dashboard`;

  if (pathname === "/") {
    url.pathname = isAuthed ? home : "/login";
    return NextResponse.redirect(url);
  }

  const prefix = matchPortalPrefix(pathname);

  if (pathname === prefix) {
    url.pathname = `${prefix}/dashboard`;
    return NextResponse.redirect(url);
  }

  if (isStaffAppPath(pathname)) {
    url.pathname = `${portalBase(role)}${pathname}`;
    return NextResponse.redirect(url);
  }

  if (isLegacyPortalPrefix(prefix)) {
    url.pathname = withPortal(pathname, role);
    return NextResponse.redirect(url);
  }

  const isProtected = Boolean(prefix);

  if (isProtected && !isAuthed) {
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (pathname === "/login" && isAuthed) {
    url.pathname = home;
    return NextResponse.redirect(url);
  }

  if (prefix) {
    const appPath = toAppPathname(pathname);
    if (appPath === pathname) {
      return NextResponse.next();
    }
    url.pathname = appPath;
    const headers = new Headers(request.headers);
    headers.set(INTERNAL_REWRITE, "1");
    return NextResponse.rewrite(url, { request: { headers } });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
