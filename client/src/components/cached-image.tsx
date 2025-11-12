import { useCachedImage } from "@/hooks/useCachedImage";

interface CachedImageProps {
  src: string | null | undefined;
  alt: string;
  fallbackUrl: string;
  className?: string;
  loading?: "lazy" | "eager";
  onLoad?: () => void;
  onError?: () => void;
}

export function CachedImage({
  src,
  alt,
  fallbackUrl,
  className = "",
  loading = "lazy",
  onLoad,
  onError
}: CachedImageProps) {
  const { displayUrl } = useCachedImage(src, {
    fallbackUrl,
    onLoad,
    onError
  });

  return (
    <img
      src={displayUrl}
      alt={alt}
      className={className}
      loading={loading}
    />
  );
}
