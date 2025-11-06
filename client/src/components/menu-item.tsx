import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Minus, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { addDocument } from "@/lib/firebase";
import LoadingIndicator from "@/components/loading-indicator";

interface MenuItemProps {
  item: {
    id: number;
    restaurantId: number;
    name: string;
    description?: string | null;
    price: string;
    image?: string | null;
    category: string;
    isAvailable: boolean;
    isPopular: boolean;
  };
  restaurantId: number;
}

export default function MenuItem({ item, restaurantId }: MenuItemProps) {
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [showAddToCart, setShowAddToCart] = useState(false);
  const { state, dispatch } = useStore();
  const { toast } = useToast();

  const handleAddToCart = async () => {
    if (!state.user?.id) {
      toast({
        title: "Authentication required",
        description: "Please login to add items to cart.",
        variant: "destructive",
      });
      return;
    }

    setIsAdding(true);
    try {
      await addDocument("cartItems", {
        userId: state.user.id,
        menuItemId: item.id,
        stallId: restaurantId,
        name: item.name,
        price: typeof item.price === 'string' ? parseFloat(item.price.replace('₱', '')) : item.price,
        quantity,
        image: item.image || '',
        customizations: [],
        createdAt: new Date(),
      });

      // Update cart count in store
      dispatch({ type: "SET_CART_COUNT", payload: state.cartCount + quantity });

      toast({
        title: "Added to cart!",
        description: `${item.name} has been added to your cart.`,
      });
      
      setQuantity(1);
      setShowAddToCart(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add item to cart. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
      className="liquid-animation"
    >
      <Card className="overflow-hidden glass-card border-white/20">
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <motion.div 
              className="relative float-animation"
              whileHover={{ scale: 1.1 }}
            >
              <img
                src={item.image || "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200"}
                alt={item.name}
                className="w-16 h-16 rounded-lg object-cover shadow-lg"
              />
              {item.isPopular && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center pulse-glow"
                >
                  <Flame className="h-3 w-3" />
                </motion.div>
              )}
            </motion.div>
            
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h4 className="font-medium text-gray-800">{item.name}</h4>
                {item.isPopular && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    <Badge variant="secondary" className="bg-red-100 text-red-800">
                      Popular
                    </Badge>
                  </motion.div>
                )}
              </div>
              
              {item.description && (
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">{item.description}</p>
              )}
              
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-800">₱{item.price}</span>
                
                {!showAddToCart ? (
                  <motion.div
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      onClick={() => setShowAddToCart(true)}
                      disabled={!item.isAvailable}
                      size="sm"
                      className="bg-[#6d031e] hover:bg-red-700 text-white glass-button"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center space-x-2"
                  >
                    <Button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      size="sm"
                      variant="outline"
                      className="h-8 w-8 p-0 border-[#6d031e] text-[#6d031e] hover:bg-[#6d031e] hover:text-white"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="font-medium text-sm w-8 text-center">{quantity}</span>
                    <Button
                      onClick={() => setQuantity(quantity + 1)}
                      size="sm"
                      variant="outline"
                      className="h-8 w-8 p-0 border-[#6d031e] text-[#6d031e] hover:bg-[#6d031e] hover:text-white"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={handleAddToCart}
                      disabled={isAdding}
                      size="sm"
                      className="bg-[#6d031e] hover:bg-red-700 text-white ml-2 glass-button"
                    >
                      {isAdding ? (
                        <LoadingIndicator message="Adding..." size="sm" variant="dots" />
                      ) : (
                        "Add to Cart"
                      )}
                    </Button>
                  </motion.div>
              )}
            </div>
          </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
