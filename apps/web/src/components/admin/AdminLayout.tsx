import { Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
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
  CheckCheck,
  Search,
  Tags,
} from "lucide-react";
import { toast } from "sonner";
import { BrandLogo } from "@/components/BrandLogo";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ErrorState, LoadingState } from "@/components/admin/ApiState";
import { isApiClientError } from "@/lib/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { adminNotificationsApi, authApi } from "@/lib/api-services";
import type { AdminNotification } from "@/lib/api-models";
import { getErrorMessage, useApiQuery } from "@/hooks/use-api-query";

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
      { to: "/admin/portfolio-categories", label: "Kategori Portofolio", icon: Tags },
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
      { to: "/admin/email-accounts", label: "Akun Pengirim Email", icon: Mail },
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

const notificationSeverityClass: Record<AdminNotification["severity"], string> = {
  error: "bg-destructive",
  info: "bg-primary",
  success: "bg-emerald-600",
  warning: "bg-accent",
};

export function AdminLayout() {
  const [open, setOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState<string | null>(null);
  const notificationsOpenRef = useRef(false);
  const loc = useLocation();
  const nav = useNavigate();
  const loadSession = useCallback(() => authApi.me(), []);
  const session = useApiQuery(["auth", "me"], loadSession);
  const user = session.data?.user;
  const loadUnreadCount = useCallback(() => adminNotificationsApi.unreadCount(), []);
  const {
    data: unreadData,
    reload: reloadUnreadCount,
    setData: setUnreadCount,
  } = useApiQuery(["admin", "notifications", "unread-count"], loadUnreadCount, {
    enabled: Boolean(user),
    initialData: { unread_count: 0 },
  });
  const unread = unreadData?.unread_count ?? 0;

  const reloadNotifications = useCallback(async () => {
    setNotificationsLoading(true);
    setNotificationsError(null);

    try {
      const result = await adminNotificationsApi.list({ limit: 10, read: "all" });
      setNotifications(result.items);
    } catch (error) {
      setNotificationsError(getErrorMessage(error));
    } finally {
      setNotificationsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (
      session.error &&
      isApiClientError(session.error) &&
      session.error.code === "UNAUTHENTICATED"
    ) {
      void nav({ to: "/login" });
    }
  }, [nav, session.error]);

  useEffect(() => {
    notificationsOpenRef.current = notificationsOpen;
  }, [notificationsOpen]);

  useEffect(() => {
    if (notificationsOpen) {
      void reloadNotifications();
    }
  }, [notificationsOpen, reloadNotifications]);

  useEffect(() => {
    if (!user || typeof EventSource === "undefined") {
      return undefined;
    }

    let fallbackPoll: number | undefined;
    const refresh = () => {
      reloadUnreadCount();
      if (notificationsOpenRef.current) {
        void reloadNotifications();
      }
    };
    const stream = new EventSource(adminNotificationsApi.streamUrl(), {
      withCredentials: true,
    });

    stream.addEventListener("notification.created", refresh);
    stream.addEventListener("notification.read", refresh);
    stream.onerror = () => {
      stream.close();
      if (!fallbackPoll) {
        fallbackPoll = window.setInterval(refresh, 120_000);
      }
    };

    return () => {
      stream.close();
      if (fallbackPoll) {
        window.clearInterval(fallbackPoll);
      }
    };
  }, [reloadNotifications, reloadUnreadCount, user]);

  const markAllNotificationsRead = useCallback(async () => {
    try {
      const result = await adminNotificationsApi.markAllRead();
      setUnreadCount({ unread_count: result.unread_count });
      setNotifications((items) => items.map((item) => ({ ...item, read: true })));
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }, [setUnreadCount]);

  const openNotification = useCallback(
    async (notification: AdminNotification) => {
      try {
        if (!notification.read) {
          const result = await adminNotificationsApi.markRead(notification.id);
          setUnreadCount({ unread_count: result.unread_count });
          setNotifications((items) =>
            items.map((item) => (item.id === notification.id ? { ...item, read: true } : item)),
          );
        }
      } catch (error) {
        toast.error(getErrorMessage(error));
      }

      setNotificationsOpen(false);

      switch (notification.resource_type) {
        case "inquiry":
          await nav({ to: "/admin/inquiries" });
          break;
        case "whatsapp_lead":
          await nav({ to: "/admin/whatsapp" });
          break;
        case "email_account":
          await nav({ to: "/admin/email-accounts" });
          break;
        case "email_campaign":
          await nav({ to: "/admin/email-history" });
          break;
        case "media":
          await nav({ to: "/admin/gallery" });
          break;
        default:
          break;
      }
    },
    [nav, setUnreadCount],
  );

  const logout = async () => {
    try {
      await authApi.logout();
      toast.success("Anda sudah keluar");
    } catch {
      toast.error("Keluar dari dashboard gagal, Anda akan diarahkan ke halaman masuk.");
    } finally {
      await nav({ to: "/login" });
    }
  };

  if (session.loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary p-4">
        <div className="w-full max-w-md">
          <LoadingState label="Memeriksa akses dashboard..." />
        </div>
      </div>
    );
  }

  if (
    session.error &&
    (!isApiClientError(session.error) || session.error.code !== "UNAUTHENTICATED")
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary p-4">
        <div className="w-full max-w-lg">
          <ErrorState error={session.error} onRetry={session.reload} />
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-secondary">
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col transform bg-sidebar text-sidebar-foreground transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-sidebar-border px-5">
          <Link to="/admin" className="flex items-center gap-2">
            <BrandLogo
              brand="Admin Indobraga"
              markClassName="h-8 w-8 bg-white text-primary-deep"
              textClassName="font-display text-base font-bold"
            />
          </Link>
          <button
            className="lg:hidden"
            onClick={() => setOpen(false)}
            aria-label="Tutup menu navigasi"
          >
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
            onClick={logout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent"
          >
            <LogOut className="h-4 w-4" /> Keluar
          </button>
        </div>
      </aside>

      <div className="min-w-0 flex-1 lg:ml-0">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-16 min-w-0 items-center justify-between gap-4 border-b border-border bg-background px-4 sm:px-6">
          <button
            className="lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="Buka menu navigasi"
          >
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
          <div className="flex min-w-0 items-center gap-3">
            <DropdownMenu open={notificationsOpen} onOpenChange={setNotificationsOpen}>
              <DropdownMenuTrigger asChild>
                <button
                  className="relative rounded-full p-2 hover:bg-secondary"
                  aria-label={unread > 0 ? `Notifikasi, ${unread} belum dibaca` : "Notifikasi"}
                  title="Notifikasi"
                >
                  <Bell className="h-5 w-5" />
                  {unread > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 min-w-5 rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-bold leading-none text-accent-foreground">
                      {unread > 99 ? "99+" : unread}
                    </span>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-[min(calc(100vw-2rem),24rem)] p-0"
                sideOffset={10}
              >
                <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">Notifikasi</p>
                    <p className="text-xs text-muted-foreground">
                      {unread > 0 ? `${unread} belum dibaca` : "Semua sudah dibaca"}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold text-primary hover:bg-secondary disabled:cursor-not-allowed disabled:text-muted-foreground"
                    disabled={unread === 0}
                    onClick={(event) => {
                      event.preventDefault();
                      void markAllNotificationsRead();
                    }}
                    aria-label="Tandai semua notifikasi sebagai dibaca"
                    title="Tandai semua dibaca"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    Dibaca
                  </button>
                </div>
                <div className="max-h-[24rem] overflow-y-auto p-2">
                  {notificationsLoading && notifications.length === 0 && (
                    <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                      Memuat notifikasi...
                    </p>
                  )}
                  {notificationsError && (
                    <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                      {notificationsError}
                    </div>
                  )}
                  {!notificationsLoading && !notificationsError && notifications.length === 0 && (
                    <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                      Belum ada notifikasi.
                    </p>
                  )}
                  {notifications.map((notification) => (
                    <button
                      key={notification.id}
                      type="button"
                      className={`flex w-full min-w-0 gap-3 rounded-md px-3 py-2.5 text-left transition hover:bg-secondary ${notification.read ? "" : "bg-secondary/70"}`}
                      onClick={() => void openNotification(notification)}
                    >
                      <span
                        className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${notificationSeverityClass[notification.severity]}`}
                        aria-hidden="true"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">
                          {notification.title}
                        </span>
                        <span className="line-clamp-2 text-xs leading-5 text-muted-foreground">
                          {notification.message}
                        </span>
                        <span className="mt-1 block text-[11px] font-medium text-muted-foreground">
                          {formatNotificationTime(notification.created_at)}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="flex min-w-0 items-center gap-2 rounded-full bg-secondary px-3 py-1.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                AD
              </div>
              <div className="hidden text-xs sm:block">
                <p className="font-semibold leading-tight">{user.name}</p>
                <p className="text-muted-foreground">
                  {user.role === "super_admin" ? "Admin Utama" : "Editor Konten"}
                </p>
              </div>
            </div>
          </div>
        </header>
        <main className="mx-auto w-full min-w-0 max-w-7xl p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function formatNotificationTime(value: string): string {
  const createdAt = new Date(value);
  const timestamp = createdAt.getTime();

  if (Number.isNaN(timestamp)) {
    return "";
  }

  const diffMinutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60_000));

  if (diffMinutes < 1) {
    return "Baru saja";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} menit lalu`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} jam lalu`;
  }

  return createdAt.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
