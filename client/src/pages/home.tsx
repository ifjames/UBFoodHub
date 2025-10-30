import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import RestaurantCard from "@/components/restaurant-card";
import BottomNav from "@/components/layout/bottom-nav";
import FloatingCart from "@/components/floating-cart";
import LoadingIndicator from "@/components/loading-indicator";
import LoadingOverlay from "@/components/loading-overlay";
import StallLoadingScreen from "@/components/stall-loading-screen";
import StallSkeleton from "@/components/stall-skeleton";
import NotificationCenter from "@/components/notifications/notification-center";
import NotificationBell from "@/components/notifications/notification-bell";
import { Search, Clock, Star, Award, Bell } from "lucide-react";
import { subscribeToCollection, getDocuments, getUserFavorites, subscribeToQuery } from "@/lib/firebase";
import { useStore } from "@/lib/store";
import { usePageTitle } from "@/hooks/use-page-title";

export default function Home() {
  usePageTitle("Home");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [stalls, setStalls] = useState<any[]>([]);
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingRatings, setIsLoadingRatings] = useState(true);
  const [showSkeletons, setShowSkeletons] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [stallRatings, setStallRatings] = useState<{[key: string]: {rating: number, reviewCount: number}}>({});
  const [categories, setCategories] = useState<string[]>([]);
  const [userFavorites, setUserFavorites] = useState<string[]>([]);
  const { state } = useStore();

  // Drag-to-scroll functionality for category filters
  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!categoryScrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - categoryScrollRef.current.offsetLeft);
    setScrollLeft(categoryScrollRef.current.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !categoryScrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - categoryScrollRef.current.offsetLeft;
    const walk = (x - startX) * 2; // Multiply by 2 for faster scrolling
    categoryScrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  // Redirect admin and stall owners to their dashboards
  useEffect(() => {
    if (state.user?.role === 'admin') {
      window.location.href = '/admin';
      return;
    }
    if (state.user?.role === 'stall_owner') {
      window.location.href = '/stall-dashboard';
      return;
    }
  }, [state.user?.role]);

  // Test notification function (for development)
  const sendTestNotification = () => {
    // Only run if notifications are enabled
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('UB FoodHub', {
        body: 'Your order is ready for pickup!',
        icon: '/logo.png',
        badge: '/logo.png',
        tag: 'order-ready',
        requireInteraction: true,
      });
    }
  };

  // Calculate real ratings for all stalls (optimized with parallel fetching)
  const calculateStallRatings = async (stallsData: any[]) => {
    try {
      const ratingsMap: {[key: string]: {rating: number, reviewCount: number}} = {};
      
      // Fetch all reviews in parallel for better performance
      const reviewPromises = stallsData.map(stall => 
        getDocuments("reviews", "stallId", "==", stall.id)
          .then(reviews => ({ stallId: stall.id, reviews }))
          .catch(error => {
            console.error(`Error fetching reviews for stall ${stall.id}:`, error);
            return { stallId: stall.id, reviews: [] };
          })
      );

      const stallReviews = await Promise.allSettled(reviewPromises);
      
      stallReviews.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          const { stallId, reviews } = result.value;
          if (reviews.length > 0) {
            const totalRating = reviews.reduce((sum: number, review: any) => sum + review.rating, 0);
            const averageRating = totalRating / reviews.length;
            ratingsMap[stallId] = {
              rating: Math.round(averageRating * 10) / 10,
              reviewCount: reviews.length
            };
          } else {
            ratingsMap[stallId] = {
              rating: 0,
              reviewCount: 0
            };
          }
        } else {
          // Fallback for failed requests
          const stallId = stallsData[index]?.id;
          if (stallId) {
            ratingsMap[stallId] = {
              rating: 0,
              reviewCount: 0
            };
          }
        }
      });
      
      setStallRatings(ratingsMap);
    } catch (error) {
      console.error("Error calculating stall ratings:", error);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    // Subscribe to real-time stalls data
    const unsubscribe = subscribeToCollection("stalls", async (stallsData) => {
      // Only show active stalls
      const activeStalls = stallsData.filter((stall) => stall.isActive);
      setStalls(activeStalls);
      
      // Set loading to false immediately after stalls are loaded
      setIsLoading(false);
      
      // Show skeletons briefly then load additional data
      setShowSkeletons(true);
      setTimeout(() => setShowSkeletons(false), 800);
      
      // Optimized: Start these calculations in background after displaying stalls
      setIsLoadingRatings(true);
      setTimeout(async () => {
        await calculateStallRatings(activeStalls);
        setIsLoadingRatings(false);
      }, 100);
    });

    // Subscribe to categories from Firebase
    const unsubscribeCategories = subscribeToCollection("categories", (categoriesData) => {
      const categoryNames = categoriesData
        .filter(cat => cat.isActive !== false) // Only show active categories
        .sort((a, b) => {
          // Sort by order if available, then alphabetically
          if (a.order !== undefined && b.order !== undefined) {
            return a.order - b.order;
          }
          if (a.order !== undefined) return -1;
          if (b.order !== undefined) return 1;
          return a.name.localeCompare(b.name);
        })
        .map(cat => cat.name);
      setCategories(['all', ...categoryNames]);
    });

    return () => {
      unsubscribe();
      unsubscribeCategories();
    };
  }, []);

  // Load user favorites with real-time updates
  useEffect(() => {
    if (state.user?.uid) {
      const unsubscribeFavorites = subscribeToQuery(
        "favorites",
        "userId",
        "==",
        state.user.uid,
        (favoritesData) => {
          const favoriteStallIds = favoritesData.map(fav => fav.stallId);
          setUserFavorites(favoriteStallIds);
        }
      );

      return () => {
        unsubscribeFavorites();
      };
    }
  }, [state.user?.uid]);

  const filteredStalls = stalls.filter((stall) => {
    const matchesSearch =
      stall.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (stall.category && stall.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (stall.categories && stall.categories.some((cat: string) => cat.toLowerCase().includes(searchQuery.toLowerCase())));
    
    const matchesFilter =
      activeFilter === "all" ||
      (stall.category && stall.category.toLowerCase() === activeFilter.toLowerCase()) ||
      (stall.categories && stall.categories.some((cat: string) => cat.toLowerCase() === activeFilter.toLowerCase()));
    return matchesSearch && matchesFilter;
  }).sort((a, b) => {
    // Sort favorites first, then alphabetical
    // Check both string and numeric ID formats since Firebase uses string IDs
    const aIsFavorite = userFavorites.includes(a.id) || userFavorites.includes(a.id.toString());
    const bIsFavorite = userFavorites.includes(b.id) || userFavorites.includes(b.id.toString());
    
    if (aIsFavorite && !bIsFavorite) return -1;
    if (!aIsFavorite && bIsFavorite) return 1;
    return a.name.localeCompare(b.name);
  });



  return (
    <div className="min-h-screen bg-gray-50 md:pt-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#820d2a] via-[#820d2a] to-[#B22222] text-white sticky top-0 z-40 md:hidden">
        <div className="px-4 py-3 md:px-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="UB FoodHub" className="h-8" />
              <span className="text-sm font-semibold">UB FoodHub</span>
            </div>
            <div className="flex items-center gap-3">
              {/* Loyalty Points */}
              <div className="flex items-center gap-1 bg-maroon-700 px-2 py-1 rounded-full">
                <Award className="w-4 h-4" />
                <span className="text-xs font-medium">
                  {state.user?.loyaltyPoints || 0} pts
                </span>
              </div>
              <NotificationBell />
            </div>
          </div>

          <h1 className="text-xl font-bold mb-1">
            Welcome back, {state.user?.fullName?.split(" ")[0] || "Student"}!
          </h1>
          <p className="text-maroon-100 text-sm mb-3">
            What would you like to eat today?
          </p>
          
          {/* Search Bar - Mobile */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search for food, restaurants..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white text-gray-900 border-gray-200"
            />
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4 md:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Desktop Welcome Header */}
        <div className="hidden md:block mb-8">
          <div className="bg-gradient-to-r from-[#820d2a] via-[#820d2a] to-[#B22222] text-white rounded-2xl p-8">
            <h1 className="text-3xl font-bold mb-2">
              Welcome back, {state.user?.fullName?.split(" ")[0] || "Student"}!
            </h1>
            <p className="text-maroon-100 text-lg mb-4">
              What would you like to eat today?
            </p>
            
            {/* Search Bar - Desktop */}
            <div className="relative max-w-3xl mx-auto">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search for food, restaurants..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 bg-white text-gray-900 border-gray-200 h-12 text-base"
              />
            </div>
          </div>
        </div>

        {/* Category Filter */}
        <div 
          ref={categoryScrollRef}
          className={`flex gap-2 overflow-x-auto pb-2 md:justify-center md:flex-wrap scrollbar-hide select-none ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          } md:cursor-default`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          style={{ scrollBehavior: isDragging ? 'auto' : 'smooth' }}
        >
          {categories.map((category) => (
            <Button
              key={category}
              variant={activeFilter === category ? "default" : "outline"}
              size="sm" 
              onClick={(e) => {
                // Prevent click during drag
                if (isDragging) {
                  e.preventDefault();
                  return;
                }
                setActiveFilter(category);
              }}
              className={`flex-shrink-0 md:flex-shrink md:px-6 md:py-3 ${
                activeFilter === category
                  ? "bg-[#6d031e] hover:bg-[#8b0426] text-white"
                  : "border-[#6d031e]/20 text-[#6d031e] hover:bg-[#6d031e]/10 hover:text-[#6d031e]"
              }`}
            >
              {category === "all" ? "All" : category}
            </Button>
          ))}
        </div>

        {/* Stalls Grid */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3 md:text-xl">
            {activeFilter === "all" ? "All Stalls" : `${activeFilter} Stalls`}
          </h2>

          {isLoading || showSkeletons ? (
            <StallSkeleton count={6} />
          ) : filteredStalls.length === 0 ? (
            <Card className="bg-white border-gray-200">
              <CardContent className="p-8 text-center md:p-12">
                <div className="text-gray-400 mb-2">No stalls found</div>
                <p className="text-sm text-gray-600">
                  {searchQuery
                    ? "Try adjusting your search terms"
                    : "No stalls available in this category"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredStalls.map((stall) => (
                <RestaurantCard
                  key={stall.id}
                  restaurant={{
                    id: stall.id,
                    name: stall.name,
                    description: stall.description,
                    image: stall.image,
                    rating: stallRatings[stall.id]?.rating > 0 
                      ? stallRatings[stall.id].rating.toString() 
                      : "0",
                    reviewCount: stallRatings[stall.id]?.reviewCount || 0,
                    deliveryTime: stall.deliveryTime || "15-30 min",
                    priceRange: stall.priceRange || "₱50-200",
                    category: stall.category,
                    deliveryFee: stall.deliveryFee || "Free"
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Bottom Spacing for Navigation */}
        <div className="h-20 md:h-8"></div>
      </div>

      {/* Only show bottom nav and floating cart for students */}
      {state.user?.role === 'student' && (
        <>
          <BottomNav />
          <FloatingCart />
        </>
      )}

      {/* Loading Overlay */}
      <LoadingOverlay
        isVisible={showLoadingOverlay}
        message={loadingMessage}
        onClose={() => setShowLoadingOverlay(false)}
      />
      
      {/* Notification Center */}
      <NotificationCenter
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        unreadCount={unreadNotificationCount}
        onUpdateCount={setUnreadNotificationCount}
      />
    </div>
  );
}
