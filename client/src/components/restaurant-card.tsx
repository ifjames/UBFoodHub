import { Star, Heart, Percent } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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

  // Check if restaurant is favorited when component mounts
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
    <Card 
      className="overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] bg-white"
      onClick={() => setLocation(`/restaurant/${restaurant.id}`)}
    >
      <div className="relative">
        <img
          src={restaurant.image || "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=300"}
          alt={restaurant.name}
          className="w-full h-40 md:h-48 lg:h-52 object-cover"
        />

        <button
          onClick={handleLike}
          disabled={isLoading}
          className="absolute top-2 right-2 bg-white/90 rounded-full p-2 hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Heart className={`h-4 w-4 transition-colors ${
            liked ? "text-red-500 fill-red-500" : "text-gray-400"
          } ${isLoading ? "opacity-50" : ""}`} />
        </button>
      </div>
      
      <CardContent className="p-4 md:p-6">
        <div className="mb-3 md:mb-4">
          <h3 className="font-semibold text-gray-800 text-base md:text-lg mb-2 md:mb-3 line-clamp-2">
            {restaurant.name}
          </h3>
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 md:h-5 md:w-5 text-yellow-400 fill-yellow-400" />
              <span className="text-sm md:text-base font-medium text-gray-700">
                {restaurant.rating && restaurant.rating !== "0" ? restaurant.rating : "No ratings"}
              </span>
              {restaurant.reviewCount > 0 && (
                <span className="text-gray-500 text-sm md:text-base">({restaurant.reviewCount})</span>
              )}
            </div>
          </div>
        </div>
        
        {(stats?.avgCompletionTime || stats?.priceRange) && (
          <p className="text-sm md:text-base text-gray-600 leading-relaxed" data-testid={`text-stats-${restaurant.id}`}>
            {[stats.avgCompletionTime, stats.priceRange].filter(Boolean).join(' • ')}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
