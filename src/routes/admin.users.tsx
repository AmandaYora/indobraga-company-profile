import { createFileRoute } from "@tanstack/react-router";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { Card, PageTitle, PrimaryButton, StatusBadge } from "@/components/admin/ui";
export const Route = createFileRoute("/admin/users")({ component: U });
const users = [
  { name: "Admin Indobraga", email: "admin@indobraga.co.id", role: "Super Admin", status: "connected" },
  { name: "Marketing Lead", email: "marketing@indobraga.co.id", role: "Content Editor", status: "connected" },
  { name: "Sales Officer", email: "sales@indobraga.co.id", role: "Content Editor", status: "connected" },
];
function U() {
  return (<><PageTitle title="Users" desc="Daftar pengguna dashboard." action={<PrimaryButton><Plus className="h-4 w-4" /> Tambah User</PrimaryButton>} /><Card className="overflow-hidden p-0"><table className="w-full text-sm"><thead className="bg-secondary text-xs uppercase tracking-wider text-muted-foreground"><tr><th className="p-4 text-left">Nama</th><th className="p-4 text-left">Email</th><th className="p-4 text-left">Role</th><th className="p-4 text-left">Status</th><th className="p-4 text-right">Aksi</th></tr></thead><tbody className="divide-y divide-border">{users.map((u) => (<tr key={u.email}><td className="p-4 font-semibold">{u.name}</td><td className="p-4 text-muted-foreground">{u.email}</td><td className="p-4">{u.role}</td><td className="p-4"><StatusBadge status={u.status} /></td><td className="p-4 text-right"><div className="inline-flex gap-1"><button className="rounded-md p-2 hover:bg-secondary"><Edit2 className="h-4 w-4" /></button><button className="rounded-md p-2 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button></div></td></tr>))}</tbody></table></Card></>);
}
