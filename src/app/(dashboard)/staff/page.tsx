"use client";

import { FormEvent, useState } from "react";
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
import { PasswordInput } from "@/components/shared/PasswordInput";
import { authApi, staffApi } from "@/lib/api";
import { canManageStaff, ROLE_LABELS } from "@/lib/rbac";
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
      setForm({ email: "", password: "", role: "TEACHER" });
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
    { key: "email", header: "Email", cell: (row) => <span className="font-medium">{row.email}</span> },
    {
      key: "role",
      header: "Role",
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
            <SelectTrigger className="h-10 w-44" aria-label={`Role for ${row.email}`}>
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
      cell: (row) => row.branch?.name ?? (row.role === "SUPER_ADMIN" ? "All campuses" : "—"),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => (
        <Badge variant={row.isActive === false ? "secondary" : "default"}>
          {row.isActive === false ? "Inactive" : "Active"}
        </Badge>
      ),
    },
    { key: "joined", header: "Joined", cell: (row) => formatDate(row.createdAt) },
    {
      key: "actions",
      header: "",
      className: "text-right",
      cell: (row) =>
        row.id === user?.id || row.role === "SUPER_ADMIN" ? null : (
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
        ),
    },
  ];

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    inviteMutation.mutate({
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
            <CirclePlus className="size-4" strokeWidth={1.75} />
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
              id="staff-email"
              label="Email"
              type="email"
              required
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            />
            <PasswordInput
              id="staff-password"
              label="Temporary password"
              autoComplete="new-password"
              required
              minLength={8}
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            />
            <Select
              value={form.role}
              onValueChange={(value) => setForm((current) => ({ ...current, role: value as Role }))}
            >
              <SelectTrigger className="w-full" aria-label="Staff role">
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
