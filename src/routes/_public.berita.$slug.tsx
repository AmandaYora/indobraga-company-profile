import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { news } from "@/data/site";
export const Route = createFileRoute("/_public/berita/$slug")({ component: D });
function D() {
  const { slug } = Route.useParams();
  const item = news.find((n) => n.slug === slug);
  if (!item) throw notFound();
  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <Link to="/berita" className="inline-flex items-center gap-1 text-sm font-semibold text-primary"><ArrowLeft className="h-4 w-4" />Kembali</Link>
      <div className="mt-6 flex items-center gap-2 text-xs">
        <span className="rounded-full bg-accent/20 px-2.5 py-0.5 font-semibold text-accent-foreground">{item.category}</span>
        <span className="text-muted-foreground">{new Date(item.date).toLocaleDateString("id-ID")}</span>
      </div>
      <h1 className="mt-4 font-display text-3xl font-extrabold text-primary-deep sm:text-4xl">{item.title}</h1>
      <img src={item.thumb} alt={item.title} className="mt-8 aspect-[16/9] w-full rounded-2xl object-cover shadow-card" />
      <p className="mt-8 text-foreground/80">{item.excerpt}</p>
      <p className="mt-4 text-foreground/80">Indobraga terus berkomitmen memberikan kualitas produksi terbaik dan layanan responsif untuk seluruh klien.</p>
    </article>
  );
}
