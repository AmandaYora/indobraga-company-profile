import { ImageIcon } from "lucide-react";

type MediaPlaceholderProps = {
  label?: string;
  className?: string;
  iconClassName?: string;
  textClassName?: string;
};

type OptionalImageProps = {
  src?: string | null;
  alt: string;
  className?: string;
  placeholderClassName?: string;
  loading?: "eager" | "lazy";
};

export function MediaPlaceholder({
  label = "Media belum tersedia",
  className = "",
  iconClassName = "h-6 w-6",
  textClassName = "text-xs",
}: MediaPlaceholderProps) {
  return (
    <div
      className={`flex h-full w-full flex-col items-center justify-center gap-2 bg-secondary text-center text-muted-foreground ${className}`}
    >
      <ImageIcon className={iconClassName} aria-hidden="true" />
      <span className={`max-w-[80%] font-semibold leading-tight ${textClassName}`}>{label}</span>
    </div>
  );
}

export function OptionalImage({
  src,
  alt,
  className = "",
  placeholderClassName = "",
  loading = "lazy",
}: OptionalImageProps) {
  if (!src) {
    return <MediaPlaceholder label="Gambar belum diunggah" className={placeholderClassName} />;
  }

  return <img src={src} alt={alt} loading={loading} className={className} />;
}
