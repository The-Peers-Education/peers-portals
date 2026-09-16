"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, CirclePlus, UserCog } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { EmptyHint, PageHeader } from "@/components/shared/PageHeader";
import { PageShell } from "@/components/shared/PageShell";
import { TableSkeleton } from "@/components/shared/Skeleton";
import { Field } from "@/components/shared/Field";
import { PasswordInput } from "@/components/shared/PasswordInput";
import { authApi, staffApi } from "@/lib/api";
import { canManageStaff, ROLE_LABELS } from "@/lib/rbac";
import { portalPath } from "@/lib/paths";
import { useAuthStore } from "@/lib/store";
import { formatDate, getErrorMessage } from "@/lib/utils";
import type { Role, User } from "@/types";

const INVITE_ROLES: Role[] = ["BRANCH_ADMIN", "ACCOUNTANT", "TEACHER"];

export default function StaffPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const branchId = useAuthStore((state) => state.activeBranchId ?? state.user?.branchId);
  const canManage = canManageStaff(user?.role);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "TEACHER" as Role,
  });

  const staffQuery = useQuery({
    queryKey: ["staff", branchId],
    queryFn: staffApi.list,
    enabled: canManage && Boolean(branchId || user?.role === "SUPER_ADMIN"),
  });

  const inviteMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: async () => {
      toast.success("Team member invited");
      setOpen(false);
      setForm({ fullName: "", email: "", password: "", role: "TEACHER" });
      await queryClient.invalidateQueries({ queryKey: ["staff", branchId] });
    },
    onError: (error) => toast.error(getErrorMessage(error, "Unable to invite staff")),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { role?: Role; isActive?: boolean } }) =>
      staffApi.update(id, payload),
    onSuccess: async () => {
      toast.success("Staff member updated");
      await queryClient.invalidateQueries({ queryKey: ["staff", branchId] });
    },
    onError: (error) => toast.error(getErrorMessage(error, "Unable to update staff")),
  });

  const columns: DataTableColumn<User>[] = [
    {
      key: "name",
      header: "Name",
      className: "min-w-0 w-[16%]",
      cell: (row) => (
        <Link href={portalPath(user?.role, `/staff/${row.id}`)} className="block truncate font-medium text-deep-navy">
          {row.fullName?.trim() || "—"}
        </Link>
      ),
    },
    {
      key: "email",
      header: "Email",
      className: "min-w-0 w-[22%]",
      cell: (row) => (
        <span className="block truncate" title={row.email}>
          {row.email}
        </span>
      ),
    },
    {
      key: "role",
      header: "Role",
      className: "w-[12rem]",
      cell: (row) =>
        row.id === user?.id || row.role === "SUPER_ADMIN" ? (
          <span>{ROLE_LABELS[row.role]}</span>
        ) : (
          <Select
            value={row.role}
            onValueChange={(value) =>
              updateMutation.mutate({ id: row.id, payload: { role: value as Role } })
            }
          >
            <SelectTrigger className="h-10 w-full max-w-[10rem]" aria-label={`Role for ${row.fullName?.trim() || row.email}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {INVITE_ROLES.map((role) => (
                <SelectItem key={role} value={role}>
                  {ROLE_LABELS[role]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ),
    },
    {
      key: "campus",
      header: "Campus",
      className: "min-w-0 w-[18%]",
      cell: (row) => {
        const campus = row.branch?.name ?? (row.role === "SUPER_ADMIN" ? "All campuses" : "—");
        return (
          <span className="block truncate" title={campus}>
            {campus}
          </span>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      className: "w-[6.5rem]",
      cell: (row) => (
        <Badge variant={row.isActive === false ? "secondary" : "default"}>
          {row.isActive === false ? "Inactive" : "Active"}
        </Badge>
      ),
    },
    { key: "joined", header: "Joined", className: "w-[8rem]", cell: (row) => formatDate(row.createdAt) },
    {
      key: "actions",
      header: "",
      className: "w-[12rem] text-right",
      cell: (row) => (
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="outline" asChild>
            <Link href={portalPath(user?.role, `/staff/${row.id}`)}>Profile</Link>
          </Button>
          {row.id === user?.id || row.role === "SUPER_ADMIN" ? null : (
            <Button
              size="sm"
              variant="outline"
              disabled={updateMutation.isPending}
              onClick={() =>
                updateMutation.mutate({
                  id: row.id,
                  payload: { isActive: row.isActive === false },
                })
              }
            >
              {row.isActive === false ? "Activate" : "Deactivate"}
            </Button>
          )}
        </div>
      ),
    },
  ];

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    inviteMutation.mutate({
      fullName: form.fullName.trim(),
      email: form.email,
      password: form.password,
      role: form.role,
      branchId: branchId ?? undefined,
    });
  }

  if (!canManage) {
    return (
      <EmptyHint
        icon={UserCog}
        title="Staff directory is restricted"
        description="Only Super Admins and Branch Admins can manage the team."
      />
    );
  }

  if (!branchId && user?.role !== "SUPER_ADMIN") {
    return (
      <EmptyHint
        icon={Building2}
        title="Select a branch"
        description="Choose a campus to manage its staff directory."
      />
    );
  }

  return (
    <PageShell>
      <PageHeader
        title="Staff & team"
        description="Invite campus staff and keep roles aligned with their duties."
        action={
          <Button onClick={() => setOpen(true)}>
            <CirclePlus className="size-5" strokeWidth={1.75} />
            Invite staff
          </Button>
        }
      />

      {staffQuery.isLoading ? (
        <TableSkeleton rows={5} cols={6} />
      ) : (
        <DataTable
          columns={columns}
          data={staffQuery.data ?? []}
          rowKey={(row) => row.id}
          empty="No staff members found for this campus."
          tableClassName="table-fixed"
        />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite team member</DialogTitle>
            <DialogDescription>
              Create a staff account for this campus. They can sign in to the staff portal immediately.
            </DialogDescription>
          </DialogHeader>
          <form className="grid gap-3" onSubmit={onSubmit}>
            <Input
              id="staff-name"
              label="Name"
              required
              value={form.fullName}
              onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
            />
            <Input
              id="staff-email"
              label="Email"
              type="email"
              required
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            />
            <PasswordInput
              id="staff-password"
              label="Password"
              autoComplete="new-password"
              required
              minLength={8}
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            />
            <Field id="staff-role" label="Role">
              <Select
                value={form.role}
                onValueChange={(value) => setForm((current) => ({ ...current, role: value as Role }))}
              >
                <SelectTrigger id="staff-role" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INVITE_ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {ROLE_LABELS[role]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={inviteMutation.isPending}>
                {inviteMutation.isPending ? "Inviting…" : "Send invite"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
