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
import { getDocument, subscribeToQuery, addDocument } from "@/lib/firebase";

interface MenuItemType {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string;
  isAvailable: boolean;
  isPopular: boolean;
  customizations?: Array<{ name: string; price: number }>;
}

export default function Restaurant() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { state } = useStore();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [stall, setStall] = useState<any>(null);
  const [menuItems, setMenuItems] = useState<MenuItemType[]>([]);
  const [selectedItem, setSelectedItem] = useState<MenuItemType | null>(null);
  const [customizations, setCustomizations] = useState<any>({});
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const restaurantId = params.id;

  useEffect(() => {
    if (restaurantId) {
      // Get stall information
      getDocument("stalls", restaurantId).then((doc) => {
        if (doc.exists()) {
          setStall({ id: doc.id, ...doc.data() });
        }
      });

      // Subscribe to menu items
      console.log("Looking for menu items with stallId:", restaurantId);
      const unsubscribe = subscribeToQuery("menuItems", "stallId", "==", restaurantId, (items) => {
        console.log("Menu items loaded for restaurant:", restaurantId, items);
        setMenuItems(items.filter(item => item.isAvailable));
      });

      return () => unsubscribe();
    }
  }, [restaurantId]);

  const categories = ["All", "Popular", "Main Course", "Appetizer", "Dessert", "Beverage", "Snack"];
  
  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "All" ? true :
                          activeCategory === "Popular" ? item.isPopular : 
                          item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddToCart = async () => {
    if (!selectedItem || !state.user) return;

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
        className="bg-white p-4 mb-2"
      >
        <div className="flex items-center mb-2">
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
              <span className="text-sm font-medium">{stall.rating || "5.0"}</span>
              <span className="text-sm text-gray-600">({stall.reviewCount || 2000}+ ratings)</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>Pickup ready in {stall.deliveryTime || "15-40 min"}</span>
          </div>
          <span>No additional fees for pickup</span>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => {
              // Navigate to ratings section
              const ratingsElement = document.getElementById('ratings-section');
              if (ratingsElement) {
                ratingsElement.scrollIntoView({ behavior: 'smooth' });
              }
            }}
          >
            <Star className="w-4 h-4 mr-1" />
            Rate & Review
          </Button>
        </div>
      </motion.div>

      {/* Ratings Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        id="ratings-section"
        className="bg-white p-4 mb-2"
      >
        <h3 className="font-semibold text-gray-900 mb-3">Student Reviews</h3>
        <div className="space-y-3">
          <div className="text-center py-8">
            <Star className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Reviews Yet</h3>
            <p className="text-sm text-gray-600 mb-4">Only students who have ordered can leave reviews</p>
            <Button variant="outline" size="sm">
              Order first to review
            </Button>
          </div>
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

      {/* Category Tabs */}
      <motion.div
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-white sticky top-[72px] z-30"
      >
        <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide">
          {categories.map((category, index) => (
            <motion.button
              key={category}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              onClick={() => setActiveCategory(category)}
              className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all ${
                activeCategory === category
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {category}
            </motion.button>
          ))}
        </div>
        {activeCategory === "Popular" && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="px-4 pb-3"
          >
            <div className="flex items-center gap-2 text-sm">
              <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">🔥</span>
              </div>
              <span className="font-medium text-gray-900">Popular</span>
              <span className="text-gray-600">Most ordered right now.</span>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Menu Items */}
      <div className="p-4 space-y-4 pb-24">
        <AnimatePresence>
          {filteredItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: 0.1 * index }}
              onClick={() => openCustomization(item)}
              className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-gray-900">{item.name}</h3>
                    {item.isPopular && (
                      <Badge className="bg-red-100 text-red-700 text-xs ml-2">NEW!</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-900">₱{item.price}</span>
                    <Button
                      size="sm"
                      className="rounded-full w-8 h-8 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        openCustomization(item);
                      }}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                {item.image && (
                  <div className="w-20 h-20 rounded-lg bg-gray-100 overflow-hidden">
                    <img 
                      src={item.image} 
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredItems.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-gray-600">No items found</p>
            <p className="text-sm text-gray-500 mt-1">Try adjusting your search or category</p>
          </motion.div>
        )}
      </div>

      {/* Customization Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md mx-auto max-h-[90vh] overflow-y-auto">
          {selectedItem && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4"
            >
              <DialogHeader>
                <button
                  onClick={() => setIsDialogOpen(false)}
                  className="absolute right-4 top-4 w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center"
                >
                  ×
                </button>
                {selectedItem.image && (
                  <div className="w-full h-48 rounded-lg bg-gray-100 overflow-hidden mb-4">
                    <img 
                      src={selectedItem.image} 
                      alt={selectedItem.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <DialogTitle className="text-xl font-bold text-left">
                  {selectedItem.name}
                  {selectedItem.isPopular && (
                    <Badge className="bg-blue-100 text-blue-700 text-xs ml-2">NEW</Badge>
                  )}
                </DialogTitle>
                <p className="text-gray-600 text-left text-sm">{selectedItem.description}</p>
                <p className="font-semibold text-left">₱{selectedItem.price}</p>
              </DialogHeader>

              {/* Dynamic Customizations */}
              <div className="space-y-4">
                {selectedItem.customizations && selectedItem.customizations.length > 0 && (
                  <div>
                    <Label className="text-base font-medium">Customization Options</Label>
                    <p className="text-sm text-gray-600 mb-3">Optional add-ons</p>
                    <div className="space-y-2">
                      {selectedItem.customizations.map((custom, index) => (
                        <div key={index} className="flex items-center space-x-2 p-3 border rounded-lg">
                          <Checkbox 
                            checked={customizations[custom.name] || false}
                            onCheckedChange={(checked) => setCustomizations({...customizations, [custom.name]: checked})}
                          />
                          <Label className="flex-1">
                            {custom.name}
                            <span className="text-sm text-gray-600 block">
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

                <div>
                  <Label className="text-base font-medium">If this product is not available</Label>
                  <Button 
                    variant="outline" 
                    className="w-full mt-2 justify-start"
                    onClick={() => {
                      setIsDialogOpen(false);
                      toast({
                        title: "Preference saved",
                        description: "We'll remove this item if unavailable",
                      });
                    }}
                  >
                    Remove it from my order →
                  </Button>
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
                      onClick={() => setQuantity(quantity + 1)}
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