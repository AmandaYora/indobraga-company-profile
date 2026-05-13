type BrandLogoProps = {
  brand: string;
  logoUrl?: string | null;
  className?: string;
  markClassName?: string;
  textClassName?: string;
  showText?: boolean;
};

export function BrandLogo({
  brand,
  logoUrl,
  className = "",
  markClassName = "h-9 w-9",
  textClassName = "font-display text-lg font-bold",
  showText = true,
}: BrandLogoProps) {
  const initials = brand
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  return (
    <span className={`flex min-w-0 items-center gap-2 ${className}`}>
      {logoUrl ? (
        <img src={logoUrl} alt={brand} className={`${markClassName} object-contain`} />
      ) : (
        <span
          className={`flex shrink-0 items-center justify-center rounded-lg bg-primary text-xs font-extrabold text-primary-foreground ring-1 ring-primary/20 ${markClassName}`}
          aria-hidden="true"
        >
          {initials || "IB"}
        </span>
      )}
      {showText && <span className={`truncate ${textClassName}`}>{brand}</span>}
    </span>
  );
}
