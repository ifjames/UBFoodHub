import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Minus,
  Plus,
  Trash2,
  Tag,
  Utensils,
  MapPin,
  Lock,
  ShoppingCart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useLocation } from "wouter";
import { useStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { usePageTitle } from "@/hooks/use-page-title";
import {
  subscribeToQuery,
  updateDocument,
  deleteDocument,
  addDocument,
  getUserVouchers,
  validateVoucher,
} from "@/lib/firebase";
import BottomNav from "@/components/layout/bottom-nav";
import LoadingIndicator from "@/components/loading-indicator";
import LoadingOverlay from "@/components/loading-overlay";

// Voucher Section Component
interface VoucherSectionProps {
  userId: string;
  appliedVoucher: { discount: number; voucherId: string; code: string } | null;
  onVoucherApplied: (discount: number, voucherId: string, code: string) => void;
  onVoucherRemoved: () => void;
}

function VoucherSection({ userId, appliedVoucher, onVoucherApplied, onVoucherRemoved }: VoucherSectionProps) {
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [showVouchers, setShowVouchers] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (userId) {
      loadVouchers();
    }
  }, [userId]);

  const loadVouchers = async () => {
    try {
      const userVouchers = await getUserVouchers(userId);
      // Filter out used vouchers for cart display
      const availableVouchers = userVouchers.filter(voucher => !voucher.isUsed);
      setVouchers(availableVouchers);
    } catch (error) {
      console.error("Error loading vouchers:", error);
    }
  };

  const handleApplyVoucher = async (voucherId: string, voucherCode?: string) => {
    setIsLoading(true);
    try {
      const result = await validateVoucher(userId, voucherId);
      if (result.success) {
        onVoucherApplied(result.discountAmount, voucherId, voucherCode || result.code);
        setShowVouchers(false);
        setManualCode("");
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to apply voucher",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualVoucherApply = async () => {
    if (!manualCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a voucher code",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Find voucher by code
      const voucher = vouchers.find(v => v.code.toLowerCase() === manualCode.toLowerCase());
      if (voucher) {
        await handleApplyVoucher(voucher.id, voucher.code);
      } else {
        toast({
          title: "Error",
          description: "Voucher code not found or invalid",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to apply voucher code",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // If voucher is applied, show applied state
  if (appliedVoucher) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-green-600" />
            <div>
              <p className="font-medium text-sm text-green-800">{appliedVoucher.code}</p>
              <p className="text-xs text-green-600">₱{appliedVoucher.discount.toFixed(2)} discount applied</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onVoucherRemoved}
            className="text-red-600 hover:text-red-700"
          >
            Remove
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Button
        variant="outline"
        className="w-full justify-start"
        onClick={() => setShowVouchers(!showVouchers)}
      >
        <Tag className="w-4 h-4 mr-2" />
        Apply Voucher {vouchers.length > 0 && `(${vouchers.length} available)`}
      </Button>
      
      {showVouchers && (
        <div className="space-y-2 border rounded-lg p-3 bg-gray-50">
          {/* Manual voucher code entry - always visible */}
          <div className="space-y-2">
            <p className="text-xs text-gray-600 font-medium">Enter voucher code:</p>
            <div className="flex gap-2">
              <Input
                placeholder="Enter voucher code"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                className="flex-1"
              />
              <Button
                size="sm"
                onClick={handleManualVoucherApply}
                disabled={isLoading || !manualCode.trim()}
              >
                Apply
              </Button>
            </div>
          </div>

          {vouchers.length > 0 && (
            <div className="border-t pt-2">
              <p className="text-xs text-gray-500 mb-2">Your available vouchers:</p>
              {vouchers.map((voucher) => (
                <div key={voucher.id} className="flex items-center justify-between p-2 bg-white rounded border mb-2">
                  <div>
                    <p className="font-medium text-sm">{voucher.code}</p>
                    <p className="text-xs text-gray-600">₱{voucher.discountAmount || voucher.discountValue} discount</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleApplyVoucher(voucher.id)}
                    disabled={isLoading}
                  >
                    Apply
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Cart() {
  usePageTitle("Cart");
  const [, setLocation] = useLocation();
  const { state } = useStore();
  const { toast } = useToast();
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [deliveryInstructions, setDeliveryInstructions] = useState("");
  const [voucherCode, setVoucherCode] = useState("");
  const [noCutlery, setNoCutlery] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingStates, setLoadingStates] = useState<{
    [key: string]: boolean;
  }>({});
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState<{ discount: number; voucherId: string; code: string } | null>(null);
  const [showSummary, setShowSummary] = useState(false);

  useEffect(() => {
    if (state.user?.id) {
      const unsubscribe = subscribeToQuery(
        "cartItems",
        "userId",
        "==",
        state.user.id,
        setCartItems,
      );
      return () => unsubscribe();
    }
  }, [state.user?.id]);

  // Load applied voucher from localStorage on mount
  useEffect(() => {
    const savedDiscount = localStorage.getItem('appliedVoucherDiscount');
    const savedVoucherId = localStorage.getItem('appliedVoucherId');
    const savedVoucherCode = localStorage.getItem('appliedVoucherCode');
    
    if (savedDiscount && savedVoucherId && savedVoucherCode) {
      setAppliedVoucher({
        discount: parseFloat(savedDiscount),
        voucherId: savedVoucherId,
        code: savedVoucherCode
      });
    }
  }, []);

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    try {
      if (newQuantity <= 0) {
        await deleteDocument("cartItems", itemId);
        toast({
          title: "Item removed",
          description: "Item has been removed from cart",
        });
      } else {
        await updateDocument("cartItems", itemId, { quantity: newQuantity });
        // No toast needed for quantity updates to reduce UI noise
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update cart item",
        variant: "destructive",
      });
    }
  };

  const removeItem = async (itemId: string) => {
    const loadingKey = `remove-${itemId}`;
    setLoadingStates((prev) => ({ ...prev, [loadingKey]: true }));

    try {
      // Optimistically remove item from UI first for smoother experience
      setCartItems(prevItems => prevItems.filter(item => item.id !== itemId));
      
      // Then delete from database
      await deleteDocument("cartItems", itemId);
      toast({
        title: "Item removed",
        description: "Item has been removed from your cart",
      });
    } catch (error) {
      // If deletion failed, restore item by refetching cart items
      // The Firebase subscription will handle this automatically
      toast({
        title: "Error",
        description: "Failed to remove item",
        variant: "destructive",
      });
    } finally {
      setLoadingStates((prev) => ({ ...prev, [loadingKey]: false }));
    }
  };

  const baseSubtotal = cartItems.reduce((sum, item) => {
    const itemPrice = item.price || 0;
    const customizationPrice =
      item.customizations?.reduce(
        (sum: number, custom: any) => sum + (custom.price || 0),
        0,
      ) || 0;
    return sum + (itemPrice + customizationPrice) * item.quantity;
  }, 0);
  
  const voucherDiscount = appliedVoucher ? appliedVoucher.discount : 0;
  const subtotal = Math.max(0, baseSubtotal - voucherDiscount);
  const total = subtotal;

  const handleVoucherApplied = (discount: number, voucherId: string, code: string) => {
    const voucherData = { discount, voucherId, code };
    setAppliedVoucher(voucherData);
    
    // Store in localStorage
    localStorage.setItem('appliedVoucherDiscount', discount.toString());
    localStorage.setItem('appliedVoucherId', voucherId);
    localStorage.setItem('appliedVoucherCode', code);
    
    toast({
      title: "Voucher applied!",
      description: `₱${discount.toFixed(2)} discount will be applied at checkout`,
    });
  };

  const handleVoucherRemoved = () => {
    setAppliedVoucher(null);
    
    // Remove from localStorage
    localStorage.removeItem('appliedVoucherDiscount');
    localStorage.removeItem('appliedVoucherId');
    localStorage.removeItem('appliedVoucherCode');
    
    toast({
      title: "Voucher removed",
      description: "Discount has been removed from your cart",
    });
  };

  const proceedToCheckout = async () => {
    if (cartItems.length === 0) return;

    setShowLoadingOverlay(true);
    setLoadingMessage("Preparing checkout...");

    // Store additional order data for checkout
    localStorage.setItem('deliveryInstructions', deliveryInstructions);
    localStorage.setItem('noCutlery', JSON.stringify(noCutlery));

    // Simulate loading time for better UX
    setTimeout(() => {
      setShowLoadingOverlay(false);
      setLocation("/checkout");
    }, 2000);
  };

  if (cartItems.length === 0) {
    return (
      <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
        <div className="bg-white shadow-sm">
          <div className="flex items-center p-4 bg-[#820d2a]">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/")}
              className="mr-3"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-semibold text-[#ffffff]">Cart</h1>
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <ShoppingCart className="w-16 h-16 text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Your cart is empty
          </h2>
          <p className="text-gray-600 text-center mb-6">
            Add some delicious items from our restaurants to get started
          </p>
          <Button
            onClick={() => setLocation("/")}
            className="bg-maroon-600 hover:bg-maroon-700"
          >
            Browse Restaurants
          </Button>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Progress Steps */}
      <motion.div
        initial={{ y: -50 }}
        animate={{ y: 0 }}
        className="bg-[#820d2a]"
      >
        <div className="flex items-center p-4 max-w-7xl mx-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/")}
            className="mr-3 text-white hover:bg-white/20"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold text-[#ffffff]">Cart</h1>
        </div>

        {/* Progress Indicator */}
        <div className="px-4 pb-3 max-w-7xl mx-auto">
          <div className="flex items-center justify-between max-w-md mx-auto md:max-w-lg">
            <div className="flex items-center">
              <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-xs font-medium text-black">
                1
              </div>
              <span className="text-xs text-white ml-2">Menu</span>
            </div>
            <div className="flex-1 h-px bg-gray-200 mx-4"></div>
            <div className="flex items-center">
              <div className="w-6 h-6 bg-[#6d031e] rounded-full flex items-center justify-center text-xs font-medium text-white">
                2
              </div>
              <span className="text-xs text-[#ffffff] ml-2 font-medium">
                Cart
              </span>
            </div>
            <div className="flex-1 h-px bg-gray-200 mx-4"></div>
            <div className="flex items-center">
              <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium text-black-400">
                3
              </div>
              <span className="text-xs text-white ml-2">Checkout</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Desktop Layout Container */}
      <div className="max-w-7xl mx-auto p-4">
        <div className="md:grid md:grid-cols-3 md:gap-8 md:items-start">
          {/* Main Cart Content - Left Side on Desktop */}
          <div className="md:col-span-2 space-y-4 pb-32 md:pb-4">
        {/* Cart Items */}
        <AnimatePresence mode="popLayout">
          {cartItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20, height: 0 }}
              animate={{ opacity: 1, x: 0, height: "auto" }}
              exit={{ 
                opacity: 0, 
                x: 20, 
                height: 0,
                transition: { duration: 0.3, ease: "easeInOut" }
              }}
              transition={{ 
                duration: 0.3,
                delay: index * 0.05,
                layout: { duration: 0.3 }
              }}
              layout
              className="bg-white rounded-lg p-4 overflow-hidden"
            >
              <div className="flex gap-3">
                <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{item.name}</h3>
                  <p className="text-sm text-gray-600">
                    {item.customizations && item.customizations.length > 0
                      ? item.customizations
                          .map((custom: any) => `${custom.name} (+₱${custom.price})`)
                          .join(", ")
                      : "No customizations"}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="w-8 h-8 rounded-full"
                        onClick={() =>
                          updateQuantity(item.id, item.quantity - 1)
                        }
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-8 text-center font-medium">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="w-8 h-8 rounded-full"
                        onClick={() =>
                          updateQuantity(item.id, item.quantity + 1)
                        }
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">
                        ₱
                        {(
                          ((item.price || 0) +
                            (item.customizations?.reduce(
                              (sum: number, custom: any) => sum + (custom.price || 0),
                              0,
                            ) || 0)) *
                          item.quantity
                        ).toFixed(2)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8"
                        disabled={loadingStates[`remove-${item.id}`]}
                        onClick={() => removeItem(item.id)}
                      >
                        {loadingStates[`remove-${item.id}`] ? (
                          <LoadingIndicator variant="dots" size="sm" />
                        ) : (
                          <Trash2 className="w-4 h-4 text-red-500" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Add More Items */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg p-4"
        >
          <Button
            variant="link"
            className="w-full justify-start p-0 h-auto text-gray-700"
            onClick={() => {
              // Get first item's stall ID to navigate back to that stall
              const firstStall = cartItems[0]?.stallId;
              if (firstStall) {
                setLocation(`/restaurant/${firstStall}`);
              } else {
                setLocation("/");
              }
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add more items
          </Button>
        </motion.div>

        {/* Order Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-lg p-4 space-y-3"
        >
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>₱{baseSubtotal.toFixed(2)}</span>
          </div>
          
          {voucherDiscount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Voucher Discount</span>
              <span>-₱{voucherDiscount.toFixed(2)}</span>
            </div>
          )}

          {/* Apply Voucher */}
          <VoucherSection 
            userId={state.user?.id || ""} 
            appliedVoucher={appliedVoucher}
            onVoucherApplied={handleVoucherApplied}
            onVoucherRemoved={handleVoucherRemoved}
          />

          {/* Cutlery Option - Information for stall owner */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <Utensils className="w-4 h-4 text-gray-600" />
              <div>
                <p className="font-medium">Cutlery</p>
                <p className="text-xs text-gray-600">
                  Cutlery needs will be communicated to the stall owner
                </p>
              </div>
            </div>
            <Switch
              checked={!noCutlery}
              onCheckedChange={(checked) => setNoCutlery(!checked)}
            />
          </div>

          <div className="border-t pt-3 space-y-2">
            {showSummary && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2 text-sm"
              >
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>₱{baseSubtotal.toFixed(2)}</span>
                </div>
                {appliedVoucher && (
                  <div className="flex justify-between text-green-600">
                    <span>Voucher Discount ({appliedVoucher.code})</span>
                    <span>-₱{voucherDiscount.toFixed(2)}</span>
                  </div>
                )}
              </motion.div>
            )}
            <div className="flex justify-between font-semibold text-lg">
              <span>Total</span>
              <span>₱{subtotal.toFixed(2)}</span>
            </div>
            <Button 
              variant="link" 
              className="p-0 h-auto text-sm text-gray-600"
              onClick={() => setShowSummary(!showSummary)}
              data-testid="button-toggle-summary"
            >
              {showSummary ? "Hide summary" : "See summary"}
            </Button>
          </div>
        </motion.div>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-lg p-4"
        >
          <Label className="text-base font-medium">
            Special Instructions (Optional)
          </Label>
          <Input
            placeholder="Any special requests for the stall owner (e.g., no onions, extra spicy)"
            value={deliveryInstructions}
            onChange={(e) => setDeliveryInstructions(e.target.value)}
            className="mt-2"
          />
        </motion.div>
          </div>

          {/* Desktop Sidebar - Right Side */}
          <div className="hidden md:block md:col-span-1 md:sticky md:top-4">
            {/* Order Summary Card */}
            <Card className="bg-white">
              <CardContent className="p-6 space-y-4">
                <h2 className="text-xl font-semibold text-gray-900">Order Summary</h2>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>₱{subtotal.toFixed(2)}</span>
                  </div>
                  
                  <div className="border-t pt-3">
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total</span>
                      <span>₱{subtotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={proceedToCheckout}
                  disabled={isProcessing || cartItems.length === 0}
                  className="w-full bg-[#6d031e] hover:bg-red-700 text-white py-4 text-lg font-medium"
                >
                  {isProcessing ? (
                    <LoadingIndicator message="Processing..." variant="dots" />
                  ) : (
                    "Checkout"
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Button - Mobile Only */}
      {!showLoadingOverlay && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="md:hidden fixed bottom-16 left-0 right-0 bg-white border-t p-4 z-[60]"
        >
          <div className="max-w-md mx-auto">
            <Button
              onClick={proceedToCheckout}
              disabled={isProcessing || cartItems.length === 0}
              className="w-full bg-[#6d031e] hover:bg-red-700 text-white py-4 text-lg font-medium"
            >
              {isProcessing ? (
                <LoadingIndicator message="Processing..." variant="dots" />
              ) : (
                "Checkout"
              )}
            </Button>
          </div>
        </motion.div>
      )}

      <BottomNav />

      {/* Loading Overlay */}
      <LoadingOverlay
        isVisible={showLoadingOverlay}
        message={loadingMessage}
        onClose={() => setShowLoadingOverlay(false)}
      />
    </div>
  );
}
