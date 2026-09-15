import { SkipLink } from "@/components/shared/SkipLink";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-deep-navy">
      <SkipLink />
      <div className="absolute inset-x-0 top-0 h-1.5 bg-marigold" />
      <div
        aria-hidden
        className="absolute -top-28 -right-20 h-[28rem] w-[28rem] rounded-full bg-marigold"
      />
      <div
        aria-hidden
        className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-leaf/25"
      />
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.7) 1px, transparent 0)",
          backgroundSize: "22px 22px",
        }}
      />
      <main id="main-content" tabIndex={-1} className="relative flex min-h-screen items-center justify-center p-4 outline-none">
        {children}
      </main>
    </div>
  );
}
