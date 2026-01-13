import { useState, useEffect } from "react";
import { useCachedImage } from "@/hooks/useCachedImage";
import { ImageIcon } from "lucide-react";

interface CachedImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
  onLoad?: () => void;
  onError?: () => void;
  showPlaceholder?: boolean;
}

export function CachedImage({
  src,
  alt,
  className = "",
  loading = "lazy",
  onLoad,
  onError,
  showPlaceholder = true
}: CachedImageProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { displayUrl } = useCachedImage(src, {
    onLoad,
    onError
  });

  // Reset states when URL changes
  useEffect(() => {
    setImageError(false);
    setImageLoaded(false);
  }, [displayUrl]);

  // If no URL at all, show placeholder immediately
  if (!displayUrl) {
    if (showPlaceholder) {
      return (
        <div className={`${className} bg-gradient-to-br from-[#6d031e] to-[#8b0a2a] flex items-center justify-center`}>
          <ImageIcon className="w-8 h-8 text-white/40" />
        </div>
      );
    }
    return null;
  }

  // If there's a URL, render the image with placeholder underneath until loaded
  return (
    <div className={`${className} relative bg-gradient-to-br from-[#6d031e] to-[#8b0a2a]`}>
      {/* Image - starts invisible, fades in when loaded */}
      {!imageError && (
        <img
          src={displayUrl}
          alt={alt}
          className={`w-full h-full object-cover absolute inset-0 transition-opacity duration-200 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          loading={loading}
          onLoad={() => {
            setImageLoaded(true);
            onLoad?.();
          }}
          onError={() => {
            setImageError(true);
            onError?.();
          }}
        />
      )}
      {/* Placeholder - shows until image loads or on error */}
      {showPlaceholder && (!imageLoaded || imageError) && (
        <div className="absolute inset-0 flex items-center justify-center">
          <ImageIcon className="w-8 h-8 text-white/40" />
        </div>
      )}
    </div>
  );
}
