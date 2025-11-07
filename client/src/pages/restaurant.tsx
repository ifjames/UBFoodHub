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
import { getDocument, subscribeToQuery, addDocument, getDocuments } from "@/lib/firebase";
import { usePageTitle } from "@/hooks/use-page-title";

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
  const [dynamicCompletionTime, setDynamicCompletionTime] = useState<string>("");
  
  // Debug effect to track reviews state changes
  useEffect(() => {
    console.log("Reviews state changed:", reviews);
  }, [reviews]);

  const restaurantId = params.id;

  // Calculate dynamic order completion time based on completed orders
  const calculateCompletionTime = async (stallId: string) => {
    try {
      const completedOrders = await getDocuments("orders", "stallId", "==", stallId);
      const ordersWithTimes = completedOrders.filter(
        (order: any) => order.status === "completed" && order.createdAt && order.updatedAt
      );

      if (ordersWithTimes.length > 0) {
        const totalMinutes = ordersWithTimes.reduce((sum: number, order: any) => {
          const createdAt = order.createdAt.toDate();
          const updatedAt = order.updatedAt.toDate();
          const diffMs = updatedAt - createdAt;
          const diffMinutes = Math.floor(diffMs / (1000 * 60));
          return sum + diffMinutes;
        }, 0);

        const avgMinutes = Math.round(totalMinutes / ordersWithTimes.length);
        const minTime = Math.max(10, avgMinutes - 5);
        const maxTime = avgMinutes + 5;
        setDynamicCompletionTime(`${minTime}-${maxTime} min`);
      } else {
        setDynamicCompletionTime("15-30 min");
      }
    } catch (error) {
      console.error("Error calculating completion time:", error);
      setDynamicCompletionTime("15-30 min");
    }
  };

  useEffect(() => {
    if (restaurantId) {
      // Get stall information
      getDocument("stalls", restaurantId).then((doc) => {
        if (doc.exists()) {
          setStall({ id: doc.id, ...doc.data() });
          // Calculate dynamic order completion time
          calculateCompletionTime(restaurantId);
        }
      });

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
      {/* Header */}
      <motion.div 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="bg-white shadow-sm sticky top-0 z-40"
      >
        <div className="flex items-center justify-between p-4 bg-[#820d2a]">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/")}
            className="rounded-full text-white hover:bg-red-700"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="rounded-full text-white hover:bg-red-700">
              <Info className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full text-white hover:bg-red-700">
              <Heart className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full text-white hover:bg-red-700">
              <Share className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Restaurant Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white p-4 md:p-6 mb-2"
      >
        <div className="flex items-center mb-2 md:mb-4">
          {stall.image && (
            <img 
              src={stall.image} 
              alt={stall.name}
              className="w-16 h-16 md:w-24 md:h-24 rounded-lg mr-4 object-cover"
            />
          )}
          <div className="flex-1">
            <h1 className="text-xl md:text-3xl font-bold text-gray-900">{stall.name}</h1>
            <div className="flex items-center gap-1 mt-1 md:mt-2">
              <Star className="w-4 h-4 md:w-5 md:h-5 text-yellow-400 fill-current" />
              <span className="text-sm md:text-base font-medium">
                {actualRating > 0 ? actualRating.toString() : "No ratings"}
              </span>
              {actualReviewCount > 0 && (
                <span className="text-sm md:text-base text-gray-600">({actualReviewCount} ratings)</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 text-sm md:text-base text-gray-600 mb-4">
          <Clock className="w-4 h-4 md:w-5 md:h-5" />
          <span>Pickup ready in {dynamicCompletionTime || "15-30 min"}</span>
        </div>


      </motion.div>



      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-white p-4 mb-2"
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder={`Search in ${stall.name}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-gray-50 border-gray-200"
          />
        </div>
      </motion.div>

      {/* Menu Items */}
      <div className="p-4 space-y-4 pb-24 md:pb-8">
        {/* Desktop Grid Layout */}
        <div className="md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-6 md:max-w-7xl md:mx-auto md:space-y-0">
        <AnimatePresence>
          {filteredItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: 0.1 * index }}
              onClick={() => openCustomization(item)}
              className="bg-white rounded-lg p-4 md:p-6 shadow-sm hover:shadow-lg transition-all cursor-pointer mb-4 md:mb-0"
            >
              <div className="flex gap-4 md:flex-col">
                {/* Image First on Desktop */}
                {item.image && (
                  <div className="w-20 h-20 md:w-full md:h-40 rounded-lg bg-gray-100 overflow-hidden md:mb-4 order-2 md:order-1">
                    <img 
                      src={item.image} 
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                <div className="flex-1 order-1 md:order-2">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-gray-900 md:text-lg">{item.name}</h3>
                    <div className="flex gap-1">
                      {item.isPopular && (
                        <Badge className="bg-red-100 text-red-700 text-xs">NEW!</Badge>
                      )}
                      {(item.stock ?? 0) === 0 && (
                        <Badge className="bg-gray-100 text-gray-700 text-xs">Out of Stock</Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-sm md:text-base text-gray-600 mb-2 md:mb-4">{item.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-900 md:text-lg">₱{item.price}</span>
                      {(item.stock ?? 0) > 0 && (item.stock ?? 0) < 10 && (
                        <span className="text-xs text-yellow-600">Only {item.stock} left</span>
                      )}
                    </div>
                    <Button
                      size="sm"
                      disabled={!item.isAvailable || (item.stock ?? 0) === 0}
                      className="rounded-full w-8 h-8 md:w-10 md:h-10 p-0 bg-[#6d031e] hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={(e) => {
                        e.stopPropagation();
                        openCustomization(item);
                      }}
                    >
                      <Plus className="w-4 h-4 md:w-5 md:h-5" />
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
          
        {filteredItems.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 md:col-span-full"
          >
            <p className="text-gray-600">No items found</p>
            <p className="text-sm text-gray-500 mt-1">Try adjusting your search or category</p>
          </motion.div>
        )}
        </AnimatePresence>
        </div>
      </div>

      {/* Student Reviews Section */}
      <div className="bg-white p-4 md:p-6 mb-2">
        <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-4">Student Reviews</h2>
        
        {isLoading ? (
          <div className="text-center py-4">
            <p className="text-gray-600">Loading reviews...</p>
          </div>
        ) : reviewsWithOrderDetails && reviewsWithOrderDetails.length > 0 ? (
          <div className="space-y-4">
            {reviewsWithOrderDetails.map((review) => (
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



      {/* Customization Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md md:max-w-2xl mx-auto max-h-[90vh] overflow-y-auto">
          {selectedItem && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4"
            >
              <DialogHeader>
                {selectedItem.image && (
                  <div className="w-full h-48 rounded-lg bg-gray-100 overflow-hidden mb-4">
                    <img 
                      src={selectedItem.image} 
                      alt={selectedItem.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <DialogTitle className="text-xl md:text-2xl font-bold text-left">
                  {selectedItem.name}
                  {selectedItem.isPopular && (
                    <Badge className="bg-blue-100 text-blue-700 text-xs ml-2">NEW</Badge>
                  )}
                </DialogTitle>
                <p className="text-gray-600 text-left text-sm md:text-base">{selectedItem.description}</p>
                <p className="font-semibold text-left text-lg md:text-xl">₱{selectedItem.price}</p>
              </DialogHeader>

              {/* Dynamic Customizations */}
              <div className="space-y-4 md:space-y-6">
                {selectedItem.customizations && selectedItem.customizations.length > 0 && (
                  <div>
                    <Label className="text-base md:text-lg font-medium">Customization Options</Label>
                    <p className="text-sm md:text-base text-gray-600 mb-3">Optional add-ons</p>
                    <div className="space-y-2 md:space-y-3">
                      {selectedItem.customizations.map((custom, index) => (
                        <div key={index} className="flex items-center space-x-2 p-3 md:p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                          <Checkbox 
                            checked={customizations[custom.name] || false}
                            onCheckedChange={(checked) => setCustomizations({...customizations, [custom.name]: checked})}
                          />
                          <Label className="flex-1 cursor-pointer">
                            <span className="md:text-base">{custom.name}</span>
                            <span className="text-sm md:text-sm text-gray-600 block">
                              {custom.price > 0 ? `+₱${custom.price.toFixed(2)}` : 'Free'}
                            </span>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <Label className="text-base font-medium">Special instructions</Label>
                  <p className="text-sm text-gray-600 mb-3">Special requests are subject to the restaurant's approval. Tell us here!</p>
                  <Textarea
                    placeholder="e.g. no mayo"
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    className="resize-none"
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-500 mt-1">{specialInstructions.length}/500</p>
                </div>

                

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                      className="rounded-full"
                    >
                      -
                    </Button>
                    <span className="text-lg font-medium w-8 text-center">{quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setQuantity(Math.min((selectedItem?.stock ?? 0), quantity + 1))}
                      disabled={quantity >= (selectedItem?.stock ?? 0)}
                      className="rounded-full"
                    >
                      +
                    </Button>
                  </div>
                  <Button
                    onClick={handleAddToCart}
                    className="hover:bg-gray-900 text-white px-8 bg-[#820d2a]"
                  >
                    Add to cart
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