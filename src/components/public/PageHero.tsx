export function PageHero({ kicker, title, subtitle }: { kicker: string; title: string; subtitle: string }) {
  return (
    <section className="bg-gradient-hero py-20 text-primary-foreground">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <span className="text-xs font-bold uppercase tracking-widest text-accent">{kicker}</span>
        <h1 className="mt-3 max-w-3xl font-display text-4xl font-extrabold sm:text-5xl">{title}</h1>
        <p className="mt-4 max-w-2xl text-primary-foreground/80">{subtitle}</p>
      </div>
    </section>
  );
}