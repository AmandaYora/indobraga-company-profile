import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { pageSeo } from "@/lib/seo";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
  head: () =>
    pageSeo({
      title: "Panel Admin - Indobraga",
      description: "Panel pengelolaan internal website Indobraga.",
      path: "/admin",
      noindex: true,
    }),
});
