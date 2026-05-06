import { Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  LayoutDashboard,
  Image,
  Images,
  Users,
  Package,
  Wrench,
  Newspaper,
  Briefcase,
  Inbox,
  MessageCircle,
  Mail,
  Send,
  History,
  Settings,
  UserCog,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
} from "lucide-react";
import logo from "@/assets/logo-indobraga.png";
import { ScrollArea } from "@/components/ui/scroll-area";

const groups = [
  {
    title: "Ringkasan",
    items: [{ to: "/admin", label: "Ringkasan", icon: LayoutDashboard, exact: true }],
  },
  {
    title: "Konten Website",
    items: [
      { to: "/admin/hero", label: "Konten Beranda", icon: Image },
      { to: "/admin/partners", label: "Logo Klien", icon: Users },
      { to: "/admin/strength", label: "Kekuatan Produksi", icon: Wrench },
      { to: "/admin/portfolio", label: "Portofolio Produk", icon: Package },
      { to: "/admin/machines", label: "Mesin & Fasilitas", icon: Wrench },
      { to: "/admin/services", label: "Daftar Layanan", icon: Briefcase },
      { to: "/admin/gallery", label: "Galeri Perusahaan", icon: Images },
      { to: "/admin/news", label: "Berita", icon: Newspaper },
    ],
  },
  {
    title: "Prospek",
    items: [
      { to: "/admin/inquiries", label: "Pesan Kontak", icon: Inbox },
      { to: "/admin/whatsapp", label: "Prospek WhatsApp", icon: MessageCircle },
    ],
  },
  {
    title: "Email Massal",
    items: [
      { to: "/admin/email-accounts", label: "Akun Email", icon: Mail },
      { to: "/admin/email-blast", label: "Kirim Email Massal", icon: Send },
      { to: "/admin/email-history", label: "Riwayat Email Massal", icon: History },
    ],
  },
  {
    title: "Pengaturan",
    items: [
      { to: "/admin/settings", label: "Pengaturan Website", icon: Settings },
      { to: "/admin/users", label: "Pengguna Admin", icon: UserCog },
    ],
  },
] as const;

export function AdminLayout() {
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  const nav = useNavigate();
  return (
    <div className="flex min-h-screen bg-secondary">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col transform bg-sidebar text-sidebar-foreground transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-sidebar-border px-5">
          <Link to="/admin" className="flex items-center gap-2">
            <img src={logo} alt="" className="h-8 w-8 rounded bg-white p-0.5" />
            <span className="font-display text-base font-bold">Admin Indobraga</span>
          </Link>
          <button className="lg:hidden" onClick={() => setOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <ScrollArea className="flex-1">
          <nav className="px-3 py-5">
            {groups.map((g) => (
              <div key={g.title} className="mb-5">
                <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-sidebar-foreground/50">
                  {g.title}
                </p>
                <ul className="space-y-0.5">
                  {g.items.map((it) => {
                    const Icon = it.icon;
                    const active =
                      "exact" in it && it.exact
                        ? loc.pathname === it.to
                        : loc.pathname.startsWith(it.to);
                    return (
                      <li key={it.to}>
                        <Link
                          to={it.to}
                          onClick={() => setOpen(false)}
                          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${active ? "bg-sidebar-primary text-sidebar-primary-foreground font-semibold shadow-card" : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"}`}
                        >
                          <Icon className="h-4 w-4" />
                          {it.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </ScrollArea>
        <div className="mt-auto shrink-0 border-t border-sidebar-border p-4">
          <button
            onClick={() => nav({ to: "/login" })}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent"
          >
            <LogOut className="h-4 w-4" /> Keluar
          </button>
        </div>
      </aside>

      <div className="flex-1 lg:ml-0">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border bg-background px-4 sm:px-6">
          <button className="lg:hidden" onClick={() => setOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden flex-1 max-w-md md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                placeholder="Cari konten, pesan kontak, atau berita..."
                className="w-full rounded-full border border-border bg-secondary py-2 pl-10 pr-4 text-sm outline-none focus:border-primary"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative rounded-full p-2 hover:bg-secondary">
              <Bell className="h-5 w-5" />
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-accent" />
            </button>
            <div className="flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                AD
              </div>
              <div className="hidden text-xs sm:block">
                <p className="font-semibold leading-tight">Admin Indobraga</p>
                <p className="text-muted-foreground">Admin Utama</p>
              </div>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
