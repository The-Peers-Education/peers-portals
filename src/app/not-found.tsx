import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page not found",
};

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background px-6 py-16 text-center">
      <Image
        src="/logo.png"
        alt="The Peers Education System"
        width={200}
        height={52}
        className="h-12 w-auto object-contain"
        priority
      />
      <div className="flex max-w-md flex-col gap-2">
        <p className="text-sm font-semibold tracking-wide text-marigold">404</p>
        <h1 className="font-display text-2xl font-semibold text-deep-navy">Page not found</h1>
        <p className="text-sm text-muted-foreground">
          This address is not part of the school portal. Check the link, or go back to sign in.
        </p>
      </div>
      <Link
        href="/"
        className="inline-flex h-11 items-center justify-center rounded-[10px] bg-deep-navy px-4 text-[15px] text-white hover:bg-[#142c47]"
      >
        Back to portal
      </Link>
    </div>
  );
}
