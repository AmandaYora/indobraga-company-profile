import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Edit2, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ErrorState, LoadingState } from "@/components/admin/ApiState";
import { ConfirmDialog, CrudModal, Field, Select, TextInput } from "@/components/admin/CrudModal";
import { EmptyState, TablePagination } from "@/components/admin/Pagination";
import { Card, PageTitle, PrimaryButton, StatusBadge } from "@/components/admin/ui";
import { useApiQuery } from "@/hooks/use-api-query";
import type { AdminUser } from "@/lib/api-models";
import { adminUsersApi } from "@/lib/api-services";
import { formatDateId } from "@/lib/date";

export const Route = createFileRoute("/admin/users")({ component: UsersAdminPage });

function UsersAdminPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("all");
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [target, setTarget] = useState<AdminUser | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "content_editor",
    temporary_password: "",
  });
  const loadUsers = useCallback(
    () =>
      adminUsersApi.list({
        page,
        limit: pageSize,
        search: query,
        role: role === "all" ? undefined : role,
      }),
    [page, pageSize, query, role],
  );
  const users = useApiQuery(["admin", "users", page, pageSize, query, role], loadUsers);
  const list = users.data?.items ?? [];
  const pagination = users.data?.pagination;
  const start =
    pagination && pagination.total > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0;
  const end = pagination ? Math.min(pagination.page * pagination.limit, pagination.total) : 0;

  useEffect(() => {
    setPage(1);
  }, [pageSize, query, role]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", email: "", role: "content_editor", temporary_password: "" });
    setOpenForm(true);
  };

  const openEdit = (user: AdminUser) => {
    setEditing(user);
    setForm({
      name: user.name,
      email: user.email,
      role: user.role,
      temporary_password: "",
    });
    setOpenForm(true);
  };

  const submit = async () => {
    try {
      if (editing) {
        await adminUsersApi.update(editing.id, { name: form.name, role: form.role });
      } else {
        await adminUsersApi.create(form);
      }
      toast.success(editing ? "Pengguna diperbarui" : "Pengguna ditambahkan");
      setOpenForm(false);
      users.reload();
    } catch (error) {
      toast.error("Pengguna gagal disimpan", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  };

  const toggleStatus = async (user: AdminUser) => {
    try {
      await adminUsersApi.updateStatus(user.id, user.status === "active" ? "inactive" : "active");
      toast.success("Status pengguna diperbarui");
      users.reload();
    } catch (error) {
      toast.error("Status gagal diperbarui", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  };

  const remove = async () => {
    if (!target) {
      return;
    }
    try {
      await adminUsersApi.remove(target.id);
      toast.success("Pengguna dinonaktifkan");
      setTarget(null);
      users.reload();
    } catch (error) {
      toast.error("Pengguna gagal dinonaktifkan", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  };

  return (
    <>
      <PageTitle
        title="Pengguna"
        desc="Kelola akun admin dan role akses panel."
        action={
          <PrimaryButton onClick={openCreate}>
            <Plus className="h-4 w-4" /> Tambah Pengguna
          </PrimaryButton>
        }
      />
      <Card className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-0 flex-1 basis-full sm:basis-auto">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari nama atau email..."
            className="w-full rounded-full border border-border bg-secondary py-2 pl-10 pr-4 text-sm outline-none focus:border-primary"
          />
        </div>
        <Select
          value={role}
          onChange={(event) => setRole(event.target.value)}
          className="w-full sm:w-56"
        >
          <option value="all">Semua role</option>
          <option value="super_admin">Super Admin</option>
          <option value="content_editor">Content Editor</option>
        </Select>
      </Card>

      {users.loading && !users.data && <LoadingState label="Memuat pengguna..." />}
      {users.error && <ErrorState error={users.error} onRetry={users.reload} />}

      <div className="grid gap-4 lg:hidden">
        {list.length === 0 && !users.loading && (
          <Card>
            <EmptyState
              title="Tidak ada pengguna"
              description="Coba filter atau kata kunci lain."
            />
          </Card>
        )}
        {list.map((user) => (
          <Card key={user.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-anywhere font-semibold">{user.name}</p>
                <p className="text-anywhere text-xs text-muted-foreground">{user.email}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {user.role === "super_admin" ? "Super Admin" : "Content Editor"}
                </p>
              </div>
              <StatusBadge status={user.status} />
            </div>
            <UserActions
              user={user}
              onEdit={() => openEdit(user)}
              onToggle={() => toggleStatus(user)}
              onDelete={() => setTarget(user)}
            />
          </Card>
        ))}
      </div>

      <Card className="hidden overflow-hidden p-0 lg:block">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="p-4 text-left">Pengguna</th>
              <th className="p-4 text-left">Role</th>
              <th className="p-4 text-left">Login Terakhir</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {list.map((user) => (
              <tr key={user.id} className="hover:bg-secondary/40">
                <td className="p-4">
                  <p className="font-semibold">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </td>
                <td className="p-4">
                  {user.role === "super_admin" ? "Super Admin" : "Content Editor"}
                </td>
                <td className="p-4 text-muted-foreground">
                  {user.last_login_at ? formatDateId(user.last_login_at, "short") : "-"}
                </td>
                <td className="p-4">
                  <StatusBadge status={user.status} />
                </td>
                <td className="p-4 text-right">
                  <UserActions
                    user={user}
                    onEdit={() => openEdit(user)}
                    onToggle={() => toggleStatus(user)}
                    onDelete={() => setTarget(user)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.length === 0 && !users.loading && (
          <EmptyState title="Tidak ada pengguna" description="Coba filter atau kata kunci lain." />
        )}
      </Card>

      {pagination && (
        <div className="mt-3">
          <TablePagination
            page={pagination.page}
            pageCount={pagination.total_pages}
            pageSize={pagination.limit}
            total={pagination.total}
            start={start}
            end={end}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            itemLabel="pengguna"
            className="rounded-xl border bg-card"
          />
        </div>
      )}

      <CrudModal
        open={openForm}
        onOpenChange={setOpenForm}
        title={editing ? "Ubah Pengguna" : "Tambah Pengguna"}
        description="Akun admin memakai session cookie HTTP-only dari backend."
        onSubmit={submit}
        size="md"
      >
        <Field label="Nama" required>
          <TextInput
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </Field>
        {!editing && (
          <Field label="Email" required>
            <TextInput
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </Field>
        )}
        <Field label="Role">
          <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="super_admin">Super Admin</option>
            <option value="content_editor">Content Editor</option>
          </Select>
        </Field>
        {!editing && (
          <Field label="Password Sementara" required>
            <TextInput
              type="password"
              value={form.temporary_password}
              onChange={(e) => setForm({ ...form, temporary_password: e.target.value })}
            />
          </Field>
        )}
      </CrudModal>

      <ConfirmDialog
        open={Boolean(target)}
        onOpenChange={(open) => !open && setTarget(null)}
        title={target ? `Nonaktifkan ${target.name}?` : "Nonaktifkan pengguna?"}
        description="Session aktif pengguna akan dicabut oleh backend."
        confirmLabel="Nonaktifkan"
        onConfirm={remove}
      />
    </>
  );
}

function UserActions({
  user,
  onEdit,
  onToggle,
  onDelete,
}: {
  user: AdminUser;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="mt-3 inline-flex flex-wrap gap-1 lg:mt-0">
      <button
        aria-label={`Ubah pengguna ${user.name}`}
        title="Ubah"
        onClick={onEdit}
        className="rounded-md p-2 hover:bg-secondary"
      >
        <Edit2 className="h-4 w-4" />
      </button>
      <button
        aria-label={`Ubah status pengguna ${user.name}`}
        title="Ubah status"
        onClick={onToggle}
        className="rounded-md px-2 py-1 text-xs font-semibold text-primary hover:bg-primary-soft"
      >
        Status
      </button>
      <button
        aria-label={`Nonaktifkan pengguna ${user.name}`}
        title="Nonaktifkan"
        onClick={onDelete}
        className="rounded-md p-2 text-destructive hover:bg-destructive/10"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
