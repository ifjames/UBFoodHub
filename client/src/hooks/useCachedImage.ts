import { useState, useEffect } from 'react';
import { getCachedImage, cacheImage } from '@/lib/imageCache';

interface UseCachedImageOptions {
  fallbackUrl: string;
  onLoad?: () => void;
  onError?: () => void;
}

export function useCachedImage(
  imageUrl: string | null | undefined,
  options: UseCachedImageOptions
) {
  const [displayUrl, setDisplayUrl] = useState<string>(options.fallbackUrl);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let mounted = true;
    let objectUrl: string | null = null;

    async function loadImage() {
      if (!imageUrl || imageUrl.trim() === '') {
        setDisplayUrl(options.fallbackUrl);
        setIsLoading(false);
        return;
      }

      try {
        const cachedUrl = await getCachedImage(imageUrl);
        
        if (cachedUrl && mounted) {
          objectUrl = cachedUrl;
          setDisplayUrl(cachedUrl);
          setIsLoading(false);
          options.onLoad?.();
          return;
        }

        const img = new Image();
        
        img.onload = async () => {
          if (!mounted) return;
          
          setDisplayUrl(imageUrl);
          setIsLoading(false);
          setHasError(false);
          options.onLoad?.();
          
          await cacheImage(imageUrl);
        };
        
        img.onerror = () => {
          if (!mounted) return;
          
          setDisplayUrl(options.fallbackUrl);
          setIsLoading(false);
          setHasError(true);
          options.onError?.();
        };
        
        img.src = imageUrl;
      } catch (error) {
        console.warn('Error loading image:', error);
        if (mounted) {
          setDisplayUrl(options.fallbackUrl);
          setIsLoading(false);
          setHasError(true);
          options.onError?.();
        }
      }
    }

    loadImage();

    return () => {
      mounted = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [imageUrl, options.fallbackUrl]);

  return { displayUrl, isLoading, hasError };
}
