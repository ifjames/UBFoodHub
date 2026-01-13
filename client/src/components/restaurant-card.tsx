import { Star, Heart, Clock, Store } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useStore } from "@/lib/store";
import { toggleFavorite, checkIfFavorite } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { useCachedImage } from "@/hooks/useCachedImage";

interface RestaurantCardProps {
  restaurant: {
    id: number;
    name: string;
    description?: string | null;
    image?: string | null;
    rating: string;
    reviewCount: number;
    deliveryTime: string;
    priceRange: string;
    category?: string;
    categories?: string[];
    deliveryFee: string;
  };
}

export default function RestaurantCard({ restaurant }: RestaurantCardProps) {
  const [, setLocation] = useLocation();
  const [liked, setLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { state } = useStore();
  const { toast } = useToast();
  
  const { displayUrl } = useCachedImage(restaurant.image);

  useEffect(() => {
    // Reset image states when URL changes
    setImageError(false);
    setImageLoaded(false);
  }, [displayUrl]);

  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (state.user?.uid) {
        try {
          const isFavorite = await checkIfFavorite(state.user.uid, restaurant.id.toString());
          setLiked(isFavorite);
        } catch (error) {
          console.error("Error checking favorite status:", error);
        }
      }
    };

    checkFavoriteStatus();
  }, [state.user?.uid, restaurant.id]);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!state.user?.uid) {
      toast({
        title: "Login Required",
        description: "Please log in to add favorites",
        variant: "destructive",
      });
      return;
    }

    if (isLoading) return;

    setIsLoading(true);
    try {
      const newLikedState = await toggleFavorite(state.user.uid, restaurant.id.toString());
      setLiked(newLikedState);
      
      toast({
        title: newLikedState ? "Added to favorites" : "Removed from favorites",
        description: newLikedState 
          ? `${restaurant.name} has been added to your favorites`
          : `${restaurant.name} has been removed from your favorites`,
      });
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast({
        title: "Error",
        description: "Failed to update favorites. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="group relative bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden border border-gray-200"
      onClick={() => setLocation(`/restaurant/${restaurant.id}`)}
      data-testid={`card-restaurant-${restaurant.id}`}
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-[#6d031e] to-[#8b0a2a]">
        {/* Always render image if URL exists, hide placeholder once loaded */}
        {displayUrl && !imageError && (
          <img
            src={displayUrl}
            alt={restaurant.name}
            className={`w-full h-full object-cover transition-opacity duration-200 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        )}
        {/* Show placeholder only if no URL, error, or still loading */}
        {(!displayUrl || imageError || !imageLoaded) && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Store className="w-12 h-12 text-white/40" />
          </div>
        )}
        <button
          onClick={handleLike}
          disabled={isLoading}
          data-testid={`button-favorite-${restaurant.id}`}
          className="absolute top-2 right-2 w-7 h-7 bg-white/90 backdrop-blur-sm shadow-md rounded-full flex items-center justify-center hover:scale-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed z-10"
        >
          <Heart className={`h-3.5 w-3.5 transition-colors ${
            liked ? "text-red-500 fill-red-500" : "text-gray-500"
          } ${isLoading ? "opacity-50" : ""}`} />
        </button>
      </div>

      <div className="p-3">
        <div className="flex items-center justify-between gap-2 mb-1">
          <h3 className="font-semibold text-gray-900 text-sm line-clamp-1" data-testid={`text-name-${restaurant.id}`}>
            {restaurant.name}
          </h3>
          
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <Star className="h-3.5 w-3.5 text-orange-400 fill-orange-400" />
            <span className="text-xs font-medium text-gray-700">
              {restaurant.rating && restaurant.rating !== "0" ? restaurant.rating : "New"}
            </span>
          </div>
        </div>
        
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 text-xs text-gray-500 flex-1 min-w-0 flex-wrap">
            <span className="flex-shrink-0" data-testid={`text-price-${restaurant.id}`}>
              {restaurant.priceRange || '\u20b1--'}
            </span>
            {(restaurant.categories && restaurant.categories.length > 0) ? (
              <>
                <span className="mx-1 flex-shrink-0">•</span>
                <span className="truncate" data-testid={`text-category-${restaurant.id}`}>
                  {restaurant.categories.join(', ')}
                </span>
              </>
            ) : restaurant.category && (
              <>
                <span className="mx-1 flex-shrink-0">•</span>
                <span className="truncate" data-testid={`text-category-${restaurant.id}`}>
                  {restaurant.category}
                </span>
              </>
            )}
          </div>
          
          <span className="text-xs text-gray-500 flex-shrink-0 flex items-center gap-1" data-testid={`text-time-${restaurant.id}`}>
            <Clock className="h-3 w-3" />
            {restaurant.deliveryTime || '5-20 min'}
          </span>
        </div>
      </div>
    </div>
  );
}
