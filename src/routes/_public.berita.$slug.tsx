import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { news } from "@/data/site";
import { formatDateId } from "@/lib/date";

export const Route = createFileRoute("/_public/berita/$slug")({
  component: NewsDetailPage,
});

function NewsDetailPage() {
  const { slug } = Route.useParams();
  const item = news.find((n) => n.slug === slug);

  if (!item) throw notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <Link
        to="/berita"
        search={{ page: 1 }}
        className="inline-flex items-center gap-1 text-sm font-semibold text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali
      </Link>
      <div className="mt-6 flex items-center gap-2 text-xs">
        <span className="rounded-full bg-accent/20 px-2.5 py-0.5 font-semibold text-accent-foreground">
          {item.category}
        </span>
        <span className="text-muted-foreground">
          {formatDateId(item.date)}
        </span>
      </div>
      <h1 className="mt-4 font-display text-3xl font-extrabold text-primary-deep sm:text-4xl">
        {item.title}
      </h1>
      <img
        src={item.thumb}
        alt={item.title}
        className="mt-8 aspect-[16/9] w-full rounded-2xl object-cover shadow-card"
      />
      <p className="mt-8 text-lg leading-relaxed text-foreground/80">{item.excerpt}</p>
      <div className="mt-6 space-y-4 text-foreground/80">
        {item.content.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
    </article>
  );
}
