import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Lock, Mail } from "lucide-react";
import logo from "@/assets/logo-indobraga.png";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => nav({ to: "/admin" }), 700);
  };
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-hero px-4">
      <div className="w-full max-w-md rounded-3xl bg-card p-8 shadow-elegant">
        <div className="mb-6 flex items-center gap-3">
          <img src={logo} alt="" className="h-10 w-10" />
          <div>
            <h1 className="font-display text-xl font-bold text-primary-deep">Indobraga Admin</h1>
            <p className="text-xs text-muted-foreground">Masuk ke dashboard pengelolaan website</p>
          </div>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold">Email</label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input type="email" required defaultValue="admin@indobraga.co.id" className="w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold">Password</label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input type="password" required defaultValue="••••••••" className="w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
            </div>
          </div>
          <button disabled={loading} type="submit" className="w-full rounded-full bg-primary py-3 text-sm font-bold text-primary-foreground shadow-card hover:bg-primary-deep disabled:opacity-60">
            {loading ? "Memproses..." : "Masuk Dashboard"}
          </button>
        </form>
        <p className="mt-6 text-center text-xs text-muted-foreground">© PT. Braga Indonesia Perkasa</p>
      </div>
    </div>
  );
}