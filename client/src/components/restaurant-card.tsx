import { Star, Heart, Clock, DollarSign } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useStore } from "@/lib/store";
import { toggleFavorite, checkIfFavorite } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

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
    category: string;
    deliveryFee: string;
  };
}

export default function RestaurantCard({ restaurant }: RestaurantCardProps) {
  const [, setLocation] = useLocation();
  const [liked, setLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { state } = useStore();
  const { toast } = useToast();

  const { data: stats } = useQuery<{
    priceRange: string | null;
    avgCompletionTime: string | null;
  }>({
    queryKey: ['/api/restaurants', restaurant.id, 'stats'],
  });

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
      className="group relative bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden border-2 border-gray-100 hover:border-primary/20"
      onClick={() => setLocation(`/restaurant/${restaurant.id}`)}
      data-testid={`card-restaurant-${restaurant.id}`}
    >
      <div className="relative overflow-hidden">
        <div className="aspect-[4/3] overflow-hidden bg-gray-100">
          <img
            src={restaurant.image || "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=300"}
            alt={restaurant.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        </div>

        <button
          onClick={handleLike}
          disabled={isLoading}
          data-testid={`button-favorite-${restaurant.id}`}
          className="absolute top-3 right-3 w-9 h-9 md:w-10 md:h-10 bg-white shadow-lg rounded-full flex items-center justify-center hover:scale-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed z-10"
        >
          <Heart className={`h-4 w-4 md:h-5 md:w-5 transition-colors ${
            liked ? "text-red-500 fill-red-500" : "text-gray-400"
          } ${isLoading ? "opacity-50" : ""}`} />
        </button>

        <div className="absolute top-3 left-3 flex items-center gap-1 bg-white/95 backdrop-blur-sm px-2.5 py-1.5 rounded-full shadow-md">
          <Star className="h-3.5 w-3.5 md:h-4 md:w-4 text-yellow-500 fill-yellow-500" />
          <span className="text-xs md:text-sm font-bold text-gray-800">
            {restaurant.rating && restaurant.rating !== "0" ? restaurant.rating : "New"}
          </span>
          {restaurant.reviewCount > 0 && (
            <span className="text-xs text-gray-500">({restaurant.reviewCount})</span>
          )}
        </div>
      </div>

      <div className="p-4 md:p-5 space-y-3">
        <h3 className="font-bold text-gray-900 text-base md:text-lg line-clamp-2 min-h-[3rem] md:min-h-[3.5rem]" data-testid={`text-name-${restaurant.id}`}>
          {restaurant.name}
        </h3>

        {(stats?.avgCompletionTime || stats?.priceRange) && (
          <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm text-gray-600">
            {stats.avgCompletionTime && (
              <div className="flex items-center gap-1.5" data-testid={`text-time-${restaurant.id}`}>
                <Clock className="h-3.5 w-3.5 md:h-4 md:w-4 text-gray-400" />
                <span className="font-medium">{stats.avgCompletionTime}</span>
              </div>
            )}
            {stats.priceRange && (
              <div className="flex items-center gap-1.5" data-testid={`text-price-${restaurant.id}`}>
                <DollarSign className="h-3.5 w-3.5 md:h-4 md:w-4 text-gray-400" />
                <span className="font-medium">{stats.priceRange}</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="absolute inset-0 border-2 border-transparent group-hover:border-primary/30 rounded-2xl transition-colors pointer-events-none" />
    </div>
  );
}
