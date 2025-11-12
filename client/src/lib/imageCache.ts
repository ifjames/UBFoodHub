const CACHE_NAME = 'ub-foodhub-images-v1';
const CACHE_EXPIRY_DAYS = 7;

interface CacheMetadata {
  url: string;
  timestamp: number;
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
  if (!url || url.trim() === '') return null;
  
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
  if (!url || url.trim() === '') return;
  
  try {
    const cache = await getCacheStorage();
    if (!cache) return;

    const response = await fetch(url, {
      mode: 'cors',
      cache: 'force-cache'
    });

    if (!response.ok) return;

    await cache.put(url, response.clone());

    const metadata: CacheMetadata = {
      url,
      timestamp: Date.now()
    };
    
    await cache.put(
      `${url}-metadata`,
      new Response(JSON.stringify(metadata))
    );
  } catch (error) {
    console.warn('Failed to cache image:', error);
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
