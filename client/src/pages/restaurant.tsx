import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { ArrowLeft, Star, Clock, MapPin, Heart, Share, Search, Info, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import BottomNav from "@/components/layout/bottom-nav";
import FloatingCart from "@/components/floating-cart";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useStore } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import { getDocument, subscribeToQuery, addDocument, getDocuments, toggleFavorite, checkIfFavorite } from "@/lib/firebase";
import { usePageTitle } from "@/hooks/use-page-title";
import { useQuery } from "@tanstack/react-query";

interface MenuItemType {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string;
  isAvailable: boolean;
  isPopular: boolean;
  stock?: number;
  customizations?: Array<{ name: string; price: number }>;
}

export default function Restaurant() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { state } = useStore();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [stall, setStall] = useState<any>(null);
  
  usePageTitle(stall?.name || "Restaurant");
  const [menuItems, setMenuItems] = useState<MenuItemType[]>([]);
  const [selectedItem, setSelectedItem] = useState<MenuItemType | null>(null);
  const [customizations, setCustomizations] = useState<any>({});
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [actualRating, setActualRating] = useState<number>(0);
  const [actualReviewCount, setActualReviewCount] = useState<number>(0);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsWithOrderDetails, setReviewsWithOrderDetails] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const reviewsPerPage = 5;
  const [liked, setLiked] = useState(false);
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);
  
  // Debug effect to track reviews state changes
  useEffect(() => {
    console.log("Reviews state changed:", reviews);
  }, [reviews]);

  const restaurantId = params.id;
  const [pickupTime, setPickupTime] = useState<string>("5-20 min");

  // Calculate dynamic pickup time based on queue length
  const calculatePickupTime = async (stallId: string) => {
    try {
      const allOrders = await getDocuments("orders", "stallId", "==", stallId);
      const queueOrders = allOrders.filter((order: any) => 
        order.status === 'pending' || order.status === 'preparing'
      );
      
      const queueLength = queueOrders.length;
      
      if (queueLength === 0) {
        setPickupTime("5 min");
      } else {
        const baseTime = 5;
        const timePerOrder = 1.5;
        const minTime = Math.max(5, baseTime + Math.floor(queueLength * timePerOrder * 0.8));
        const maxTime = Math.min(30, baseTime + Math.ceil(queueLength * timePerOrder * 1.2));
        
        const time = queueLength <= 2 
          ? "5-8 min"
          : `${minTime}-${maxTime} min`;
        setPickupTime(time);
      }
    } catch (error) {
      console.error("Error calculating pickup time:", error);
      setPickupTime("5-20 min");
    }
  };

  const handleFavorite = async () => {
    if (!state.user?.uid) {
      toast({
        title: "Login Required",
        description: "Please log in to add favorites",
        variant: "destructive",
      });
      return;
    }

    if (isFavoriteLoading || !restaurantId) return;

    setIsFavoriteLoading(true);
    try {
      const newLikedState = await toggleFavorite(state.user.uid, restaurantId);
      setLiked(newLikedState);
      
      toast({
        title: newLikedState ? "Added to favorites" : "Removed from favorites",
        description: newLikedState 
          ? `${stall?.name} has been added to your favorites`
          : `${stall?.name} has been removed from your favorites`,
      });
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast({
        title: "Error",
        description: "Failed to update favorites. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsFavoriteLoading(false);
    }
  };

  const handleInfo = () => {
    toast({
      title: stall?.name || "Restaurant Info",
      description: stall?.description || "Food stall serving delicious meals at UB",
    });
  };

  const handleShare = async () => {
    const url = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: stall?.name || "Check out this restaurant",
          text: `Check out ${stall?.name || "this restaurant"} on UB Food Ordering App!`,
          url: url,
        });
        toast({
          title: "Shared successfully",
          description: "Thanks for sharing!",
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error("Error sharing:", error);
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        toast({
          title: "Link copied!",
          description: "Restaurant link has been copied to clipboard",
        });
      } catch (error) {
        console.error("Error copying to clipboard:", error);
        toast({
          title: "Error",
          description: "Failed to copy link. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (state.user?.uid && restaurantId) {
        try {
          const isFavorite = await checkIfFavorite(state.user.uid, restaurantId);
          setLiked(isFavorite);
        } catch (error) {
          console.error("Error checking favorite status:", error);
        }
      }
    };

    checkFavoriteStatus();
  }, [state.user?.uid, restaurantId]);

  useEffect(() => {
    if (restaurantId) {
      // Get stall information
      getDocument("stalls", restaurantId).then((doc) => {
        if (doc.exists()) {
          setStall({ id: doc.id, ...doc.data() });
        }
      });

      // Calculate initial pickup time
      calculatePickupTime(restaurantId);

      // Refresh pickup time every 30 seconds
      const pickupTimeInterval = setInterval(() => {
        calculatePickupTime(restaurantId);
      }, 30000);

      // Subscribe to reviews for real-time updates
      console.log("Setting up reviews subscription for restaurant:", restaurantId);
      const reviewsUnsubscribe = subscribeToQuery("reviews", "stallId", "==", restaurantId, async (reviewsData) => {
        console.log("Reviews callback triggered for restaurant:", restaurantId, reviewsData);
        console.log("Setting reviews state to:", reviewsData);
        
        // Fetch order details and user profiles for each review
        const reviewsWithDetails = await Promise.all(
          reviewsData.map(async (review) => {
            let orderItems = [];
            let userProfile = null;
            
            // Fetch order details if orderId exists
            if (review.orderId) {
              try {
                const orderDoc = await getDocument("orders", review.orderId);
                if (orderDoc.exists()) {
                  const orderData = orderDoc.data();
                  orderItems = orderData.items || [];
                }
              } catch (error) {
                console.log("Error fetching order details:", error);
              }
            }
            
            // Fetch user profile for profile picture and latest name
            if (review.userId) {
              try {
                const userDoc = await getDocument("users", review.userId);
                if (userDoc.exists()) {
                  userProfile = userDoc.data();
                  console.log("User profile fetched:", userProfile);
                }
              } catch (error) {
                console.log("Error fetching user profile:", error);
              }
            }
            
            return {
              ...review,
              orderItems,
              userProfile
            };
          })
        );
        
        // Force state update with a new array reference
        setReviews([...reviewsData]);
        setReviewsWithOrderDetails([...reviewsWithDetails]);
        setIsLoading(false);
        
        if (reviewsData.length > 0) {
          const totalRating = reviewsData.reduce((sum, review) => sum + review.rating, 0);
          const averageRating = totalRating / reviewsData.length;
          setActualRating(Math.round(averageRating * 10) / 10);
          setActualReviewCount(reviewsData.length);
          console.log("Reviews processed:", { count: reviewsData.length, averageRating, reviewsData });
        } else {
          setActualRating(0);
          setActualReviewCount(0);
          console.log("No reviews found for restaurant:", restaurantId);
        }
      });

      // Subscribe to menu items
      console.log("Looking for menu items with stallId:", restaurantId);
      const menuUnsubscribe = subscribeToQuery("menuItems", "stallId", "==", restaurantId, (items) => {
        console.log("Menu items loaded for restaurant:", restaurantId, items);
        const sortedItems = items
          .filter(item => item.isAvailable)
          .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
        setMenuItems(sortedItems);
      });

      return () => {
        console.log("Cleaning up subscriptions for restaurant:", restaurantId);
        clearInterval(pickupTimeInterval);
        menuUnsubscribe();
        reviewsUnsubscribe();
      };
    } else {
      // Reset state when no restaurant ID
      console.log("No restaurant ID, resetting state");
      setReviews([]);
      setReviewsWithOrderDetails([]);
      setActualRating(0);
      setActualReviewCount(0);
      setIsLoading(true);
    }
  }, [restaurantId]);

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleAddToCart = async () => {
    if (!selectedItem || !state.user) return;

    // Check stock availability
    const availableStock = selectedItem.stock ?? 0;
    if (availableStock === 0) {
      toast({
        title: "Out of Stock",
        description: `${selectedItem.name} is currently out of stock.`,
        variant: "destructive",
      });
      return;
    }

    if (quantity > availableStock) {
      toast({
        title: "Insufficient Stock",
        description: `Only ${availableStock} item(s) available. Please reduce the quantity.`,
        variant: "destructive",
      });
      return;
    }

    try {
      const selectedCustomizations = Object.entries(customizations)
        .filter(([_, selected]) => selected)
        .map(([key, _]) => {
          const custom = selectedItem.customizations?.find(c => c.name === key);
          return custom ? { name: key, price: custom.price || 0 } : { name: key, price: 0 };
        });

      await addDocument("cartItems", {
        userId: state.user.id,
        menuItemId: selectedItem.id,
        stallId: restaurantId,
        name: selectedItem.name,
        image: selectedItem.image,
        price: selectedItem.price,
        quantity,
        customizations: selectedCustomizations.length > 0 ? selectedCustomizations : [],
        specialInstructions: specialInstructions || null,
      });

      toast({
        title: "Added to cart!",
        description: `${selectedItem.name} has been added to your cart.`,
      });

      setIsDialogOpen(false);
      setQuantity(1);
      setCustomizations({});
      setSpecialInstructions("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add item to cart.",
        variant: "destructive",
      });
    }
  };

  const openCustomization = (item: MenuItemType) => {
    setSelectedItem(item);
    setQuantity(1);
    setCustomizations({});
    setSpecialInstructions("");
    setIsDialogOpen(true);
  };

  if (!stall) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900">Loading...</h3>
          <p className="text-gray-600">Fetching restaurant details</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Desktop optimized */}
      <motion.div 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="bg-white shadow-sm sticky top-0 z-40"
      >
        <div className="bg-[#820d2a] md:py-4">
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
            <div className="flex items-center justify-between py-3 md:py-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLocation("/")}
                className="rounded-full text-white hover:bg-red-700"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-2 md:gap-3">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleInfo}
                  data-testid="button-info"
                  className="rounded-full text-white hover:bg-red-700"
                >
                  <Info className="w-5 h-5" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleFavorite}
                  disabled={isFavoriteLoading}
                  data-testid="button-favorite"
                  className="rounded-full text-white hover:bg-red-700"
                >
                  <Heart className={`w-5 h-5 transition-colors ${
                    liked ? "fill-red-500" : ""
                  }`} />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleShare}
                  data-testid="button-share"
                  className="rounded-full text-white hover:bg-red-700"
                >
                  <Share className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Restaurant Hero Section - Desktop optimized */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white border-b"
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-12">
          <div className="flex flex-col md:flex-row md:items-start md:gap-8 lg:gap-12">
            {stall.image && (
              <div className="hidden md:block">
                <img 
                  src={stall.image} 
                  alt={stall.name}
                  className="w-32 h-32 lg:w-40 lg:h-40 rounded-xl object-cover shadow-md"
                />
              </div>
            )}
            <div className="flex md:hidden items-center mb-4">
              {stall.image && (
                <img 
                  src={stall.image} 
                  alt={stall.name}
                  className="w-16 h-16 rounded-lg mr-4 object-cover"
                />
              )}
              <div className="flex-1">
                <h1 className="text-xl font-bold text-gray-900">{stall.name}</h1>
                <div className="flex items-center gap-1 mt-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="text-sm font-medium">
                    {actualRating > 0 ? actualRating.toString() : "No ratings"}
                  </span>
                  {actualReviewCount > 0 && (
                    <span className="text-sm text-gray-600">({actualReviewCount} ratings)</span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex-1">
              <h1 className="hidden md:block text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
                {stall.name}
              </h1>
              <div className="hidden md:flex items-center gap-2 mb-4">
                <Star className="w-6 h-6 text-yellow-400 fill-current" />
                <span className="text-xl font-semibold">
                  {actualRating > 0 ? actualRating.toString() : "No ratings"}
                </span>
                {actualReviewCount > 0 && (
                  <span className="text-lg text-gray-600">({actualReviewCount} ratings)</span>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm md:text-base text-gray-600">
                <Clock className="w-5 h-5 md:w-6 md:h-6 text-[#820d2a]" />
                <span className="font-medium">Pickup ready in {pickupTime}</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Search Bar - Desktop optimized */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-white border-b md:bg-gray-50 md:py-6"
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-4 md:py-0">
          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder={`Search in ${stall.name}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 md:h-12 md:text-base bg-white border-gray-300 shadow-sm"
            />
          </div>
        </div>
      </motion.div>

      {/* Menu Items - Desktop optimized */}
      <div className="max-w-7xl mx-auto px-2 md:px-6 lg:px-8 py-4 md:py-12 pb-24 md:pb-12">
        <h2 className="hidden md:block text-2xl font-bold text-gray-900 mb-8">Menu</h2>
        <div className="grid grid-cols-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-6">
          <AnimatePresence>
            {filteredItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: 0.05 * index }}
                onClick={() => openCustomization(item)}
                className="bg-white rounded-lg md:rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-pointer group"
              >
                {item.image && (
                  <div className="relative w-full h-24 md:h-56 bg-gray-100 overflow-hidden">
                    <img 
                      src={item.image} 
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-1 right-1 md:top-3 md:right-3 flex gap-1 md:gap-2 flex-col md:flex-row">
                      {item.isPopular && (
                        <Badge className="bg-blue-500 text-white shadow-lg text-[10px] md:text-xs px-1 py-0 md:px-2 md:py-1">NEW</Badge>
                      )}
                      {(item.stock ?? 0) === 0 && (
                        <Badge className="bg-gray-900 text-white shadow-lg text-[10px] md:text-xs px-1 py-0 md:px-2 md:py-1">Out</Badge>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="p-2 md:p-5">
                  <h3 className="font-semibold text-gray-900 text-xs md:text-lg mb-0.5 md:mb-2 line-clamp-1">
                    {item.name}
                  </h3>
                  <p className="hidden md:block text-sm text-gray-600 mb-4 line-clamp-2 min-h-[40px]">
                    {item.description}
                  </p>
                  <div className="flex flex-col md:flex-row items-start md:items-center md:justify-between gap-1 md:gap-0">
                    <div className="flex flex-col gap-0.5 md:gap-1">
                      <span className="font-bold text-[#820d2a] text-sm md:text-xl">₱{item.price}</span>
                      {(item.stock ?? 0) > 0 && (item.stock ?? 0) < 10 && (
                        <span className="text-[10px] md:text-xs text-orange-600 font-medium">{item.stock} left</span>
                      )}
                    </div>
                    <Button
                      size="icon"
                      disabled={!item.isAvailable || (item.stock ?? 0) === 0}
                      className="rounded-full w-7 h-7 md:w-11 md:h-11 bg-[#820d2a] hover:bg-[#6a0a22] disabled:opacity-50 disabled:cursor-not-allowed shadow-md self-end md:self-auto"
                      onClick={(e) => {
                        e.stopPropagation();
                        openCustomization(item);
                      }}
                    >
                      <Plus className="w-3 h-3 md:w-5 md:h-5" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
            
            {filteredItems.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full text-center py-16"
              >
                <p className="text-gray-600 text-lg">No items found</p>
                <p className="text-sm text-gray-500 mt-2">Try adjusting your search</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Student Reviews Section - Desktop optimized */}
      <div className="bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12 mb-24 md:mb-0">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 md:mb-8">Student Reviews</h2>
        
        {isLoading ? (
          <div className="text-center py-4">
            <p className="text-gray-600">Loading reviews...</p>
          </div>
        ) : reviewsWithOrderDetails && reviewsWithOrderDetails.length > 0 ? (
          <div>
            <div className="space-y-4">
              {reviewsWithOrderDetails
                .slice((currentPage - 1) * reviewsPerPage, currentPage * reviewsPerPage)
                .map((review) => (
              <div
                key={review.id}
                className="border-b pb-4 last:border-b-0"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    {/* Profile Picture or Initial */}
                    <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-[#6d031e]">
                      {(review.userProfile?.photoURL || review.userProfile?.profilePicture) ? (
                        <img 
                          src={review.userProfile?.photoURL || review.userProfile?.profilePicture} 
                          alt="Profile"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.log("Image failed to load:", e.currentTarget.src);
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <span className="text-white font-medium text-sm">
                          {(review.userProfile?.fullName || review.userProfile?.name || review.userName || review.studentName || review.userEmail || 'S').charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {review.userProfile?.fullName || review.userProfile?.name || review.userName || review.studentName || review.userEmail || 'Student'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {review.userProfile?.studentId || review.studentId ? `ID: ${review.userProfile?.studentId || review.studentId}` : 'UB Student'}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < review.rating
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                        <span className="text-sm text-gray-600 ml-1">({review.rating}/5)</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">
                    {review.createdAt ? new Date(review.createdAt.toDate()).toLocaleDateString() : 'Recent'}
                  </span>
                </div>
                {review.comment && (
                  <p className="text-sm text-gray-700 ml-13">{review.comment}</p>
                )}
                {/* Show order items instead of just order ID */}
                {review.orderItems && review.orderItems.length > 0 && (
                  <div className="mt-2 ml-13">
                    <p className="text-xs text-gray-500 mb-1">Ordered:</p>
                    <div className="flex flex-wrap gap-1">
                      {review.orderItems.map((item: any, index: number) => (
                        <span
                          key={index}
                          className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full"
                        >
                          {item.quantity}x {item.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Pagination Controls */}
          {reviewsWithOrderDetails.length > reviewsPerPage && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                data-testid="button-prev-page"
                className="text-sm"
              >
                Previous
              </Button>
              
              {Array.from({ length: Math.ceil(reviewsWithOrderDetails.length / reviewsPerPage) }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  data-testid={`button-page-${page}`}
                  className={currentPage === page ? "bg-[#6d031e] hover:bg-[#820d2a]" : ""}
                >
                  {page}
                </Button>
              ))}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(Math.ceil(reviewsWithOrderDetails.length / reviewsPerPage), prev + 1))}
                disabled={currentPage === Math.ceil(reviewsWithOrderDetails.length / reviewsPerPage)}
                data-testid="button-next-page"
                className="text-sm"
              >
                Next
              </Button>
            </div>
          )}
          </div>
        ) : (
          <div className="text-center py-8">
            <Star className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Reviews Yet</h3>
            <p className="text-gray-600 mb-4">
              Only students who have ordered can leave reviews
            </p>
            <Button
              variant="outline"
              onClick={() => {
                // Navigate to orders or suggest ordering
                toast({
                  title: "Order first to review",
                  description: "Place an order to share your experience!",
                });
              }}
              className="text-[#6d031e] border-[#6d031e] hover:bg-[#6d031e] hover:text-white"
            >
              Order first to review
            </Button>
          </div>
        )}
        </div>
      </div>

      {/* Customization Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md md:max-w-xl lg:max-w-2xl mx-auto max-h-[90vh] overflow-y-auto p-0">
          {selectedItem && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col"
            >
              {selectedItem.image && (
                <div className="relative w-full h-64 sm:h-72 md:h-64 lg:h-72 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden border-b">
                  <img 
                    src={selectedItem.image} 
                    alt={selectedItem.name}
                    className="w-full h-full object-contain p-4 md:p-6"
                  />
                  {selectedItem.isPopular && (
                    <Badge className="absolute top-4 right-4 bg-blue-500 text-white shadow-lg">
                      NEW
                    </Badge>
                  )}
                </div>
              )}

              <div className="p-4 sm:p-5 md:p-6 space-y-3 md:space-y-4">
                <div className="space-y-2">
                  <DialogTitle className="text-xl md:text-2xl font-bold text-left">
                    {selectedItem.name}
                  </DialogTitle>
                  <p className="text-muted-foreground text-left text-sm leading-relaxed">
                    {selectedItem.description}
                  </p>
                  <p className="text-xl md:text-2xl font-bold text-[#820d2a] text-left">
                    ₱{selectedItem.price.toFixed(2)}
                  </p>
                </div>

                {selectedItem.customizations && selectedItem.customizations.length > 0 && (
                  <div className="space-y-2 pt-3 border-t">
                    <div>
                      <Label className="text-base md:text-lg font-semibold">Customize Your Order</Label>
                      <p className="text-xs md:text-sm text-muted-foreground mt-1">Select your preferred add-ons</p>
                    </div>
                    <div className="grid gap-2">
                      {selectedItem.customizations.map((custom, index) => (
                        <div 
                          key={index} 
                          className="flex items-center gap-3 p-3 border-2 rounded-lg hover-elevate transition-all cursor-pointer"
                          onClick={() => setCustomizations({...customizations, [custom.name]: !customizations[custom.name]})}
                        >
                          <Checkbox 
                            checked={customizations[custom.name] || false}
                            onCheckedChange={(checked) => setCustomizations({...customizations, [custom.name]: checked})}
                            className="h-5 w-5"
                            data-testid={`checkbox-customization-${index}`}
                          />
                          <div className="flex-1">
                            <Label className="text-sm md:text-base font-medium cursor-pointer">
                              {custom.name}
                            </Label>
                          </div>
                          <span className="text-sm font-semibold text-[#820d2a]">
                            {custom.price > 0 ? `+₱${custom.price.toFixed(2)}` : 'Free'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-muted-foreground">Quantity</span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={quantity <= 1}
                        className="rounded-full h-9 w-9"
                        data-testid="button-decrease-quantity"
                      >
                        -
                      </Button>
                      <span className="text-lg font-bold w-10 text-center" data-testid="text-quantity">{quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setQuantity(Math.min((selectedItem?.stock ?? 0), quantity + 1))}
                        disabled={quantity >= (selectedItem?.stock ?? 0)}
                        className="rounded-full h-9 w-9"
                        data-testid="button-increase-quantity"
                      >
                        +
                      </Button>
                    </div>
                  </div>
                  <Button
                    onClick={handleAddToCart}
                    className="w-full sm:w-auto bg-[#820d2a] hover:bg-[#6a0a22] text-white px-6 py-5 text-sm md:text-base font-semibold shadow-lg"
                    data-testid="button-add-to-cart"
                  >
                    Add to Cart - ₱{(selectedItem.price * quantity + Object.entries(customizations).reduce((sum, [name, checked]) => {
                      if (!checked) return sum;
                      const custom = selectedItem.customizations?.find(c => c.name === name);
                      return sum + (custom?.price || 0);
                    }, 0)).toFixed(2)}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </DialogContent>
      </Dialog>

      <BottomNav />
      <FloatingCart />
    </div>
  );
}