import { useState, useEffect } from "react";
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
import NotificationCenter from "@/components/notifications/notification-center";
import NotificationBell from "@/components/notifications/notification-bell";
import { Search, MapPin, Clock, Star, Award, Bell } from "lucide-react";
import { subscribeToCollection } from "@/lib/firebase";
import { useStore } from "@/lib/store";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [stalls, setStalls] = useState<any[]>([]);
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const { state } = useStore();

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

  useEffect(() => {
    setIsLoading(true);
    // Subscribe to real-time stalls data
    const unsubscribe = subscribeToCollection("stalls", (stallsData) => {
      // Only show active stalls
      const activeStalls = stallsData.filter((stall) => stall.isActive);
      setStalls(activeStalls);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredStalls = stalls.filter((stall) => {
    const matchesSearch =
      stall.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stall.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      activeFilter === "all" ||
      stall.category.toLowerCase() === activeFilter.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  const categories = [
    "all",
    "Filipino",
    "Asian",
    "Western",
    "Snacks",
    "Beverages",
    "Desserts",
  ];

  return (
    <div className="min-h-screen bg-gray-50 md:pt-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#820d2a] via-[#820d2a] to-[#B22222] text-white sticky top-0 z-40 md:hidden">
        <div className="px-4 py-3 md:px-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              <span className="text-sm">University of Batangas</span>
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
          <p className="text-maroon-100 text-sm">
            What would you like to eat today?
          </p>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4 md:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Desktop Welcome Header */}
        <div className="hidden md:block mb-8">
          <div className="bg-gradient-to-r from-[#820d2a] via-[#820d2a] to-[#B22222] text-white rounded-2xl p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <MapPin className="w-6 h-6" />
                <span className="text-lg">University of Batangas</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-maroon-700 px-4 py-2 rounded-full">
                  <Award className="w-5 h-5" />
                  <span className="text-sm font-medium">
                    {state.user?.loyaltyPoints || 0} points
                  </span>
                </div>
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-2">
              Welcome back, {state.user?.fullName?.split(" ")[0] || "Student"}!
            </h1>
            <p className="text-maroon-100 text-lg">
              What would you like to eat today?
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search for food, restaurants..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white border-gray-200 md:h-12 md:text-base"
          />
        </div>

        {/* Quick Stats */}
        <Card className="bg-gradient-to-r from-maroon-50 to-maroon-100 border-maroon-200 md:p-2">
          <CardContent className="p-4 md:p-6">
            <div className="grid grid-cols-3 gap-4 text-center md:gap-8">
              <div>
                <div className="text-lg font-bold text-maroon-700 md:text-2xl">
                  {stalls.length}
                </div>
                <div className="text-xs text-maroon-600 md:text-sm">Active Stalls</div>
              </div>
              <div>
                <div className="text-lg font-bold text-maroon-700 md:text-2xl">
                  {state.user?.loyaltyPoints || 0}
                </div>
                <div className="text-xs text-maroon-600 md:text-sm">Loyalty Points</div>
              </div>
              <div>
                <div className="text-lg font-bold text-maroon-700 md:text-2xl">15-30</div>
                <div className="text-xs text-maroon-600 md:text-sm">Avg. Wait (min)</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 md:justify-center md:flex-wrap">
          {categories.map((category) => (
            <Button
              key={category}
              variant={activeFilter === category ? "default" : "outline"}
              size="sm" 
              onClick={() => setActiveFilter(category)}
              className={`flex-shrink-0 md:flex-shrink md:px-6 md:py-3 ${
                activeFilter === category
                  ? "bg-maroon-600 hover:bg-maroon-700"
                  : "border-maroon-200 text-maroon-700 hover:bg-maroon-50"
              }`}
            >
              {category === "all" ? "All" : category}
            </Button>
          ))}
        </div>

        {/* Featured Section */}
        {activeFilter === "all" && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3 md:text-xl">
              Featured Today
            </h2>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {stalls
                .filter((stall) => stall.rating > 4.0)
                .slice(0, 2)
                .map((stall) => (
                  <Card
                    key={stall.id}
                    className="bg-white border-gray-200 shadow-sm"
                  >
                    <CardContent className="p-4 md:p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 md:text-lg">
                            {stall.name}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1 md:text-base">
                            {stall.description}
                          </p>
                          <div className="flex items-center gap-3 mt-2">
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-yellow-400 fill-current" />
                              <span className="text-sm font-medium md:text-base">
                                {stall.rating || "4.5"}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-600 md:text-base">
                                {stall.deliveryTime || "15-30 min"}
                              </span>
                            </div>
                            <Badge variant="outline" className="text-xs md:text-sm">
                              {stall.category}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        )}

        {/* Stalls Grid */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3 md:text-xl">
            {activeFilter === "all" ? "All Stalls" : `${activeFilter} Stalls`}
          </h2>

          {isLoading ? (
            <Card className="bg-white border-gray-200">
              <CardContent className="p-8 text-center md:p-12">
                <LoadingIndicator
                  message="Fetching stalls..."
                  variant="logo"
                  size="lg"
                />
              </CardContent>
            </Card>
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
                    rating: stall.rating?.toString() || "4.5",
                    reviewCount: stall.reviewCount || 0,
                    deliveryTime: stall.deliveryTime || "15-30 min",
                    priceRange: stall.priceRange || "₱50-200",
                    category: stall.category,
                    deliveryFee: stall.deliveryFee || "₱10",
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Bottom Spacing for Navigation */}
        <div className="h-20 md:h-8"></div>
      </div>

      <BottomNav />
      <FloatingCart />

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
