"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FadeIn } from "@/components/ui/animations";
import { PasswordInput } from "@/components/shared/PasswordInput";
import { authApi } from "@/lib/api";
import { homePath, isStaffRole } from "@/lib/rbac";
import { useAuthStore } from "@/lib/store";
import { getErrorMessage } from "@/lib/utils";

const DEMO_ACCOUNTS = [
  { role: "Super Admin", email: "admin@thepeers.edu.pk" },
  { role: "Branch Admin", email: "branchadmin@thepeers.edu.pk" },
  { role: "Accountant", email: "accountant@thepeers.edu.pk" },
  { role: "Teacher", email: "teacher@thepeers.edu.pk" },
  { role: "Parent", email: "parent@thepeers.edu.pk" },
];

export default function LoginPage() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const setUser = useAuthStore((state) => state.setUser);
  const [email, setEmail] = useState("admin@thepeers.edu.pk");
  const [password, setPassword] = useState("Password123!");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const result = await authApi.login({ email, password });
      if (result.user.role !== "PARENT" && !isStaffRole(result.user.role)) {
        toast.error("This account cannot access the portal.");
        return;
      }
      setSession(result.token, result.user);
      try {
        const profile = await authApi.me();
        setUser(profile);
      } catch {
        // Profile enrichment is optional after a successful login.
      }
      toast.success(result.user.role === "PARENT" ? "Welcome to the parent portal" : "Welcome back");
      router.replace(homePath(result.user.role));
    } catch (error) {
      toast.error(getErrorMessage(error, "Unable to sign in"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <FadeIn className="w-full max-w-md">
      <Card className="ring-1 ring-white/15">
        <CardHeader className="items-center text-center">
          <Image
            src="/logo.png"
            alt="The Peers Education System"
            width={200}
            height={52}
            className="mx-auto mb-2 h-12 w-auto object-contain"
            priority
          />
          <CardTitle className="font-display text-xl">School Portal</CardTitle>
          <CardDescription>Sign in with your staff or parent account to continue.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={onSubmit}>
            <Input
              id="email"
              label="Email"
              floating
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <PasswordInput
              id="password"
              label="Password"
              floating
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <div className="mt-5 flex flex-col gap-2 rounded-[10px] border border-cloud bg-paper p-3 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Demo accounts</p>
            <ul className="flex flex-col gap-1.5">
              {DEMO_ACCOUNTS.map((account) => (
                <li key={account.email} className="flex items-center justify-between gap-3">
                  <span>{account.role}</span>
                  <button
                    type="button"
                    className="truncate text-deep-navy underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deep-navy focus-visible:ring-offset-2"
                    onClick={() => setEmail(account.email)}
                  >
                    {account.email}
                  </button>
                </li>
              ))}
            </ul>
            <p>Password: Password123!</p>
          </div>
        </CardContent>
      </Card>
    </FadeIn>
  );
}
