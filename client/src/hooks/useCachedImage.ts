import { useState, useEffect } from 'react';

interface UseCachedImageOptions {
  onLoad?: () => void;
  onError?: () => void;
}

export function useCachedImage(
  imageUrl: string | null | undefined,
  options: UseCachedImageOptions = {}
) {
  // Simply pass through the image URL - let the browser handle caching
  const [displayUrl, setDisplayUrl] = useState<string | null>(imageUrl || null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Update displayUrl when imageUrl changes
    if (imageUrl && imageUrl.trim() !== '') {
      setDisplayUrl(imageUrl);
      setHasError(false);
    } else {
      setDisplayUrl(null);
    }
  }, [imageUrl]);

  return { displayUrl, isLoading, hasError };
}
