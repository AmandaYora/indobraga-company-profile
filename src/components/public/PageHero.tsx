type PageHeroProps = {
  kicker: string;
  title: string;
  subtitle: string;
  image?: string;
};

export function PageHero({ kicker, title, subtitle, image }: PageHeroProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-hero py-16 text-primary-foreground sm:py-20">
      {image && (
        <div className="absolute inset-0 opacity-25">
          <img src={image} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-primary-deep via-primary-deep/80 to-primary-deep/20" />
        </div>
      )}
      <div className="relative mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_340px] lg:items-center lg:px-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-accent">{kicker}</span>
          <h1 className="mt-3 max-w-3xl font-display text-3xl font-extrabold leading-[1.16] sm:text-4xl lg:text-[2.75rem]">
            {title}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-primary-foreground/80 sm:text-base">
            {subtitle}
          </p>
        </div>
        {image && (
          <div className="hidden overflow-hidden rounded-xl border border-white/15 bg-white/10 p-2 shadow-elegant backdrop-blur lg:block">
            <img src={image} alt="" className="aspect-[4/3] w-full rounded-lg object-cover" />
          </div>
        )}
      </div>
    </section>
  );
}
