import { Star, Heart, Percent } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

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

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLiked(!liked);
  };

  return (
    <Card 
      className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => setLocation(`/restaurant/${restaurant.id}`)}
    >
      <div className="relative">
        <img
          src={restaurant.image || "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=300"}
          alt={restaurant.name}
          className="w-full h-40 object-cover"
        />
        <div className="absolute top-2 left-2 bg-maroon-800 text-white px-2 py-1 rounded text-xs font-medium">
          Ad
        </div>
        <button
          onClick={handleLike}
          className="absolute top-2 right-2 bg-white/90 rounded-full p-2 hover:bg-white transition-colors"
        >
          <Heart className={`h-4 w-4 ${liked ? "text-red-500 fill-red-500" : "text-gray-400"}`} />
        </button>
      </div>
      
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-800 line-clamp-1">{restaurant.name}</h3>
          <div className="flex items-center">
            <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
            <span className="ml-1 text-sm font-medium text-gray-600">{restaurant.rating}</span>
            <span className="text-gray-400 text-sm ml-1">({restaurant.reviewCount}+)</span>
          </div>
        </div>
        
        <p className="text-sm text-gray-600 mb-3">
          {restaurant.deliveryTime} • {restaurant.priceRange} • {restaurant.category}
        </p>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">
            ₱{restaurant.deliveryFee} from ₱29 with Saver
          </span>
          <Badge className="bg-maroon-50 text-maroon-800 border-maroon-200">
            <Percent className="h-3 w-3 mr-1" />
            10% cashback
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
