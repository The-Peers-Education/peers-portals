"use client";

import { FormEvent, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/shared/PasswordInput";
import { authApi } from "@/lib/api";
import { getErrorMessage } from "@/lib/utils";

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "New password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Confirm your new password"),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: "New password and confirmation do not match",
    path: ["confirmPassword"],
  })
  .refine((value) => value.newPassword !== value.currentPassword, {
    message: "New password must be different from the current password",
    path: ["newPassword"],
  });

type PasswordForm = z.infer<typeof changePasswordSchema>;
type FieldErrors = Partial<Record<keyof PasswordForm, string>>;

const EMPTY_FORM: PasswordForm = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

export function PasswordChangeForm() {
  const [form, setForm] = useState<PasswordForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});

  const mutation = useMutation({
    mutationFn: authApi.changePassword,
    onSuccess: () => {
      toast.success("Password updated");
      setForm(EMPTY_FORM);
      setErrors({});
    },
    onError: (error) => toast.error(getErrorMessage(error, "Unable to update password")),
  });

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = changePasswordSchema.safeParse(form);
    if (!parsed.success) {
      const next: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (key === "currentPassword" || key === "newPassword" || key === "confirmPassword") {
          next[key] ??= issue.message;
        }
      }
      setErrors(next);
      return;
    }
    setErrors({});
    mutation.mutate(parsed.data);
  }

  return (
    <form className="grid max-w-md gap-4" onSubmit={onSubmit} noValidate>
      <div className="grid gap-1.5">
        <PasswordInput
          id="current-password"
          label="Current password"
          autoComplete="current-password"
          value={form.currentPassword}
          aria-invalid={Boolean(errors.currentPassword)}
          onChange={(event) =>
            setForm((current) => ({ ...current, currentPassword: event.target.value }))
          }
        />
        {errors.currentPassword ? (
          <p className="text-sm text-destructive">{errors.currentPassword}</p>
        ) : null}
      </div>
      <div className="grid gap-1.5">
        <PasswordInput
          id="new-password"
          label="New password"
          autoComplete="new-password"
          value={form.newPassword}
          aria-invalid={Boolean(errors.newPassword)}
          onChange={(event) =>
            setForm((current) => ({ ...current, newPassword: event.target.value }))
          }
        />
        {errors.newPassword ? (
          <p className="text-sm text-destructive">{errors.newPassword}</p>
        ) : null}
      </div>
      <div className="grid gap-1.5">
        <PasswordInput
          id="confirm-password"
          label="Confirm new password"
          autoComplete="new-password"
          value={form.confirmPassword}
          aria-invalid={Boolean(errors.confirmPassword)}
          onChange={(event) =>
            setForm((current) => ({ ...current, confirmPassword: event.target.value }))
          }
        />
        {errors.confirmPassword ? (
          <p className="text-sm text-destructive">{errors.confirmPassword}</p>
        ) : null}
      </div>
      <Button type="submit" disabled={mutation.isPending} className="w-fit">
        {mutation.isPending ? "Updating…" : "Update password"}
      </Button>
    </form>
  );
}
