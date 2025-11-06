import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import type { CartItemWithDetails } from "@/types";

export default function FloatingCart() {
  const [, setLocation] = useLocation();
  const { state } = useStore();

  const { data: cartItems } = useQuery({
    queryKey: [`/api/cart/${state.user?.id || 1}`],
    enabled: !!state.user?.id,
  });

  const cartCount = cartItems?.length || 0;
  const cartTotal = cartItems?.reduce(
    (sum: number, item: CartItemWithDetails) => 
      sum + (parseFloat(item.menuItem?.price || "0") * item.quantity),
    0
  ) || 0;

  if (cartCount === 0) return null;

  return (
    <div className="fixed bottom-16 left-1/2 transform -translate-x-1/2 w-full max-w-md px-4 z-40">
      <div className="bg-maroon-800 text-white rounded-xl p-4 shadow-lg flex items-center justify-between">
        <div className="flex items-center">
          <div className="bg-white/20 rounded-full w-8 h-8 flex items-center justify-center mr-3">
            <span className="text-sm font-semibold">{cartCount}</span>
          </div>
          <div>
            <p className="font-medium text-sm">View Cart</p>
            <p className="text-xs text-maroon-200">₱{cartTotal.toFixed(2)}</p>
          </div>
        </div>
        <Button
          onClick={() => setLocation("/cart")}
          className="bg-white text-maroon-800 hover:bg-gray-100 px-4 py-2 rounded-lg font-medium text-sm"
        >
          View
        </Button>
      </div>
    </div>
  );
}
