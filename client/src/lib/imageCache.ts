const CACHE_NAME = 'ub-foodhub-images-v1';
const CACHE_EXPIRY_DAYS = 7;

interface CacheMetadata {
  url: string;
  timestamp: number;
}

// Check if URL is cacheable (only http/https URLs can be cached)
function isCacheableUrl(url: string): boolean {
  if (!url || url.trim() === '') return false;
  // Data URLs, blob URLs, and other non-http(s) schemes cannot be cached
  if (url.startsWith('data:') || url.startsWith('blob:')) return false;
  // Only cache http and https URLs
  return url.startsWith('http://') || url.startsWith('https://');
}

async function getCacheStorage(): Promise<Cache | null> {
  if ('caches' in window) {
    try {
      return await caches.open(CACHE_NAME);
    } catch (error) {
      console.warn('Failed to open cache:', error);
      return null;
    }
  }
  return null;
}

function isExpired(timestamp: number): boolean {
  const expiryTime = CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
  return Date.now() - timestamp > expiryTime;
}

export async function getCachedImage(url: string): Promise<string | null> {
  // Skip non-cacheable URLs
  if (!isCacheableUrl(url)) return null;
  
  try {
    const cache = await getCacheStorage();
    if (!cache) return null;

    const response = await cache.match(url);
    if (!response) return null;

    const metadataResponse = await cache.match(`${url}-metadata`);
    if (metadataResponse) {
      const metadata: CacheMetadata = await metadataResponse.json();
      if (isExpired(metadata.timestamp)) {
        await cache.delete(url);
        await cache.delete(`${url}-metadata`);
        return null;
      }
    }

    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    console.warn('Failed to get cached image:', error);
    return null;
  }
}

export async function cacheImage(url: string): Promise<void> {
  // Skip non-cacheable URLs (data:, blob:, etc.)
  if (!isCacheableUrl(url)) return;
  
  try {
    const cache = await getCacheStorage();
    if (!cache) return;

    // Try to fetch with no-cors first (most external images don't support CORS)
    // This will at least allow the browser to cache it for display
    const response = await fetch(url, {
      mode: 'no-cors',
      cache: 'force-cache'
    });

    // With no-cors mode, we can't read the response, but we can still cache
    // opaque responses for display purposes
    if (response.type === 'opaque' || response.ok) {
      await cache.put(url, response.clone());

      const metadata: CacheMetadata = {
        url,
        timestamp: Date.now()
      };
      
      await cache.put(
        `${url}-metadata`,
        new Response(JSON.stringify(metadata))
      );
    }
  } catch (error) {
    // Silently ignore cache errors - the image will still display via the browser
  }
}

export async function clearImageCache(): Promise<void> {
  try {
    await caches.delete(CACHE_NAME);
  } catch (error) {
    console.warn('Failed to clear cache:', error);
  }
}

export function preloadImage(url: string, onLoad?: () => void, onError?: () => void): void {
  if (!url || url.trim() === '') {
    onError?.();
    return;
  }

  getCachedImage(url).then(cachedUrl => {
    const img = new Image();
    
    img.onload = () => {
      if (!cachedUrl) {
        cacheImage(url);
      }
      if (cachedUrl) {
        URL.revokeObjectURL(cachedUrl);
      }
      onLoad?.();
    };
    
    img.onerror = () => {
      if (cachedUrl) {
        URL.revokeObjectURL(cachedUrl);
      }
      onError?.();
    };
    
    img.src = cachedUrl || url;
  });
}
