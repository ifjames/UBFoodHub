import { useState, useEffect } from "react";
import { Search, ArrowLeft, Filter, Clock, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useLocation } from "wouter";
import { subscribeToCollection } from "@/lib/firebase";
import BottomNav from "@/components/layout/bottom-nav";
import RestaurantCard from "@/components/restaurant-card";
import { motion, AnimatePresence } from "framer-motion";

export default function SearchPage() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Load restaurants from Firestore
  useEffect(() => {
    const unsubscribe = subscribeToCollection("stalls", (stallsData) => {
      const activeStalls = stallsData.filter(stall => stall.isActive);
      setRestaurants(activeStalls);
    });

    return () => unsubscribe();
  }, []);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("recentSearches");
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    
    // Simulate search delay for better UX
    setTimeout(() => {
      const results = restaurants.filter((restaurant: any) =>
        restaurant.name.toLowerCase().includes(query.toLowerCase()) ||
        restaurant.category.toLowerCase().includes(query.toLowerCase()) ||
        restaurant.description?.toLowerCase().includes(query.toLowerCase())
      );
      
      setSearchResults(results);
      setIsSearching(false);

      // Save to recent searches
      const updatedSearches = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
      setRecentSearches(updatedSearches);
      localStorage.setItem("recentSearches", JSON.stringify(updatedSearches));
    }, 300);
  };

  const handleRecentSearch = (query: string) => {
    handleSearch(query);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem("recentSearches");
  };

  return (
    <div className="min-h-screen bg-gray-50 md:pt-20">
      {/* Header */}
      <div className="bg-white sticky top-0 z-10 border-b border-gray-200 md:hidden">
        <div className="flex items-center gap-4 p-4 bg-[#820d2a] md:px-6">
          <Button 
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/")}
            className="p-2 text-white hover:bg-red-700"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search restaurants, food, or category..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 pr-10 md:h-12 md:text-base"
              autoFocus
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setSearchResults([]);
                }}
                className="absolute right-1 top-1 p-2 h-8 w-8"
              >
                ×
              </Button>
            )}
          </div>
          
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      {/* Desktop Header */}
      <div className="hidden md:block bg-white border-b border-gray-200 sticky top-20 z-10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Search Restaurants</h1>
          <div className="flex items-center gap-4">
            <div className="flex-1 relative max-w-2xl">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search restaurants, food, or category..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-12 pr-12 h-12 text-base"
                autoFocus
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setSearchResults([]);
                  }}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 h-8 w-8"
                >
                  ×
                </Button>
              )}
            </div>
            <Button variant="outline" className="h-12 px-6">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
        </div>
      </div>
      
      <div className="p-4 pb-20 md:px-6 lg:px-8 max-w-7xl mx-auto md:pb-8">
        <AnimatePresence mode="wait">
          {!searchQuery ? (
            <motion.div
              key="no-search"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 md:text-xl">Recent Searches</h3>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={clearRecentSearches}
                      className="text-maroon-600 hover:text-maroon-700"
                    >
                      Clear all
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 md:gap-3">
                    {recentSearches.map((search, index) => (
                      <motion.button
                        key={search}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => handleRecentSearch(search)}
                        className="bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-full text-sm text-gray-700 transition-colors md:px-4 md:py-3 md:text-base"
                      >
                        <Clock className="w-3 h-3 inline-block mr-1" />
                        {search}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* Popular Categories */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 md:text-xl">Popular Categories</h3>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                  {["Filipino", "Asian", "Beverages", "Snacks", "Rice Meals", "Desserts"].map((category, index) => (
                    <motion.button
                      key={category}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => handleSearch(category)}
                      className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:border-maroon-300 hover:shadow-md transition-all text-left md:p-6"
                    >
                      <div className="text-sm font-medium text-gray-900 md:text-base">{category}</div>
                      <div className="text-xs text-gray-500 mt-1 md:text-sm">
                        {restaurants.filter(r => r.category === category).length} restaurants
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* All Restaurants */}
              {restaurants.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 md:text-xl">All Restaurants</h3>
                  <div className="space-y-4 md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:gap-4 md:space-y-0">
                    {restaurants.map((restaurant, index) => (
                      <motion.div
                        key={restaurant.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <RestaurantCard restaurant={restaurant} />
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="search-results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {isSearching ? (
                <div className="flex flex-col items-center justify-center py-12 md:py-20">
                  <Spinner showLogo size="lg" />
                  <p className="text-gray-500 mt-4">Searching for "{searchQuery}"...</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 md:text-xl">
                      Search Results ({searchResults.length})
                    </h3>
                  </div>

                  {searchResults.length > 0 ? (
                    <div className="space-y-4 md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:gap-4 md:space-y-0">
                      {searchResults.map((restaurant, index) => (
                        <motion.div
                          key={restaurant.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <RestaurantCard restaurant={restaurant} />
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-12 md:py-20"
                    >
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 md:text-xl">No results found</h3>
                      <p className="text-gray-500 text-sm md:text-base">
                        Try searching for something else or check your spelling
                      </p>
                    </motion.div>
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <BottomNav />
    </div>
  );
}