import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, CreditCard, Banknote, Lock, CheckCircle, Award, Smartphone, Copy, AlertCircle, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useLocation } from "wouter";
import { useStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { subscribeToQuery, addDocument, deleteDocument, getDocument, awardLoyaltyPoints, getUserFavorites, redeemLoyaltyPoints, useVoucher, updateDocument } from "@/lib/firebase";
import { usePageTitle } from "@/hooks/use-page-title";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import QRCode from "@/components/qr-code";

export default function Checkout() {
  usePageTitle("Checkout");
  const [, setLocation] = useLocation();
  const { state, dispatch } = useStore();
  const { toast } = useToast();
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [cashAmount, setCashAmount] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [stallInfo, setStallInfo] = useState<any>(null);
  const [groupOrderEmails, setGroupOrderEmails] = useState<string[]>([]);
  const [scheduledTime, setScheduledTime] = useState("");
  const [deliveryInstructions, setDeliveryInstructions] = useState("");
  const [noCutlery, setNoCutlery] = useState(false);
  const [stallsInfo, setStallsInfo] = useState<any[]>([]);
  
  // GCash payment state
  const [showGcashPaymentDialog, setShowGcashPaymentDialog] = useState(false);
  const [gcashPaymentDetails, setGcashPaymentDetails] = useState<any>(null);
  const [gcashReferenceNumber, setGcashReferenceNumber] = useState("");
  const [customerGcashNumber, setCustomerGcashNumber] = useState("");
  const [gcashPaymentStep, setGcashPaymentStep] = useState<"instructions" | "verify" | "processing" | "complete">("instructions");
  const [gcashError, setGcashError] = useState("");
  const [paymentExpiresAt, setPaymentExpiresAt] = useState<Date | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  
  // Check if any stall supports GCash
  const gcashAvailable = stallsInfo.some(stall => {
    console.log('Checking GCash for stall:', stall.name, {
      gcashEnabled: stall.gcashEnabled,
      gcashNumber: stall.gcashNumber,
      hasGcash: !!(stall.gcashEnabled && stall.gcashNumber)
    });
    return stall.gcashEnabled && stall.gcashNumber;
  });
  const gcashStalls = stallsInfo.filter(stall => stall.gcashEnabled && stall.gcashNumber);
  
  // Countdown timer for GCash payment
  useEffect(() => {
    if (paymentExpiresAt && showGcashPaymentDialog) {
      const timer = setInterval(() => {
        const now = new Date().getTime();
        const expires = new Date(paymentExpiresAt).getTime();
        const remaining = Math.max(0, Math.floor((expires - now) / 1000));
        setTimeLeft(remaining);
        
        if (remaining <= 0) {
          clearInterval(timer);
          setShowGcashPaymentDialog(false);
          setGcashPaymentStep("instructions");
          toast({
            title: "Payment Expired",
            description: "The GCash payment window has expired. Please try again.",
            variant: "destructive",
          });
        }
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [paymentExpiresAt, showGcashPaymentDialog]);


  useEffect(() => {
    if (state.user?.id) {
      const unsubscribe = subscribeToQuery("cartItems", "userId", "==", state.user.id, async (items) => {
        setCartItems(items);
        
        // Get all unique stall info for multi-stall support
        const uniqueStallIds = Array.from(new Set(items.map(item => item.stallId))).filter(Boolean);
        const stallsData = [];
        
        for (const stallId of uniqueStallIds) {
          const stallDoc = await getDocument("stalls", stallId);
          if (stallDoc.exists()) {
            stallsData.push({ id: stallDoc.id, ...stallDoc.data() });
          }
        }
        
        setStallsInfo(stallsData);
        
        // Keep legacy single stall support
        if (stallsData.length > 0) {
          setStallInfo(stallsData[0]);
        }
      });
      return () => unsubscribe();
    }
    
    // Load stored order data from cart
    const storedGroupEmails = localStorage.getItem('groupOrderEmails');
    const storedScheduledTime = localStorage.getItem('scheduledTime');
    const storedInstructions = localStorage.getItem('deliveryInstructions');
    const storedCutlery = localStorage.getItem('noCutlery');
    
    if (storedGroupEmails) {
      setGroupOrderEmails(JSON.parse(storedGroupEmails));
    }
    if (storedScheduledTime) {
      setScheduledTime(storedScheduledTime);
    }
    if (storedInstructions) {
      setDeliveryInstructions(storedInstructions);
      setSpecialInstructions(storedInstructions);
    }
    if (storedCutlery) {
      setNoCutlery(JSON.parse(storedCutlery));
    }
  }, [state.user?.id]);

  const baseSubtotal = cartItems.reduce((sum, item) => {
    const itemPrice = item.price || 0;
    const customizationPrice = item.customizations?.reduce((sum: number, custom: any) => sum + (custom.price || 0), 0) || 0;
    return sum + ((itemPrice + customizationPrice) * item.quantity);
  }, 0);
  
  const voucherDiscount = parseFloat(localStorage.getItem('appliedVoucherDiscount') || '0');
  const subtotal = Math.max(0, baseSubtotal - voucherDiscount);

  const placeOrder = async () => {
    if (cartItems.length === 0) return;
    if (paymentMethod === "cash" && (!cashAmount || parseFloat(cashAmount) < subtotal)) {
      toast({
        title: "Invalid cash amount",
        description: "Please enter a valid amount that covers the total.",
        variant: "destructive",
      });
      return;
    }

    // Validate GCash availability for GCash payments
    if (paymentMethod === "gcash") {
      if (!gcashAvailable) {
        toast({
          title: "GCash not available",
          description: "This stall does not accept GCash payments.",
          variant: "destructive",
        });
        return;
      }
    }
    
    setIsProcessing(true);
    try {
      // Create order
      const orderId = `UBF-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
      
      // Group items by stall for multi-stall support
      const itemsByStall = cartItems.reduce((acc, item) => {
        const stallId = item.stallId || 'unknown';
        if (!acc[stallId]) {
          acc[stallId] = [];
        }
        acc[stallId].push(item);
        return acc;
      }, {} as { [key: string]: any[] });

      // Create separate orders for each stall if multi-stall
      const orderPromises = Object.entries(itemsByStall).map(async ([stallId, stallItems], index) => {
        const stallOrderId = Object.keys(itemsByStall).length > 1 ? `${orderId}-${index + 1}` : orderId;
        const stallSubtotal = (stallItems as any[]).reduce((sum: number, item: any) => {
          const itemPrice = item.price || 0;
          const customizationPrice = item.customizations?.reduce((sum: number, custom: any) => sum + (custom.price || 0), 0) || 0;
          return sum + ((itemPrice + customizationPrice) * item.quantity);
        }, 0);

        const stallData = stallsInfo.find(s => s.id === stallId);

        // Calculate voucher discount proportion for this stall  
        const stallDiscountProportion = stallSubtotal / baseSubtotal;
        const stallVoucherDiscount = voucherDiscount * stallDiscountProportion;
        const stallFinalAmount = stallSubtotal - stallVoucherDiscount;

        const orderDoc = await addDocument("orders", {
          userId: state.user?.id,
          customerName: state.user?.fullName || "Student",
          customerEmail: state.user?.email || "Not provided",
          customerPhone: state.user?.phoneNumber || "Not provided",
          studentId: state.user?.studentId || "Not provided",
          stallId,
          stallName: stallData?.name || "Unknown Stall",
          status: paymentMethod === "gcash" ? "awaiting_payment" : "pending",
          totalAmount: stallFinalAmount,
          originalAmount: stallSubtotal,
          voucherDiscount: stallVoucherDiscount,
          paymentMethod,
          cashAmount: paymentMethod === "cash" ? parseFloat(cashAmount) : null,
          changeRequired: paymentMethod === "cash" ? parseFloat(cashAmount) - stallFinalAmount : 0,
          // GCash payment details
          gcashPayment: paymentMethod === "gcash" ? {
            status: "pending",
            stallGcashNumber: stallData?.gcashNumber || null,
            stallGcashName: stallData?.gcashName || null,
            stallGcashQrCode: stallData?.gcashQrCode || null,
            referenceCode: stallOrderId,
            amount: stallFinalAmount,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
          } : null,
          specialInstructions: specialInstructions || deliveryInstructions || null,
          qrCode: stallOrderId,
          estimatedTime: scheduledTime || "15-40 mins",
          scheduledTime: scheduledTime || null,
          groupOrderEmails: groupOrderEmails.length > 0 ? groupOrderEmails : null,
          noCutlery: noCutlery,
          isMultiStallOrder: Object.keys(itemsByStall).length > 1,
          mainOrderId: orderId,
          items: (stallItems as any[]).map((item: any) => ({
            menuItemId: item.menuItemId,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            customizations: item.customizations || [],
          })),
          createdAt: new Date(),
        });

        // Send notification to stall owner about the new order
        try {
          const stallDoc = await getDocument("stalls", stallId);
          if (stallDoc.exists()) {
            const stallOwnerData = stallDoc.data();
            const ownerId = stallOwnerData.ownerId;
            
            if (ownerId) {
              // Create notification for stall owner
              await addDocument("notifications", {
                userId: ownerId,
                type: "order",
                title: "New Order Received!",
                message: `Order ${stallOrderId} from ${state.user?.fullName || "a student"} - ₱${stallFinalAmount.toFixed(2)} (${(stallItems as any[]).length} item${(stallItems as any[]).length > 1 ? 's' : ''})`,
                isRead: false,
                orderId: orderDoc.id,
                metadata: {
                  stallId,
                  stallName: stallData?.name,
                  customerName: state.user?.fullName,
                  orderTotal: stallFinalAmount,
                  itemCount: (stallItems as any[]).length,
                },
                createdAt: new Date(),
              });
              
              console.log(`Notification sent to stall owner ${ownerId} for order ${stallOrderId}`);
            }
          }
        } catch (notifError) {
          console.error("Error sending notification to stall owner:", notifError);
          // Don't fail the order if notification fails
        }

        return orderDoc;
      });

      await Promise.all(orderPromises);

      // Mark applied voucher as used after successful order
      const appliedVoucherId = localStorage.getItem('appliedVoucherId');
      if (appliedVoucherId && state.user?.uid) {
        try {
          // Pass userId and orderId to create userVouchers entry
          await useVoucher(appliedVoucherId, state.user.uid, orderId);
          localStorage.removeItem('appliedVoucherId');
        } catch (error) {
          console.error("Error marking voucher as used:", error);
        }
      }

      // Handle loyalty points
      try {
        let finalPointsTotal = state.user?.loyaltyPoints || 0;
        

        
        // Award points for the order (based on actual amount paid, after discount)
        if (state.user?.uid) {
          const userFavorites = await getUserFavorites(state.user.uid);
          const stallIds = Object.keys(itemsByStall);
          const isNewStall = stallIds.some(stallId => !userFavorites.includes(stallId));
          
          const pointsResult = await awardLoyaltyPoints(state.user.uid, subtotal, isNewStall);
        
          if (pointsResult.pointsAwarded > 0) {
            finalPointsTotal = pointsResult.newTotal;
            
            toast({
              title: `+${pointsResult.pointsAwarded} loyalty points earned!`,
              description: isNewStall ? "Double points for trying a new stall!" : `You now have ${finalPointsTotal} points total`,
            });
          }
        }
        
        // Update user points in store
        if (state.user) {
          dispatch({
            type: "SET_USER",
            payload: {
              ...state.user,
              loyaltyPoints: finalPointsTotal
            }
          });
        }
        
      } catch (error) {
        console.error("Error handling loyalty points:", error);
      }

      // Clear cart
      for (const item of cartItems) {
        await deleteDocument("cartItems", item.id);
      }

      // Clear localStorage data
      localStorage.removeItem('groupOrderEmails');
      localStorage.removeItem('scheduledTime');
      localStorage.removeItem('deliveryInstructions');
      localStorage.removeItem('noCutlery');
      localStorage.removeItem('appliedVoucherDiscount');
      localStorage.removeItem('appliedVoucherId');
      localStorage.removeItem('appliedVoucherCode');

      const stallCount = Object.keys(itemsByStall).length;
      const hasGroupOrder = groupOrderEmails.length > 0;
      const hasScheduledTime = !!scheduledTime;

      let description = `Your order ${orderId} has been confirmed.`;
      if (stallCount > 1) {
        description = `Your ${stallCount} orders have been confirmed (${orderId})`;
      }
      if (hasGroupOrder) {
        description += ` Group order includes ${groupOrderEmails.length} member${groupOrderEmails.length > 1 ? 's' : ''}.`;
      }
      if (hasScheduledTime) {
        description += ` Ready by ${scheduledTime}.`;
      }

      // Handle GCash payment flow
      if (paymentMethod === "gcash") {
        // Get the first GCash-enabled stall for payment details
        const gcashStall = gcashStalls[0];
        
        // Set up GCash payment dialog
        setGcashPaymentDetails({
          orderId,
          stallId: gcashStall.id,
          stallName: gcashStall.name,
          stallGcashNumber: gcashStall.gcashNumber,
          stallGcashName: gcashStall.gcashName,
          stallGcashQrCode: gcashStall.gcashQrCode || null,
          amount: subtotal,
          referenceCode: orderId,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        });
        setPaymentExpiresAt(new Date(Date.now() + 15 * 60 * 1000));
        setGcashPaymentStep("instructions");
        setShowGcashPaymentDialog(true);
        
        toast({
          title: "Order created - Complete payment",
          description: "Please complete your GCash payment to confirm your order.",
        });
      } else {
        toast({
          title: "Order placed successfully!",
          description,
        });
        setLocation("/orders");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to place order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle GCash payment completion - simplified, no reference number required
  const handleGcashPaymentComplete = async () => {
    setGcashPaymentStep("processing");

    try {
      // Update the order status to awaiting verification by stall
      const response = await fetch('/api/gcash/submit-reference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: gcashPaymentDetails?.orderId,
          gcashReferenceNumber: gcashPaymentDetails?.referenceCode || 'PENDING',
          customerGcashNumber: null,
        })
      });

      const result = await response.json();

      if (result.success) {
        setGcashPaymentStep("complete");
        
        setTimeout(() => {
          setShowGcashPaymentDialog(false);
          toast({
            title: "Payment Submitted",
            description: "The stall owner will verify your payment. Check your order status for updates.",
          });
          setLocation("/orders");
        }, 2000);
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to submit payment",
          variant: "destructive",
        });
        setGcashPaymentStep("instructions");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit payment",
        variant: "destructive",
      });
      setGcashPaymentStep("instructions");
    }
  };

  // Handle GCash reference submission (legacy - kept for compatibility)
  const handleGcashReferenceSubmit = async () => {
    if (!gcashReferenceNumber.trim()) {
      setGcashError("Please enter your GCash reference number");
      return;
    }

    setGcashPaymentStep("processing");
    setGcashError("");

    try {
      // Submit reference to server for validation
      const response = await fetch('/api/gcash/submit-reference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: gcashPaymentDetails?.orderId,
          gcashReferenceNumber: gcashReferenceNumber.trim(),
          customerGcashNumber: customerGcashNumber.trim() || null,
        })
      });

      const result = await response.json();

      if (result.success) {
        // Update the order in Firebase with payment reference
        // Find orders matching this main order ID
        const itemsByStall = cartItems.reduce((acc, item) => {
          const stallId = item.stallId || 'unknown';
          if (!acc[stallId]) acc[stallId] = [];
          acc[stallId].push(item);
          return acc;
        }, {} as { [key: string]: any[] });

        // The orders were already created, we need to update them
        // This is handled through the orders page subscription
        // Just update local state and navigate
        
        setGcashPaymentStep("complete");
        
        setTimeout(() => {
          setShowGcashPaymentDialog(false);
          toast({
            title: "Payment submitted!",
            description: "Your GCash reference has been submitted. The stall will verify your payment shortly.",
          });
          setLocation("/orders");
        }, 2000);
      } else {
        setGcashError(result.message || "Failed to submit reference");
        setGcashPaymentStep("verify");
      }
    } catch (error: any) {
      setGcashError(error.message || "Failed to submit payment reference");
      setGcashPaymentStep("verify");
    }
  };

  // Copy GCash number to clipboard
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  // Format time remaining
  const formatTimeLeft = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm sticky top-0 z-40">
          <div className="flex items-center p-4 bg-[#820d2a]">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/cart")} className="mr-3 text-white hover:bg-red-700">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-semibold text-white">Checkout</h1>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No items to checkout</h2>
          <p className="text-gray-600 text-center mb-6">Your cart is empty</p>
          <Button onClick={() => setLocation("/")} className="bg-[#6d031e] hover:bg-red-700">
            Browse Restaurants
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <motion.div 
        initial={{ y: -50 }}
        animate={{ y: 0 }}
        className="bg-white shadow-sm sticky top-0 z-40"
      >
        <div className="flex items-center p-4 bg-[#820d2a]">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/cart")} className="mr-3 text-white hover:bg-red-700">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold text-white">Checkout</h1>
        </div>
      </motion.div>

      <div className="p-4 space-y-4 pb-32 md:pb-8">
        {/* Desktop Layout Container */}
        <div className="max-w-6xl mx-auto md:grid md:grid-cols-2 md:gap-8 md:space-y-0">
          {/* Left Column - Main Content */}
          <div className="space-y-4">
        
        {/* Order Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg p-4 md:p-6"
        >
          <h3 className="font-semibold text-gray-900 mb-3 md:text-lg md:mb-4">Order Summary</h3>
          <div className="space-y-3 md:space-y-4">
            {cartItems.map((item) => (
              <div key={item.id} className="flex justify-between items-start md:p-2">
                <div className="flex-1">
                  <p className="font-medium md:text-base">{item.name} x{item.quantity}</p>
                  {item.customizations && item.customizations.length > 0 && (
                    <p className="text-sm md:text-sm text-gray-600">
                      {item.customizations.map((c: any) => c.name).join(", ")}
                    </p>
                  )}
                </div>
                <span className="font-semibold md:text-base">
                  ₱{(((item.price || 0) + (item.customizations?.reduce((sum: number, custom: any) => sum + (custom.price || 0), 0) || 0)) * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}

            <div className="border-t pt-3 md:pt-4">
              <div className="flex justify-between font-semibold text-lg md:text-xl">
                <span>Total</span>
                <span>₱{subtotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Multi-Stall Pickup Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg p-4"
        >
          <h3 className="font-semibold text-gray-900 mb-2">
            {stallsInfo.length > 1 ? "Pickup from Multiple Stalls" : "Pickup from"}
          </h3>
          {stallsInfo.length > 1 ? (
            <div className="space-y-2">
              {stallsInfo.map((stall, index) => (
                <div key={stall.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium">{stall.name}</p>
                    <p className="text-sm text-gray-600">Stall {index + 1}</p>
                  </div>
                  <span className="text-sm text-[#6d031e] font-medium">
                    {scheduledTime ? `Ready by ${scheduledTime}` : "15-40 mins"}
                  </span>
                </div>
              ))}
              <div className="mt-2 p-2 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  💡 Multi-stall ordering: You can pick up from different stalls in one order!
                </p>
              </div>
            </div>
          ) : (
            <div>
              <p className="font-medium">{stallsInfo[0]?.name || "Loading..."}</p>
              <p className="text-sm text-gray-600">
                {scheduledTime ? `Ready by ${scheduledTime}` : "Ready in 15-40 mins"}
              </p>
            </div>
          )}
        </motion.div>

        {/* Group Order Info */}
        {groupOrderEmails.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-lg p-4"
          >
            <h3 className="font-semibold text-gray-900 mb-2">Group Order</h3>
            <div className="space-y-1">
              <p className="text-sm text-gray-600 mb-2">
                This order includes {groupOrderEmails.length} additional member{groupOrderEmails.length > 1 ? 's' : ''}:
              </p>
              {groupOrderEmails.map((email, index) => (
                <div key={index} className="text-sm bg-gray-50 p-2 rounded">
                  {email}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Scheduled Time */}
        {scheduledTime && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg p-4"
          >
            <h3 className="font-semibold text-gray-900 mb-2">Scheduled Pickup</h3>
            <div className="flex items-center gap-2">
              <span className="text-2xl">⏰</span>
              <div>
                <p className="font-medium">Order will be ready by {scheduledTime}</p>
                <p className="text-sm text-gray-600">Order Later feature active</p>
              </div>
            </div>
          </motion.div>
        )}



        {/* Payment Method */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg p-4"
        >
          <h3 className="font-semibold text-gray-900 mb-3">Payment Method</h3>
          <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
            <div className="flex items-center space-x-2 p-3 border rounded-lg">
              <RadioGroupItem value="cash" id="cash" />
              <Label htmlFor="cash" className="flex items-center gap-2 flex-1 cursor-pointer">
                <Banknote className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium">Cash</p>
                  <p className="text-sm text-gray-600">Pay at pickup</p>
                </div>
              </Label>
            </div>
            
            {gcashAvailable ? (
              <div className={`flex items-center space-x-2 p-3 border rounded-lg ${paymentMethod === 'gcash' ? 'border-blue-500 bg-blue-50' : ''}`}>
                <RadioGroupItem value="gcash" id="gcash" />
                <Label htmlFor="gcash" className="flex items-center gap-2 flex-1 cursor-pointer">
                  <Smartphone className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium">GCash</p>
                    <p className="text-sm text-gray-600">Pay via GCash app</p>
                  </div>
                  <CheckCircle className="w-4 h-4 text-green-500 ml-auto" />
                </Label>
              </div>
            ) : (
              <div className="flex items-center space-x-2 p-3 border rounded-lg opacity-50">
                <RadioGroupItem value="gcash" id="gcash" disabled />
                <Label htmlFor="gcash" className="flex items-center gap-2 flex-1">
                  <Smartphone className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium">GCash</p>
                    <p className="text-sm text-gray-600">
                      {stallsInfo.length > 0 ? "Not available for this stall" : "Loading..."}
                    </p>
                  </div>
                  <Lock className="w-4 h-4 text-gray-400" />
                </Label>
              </div>
            )}
          </RadioGroup>

          {paymentMethod === "cash" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-4"
            >
              <Label className="text-sm font-medium">Cash on hand (₱)</Label>
              <Input
                type="number"
                placeholder="Enter amount you'll pay with"
                value={cashAmount}
                onChange={(e) => setCashAmount(e.target.value)}
                className="mt-2"
                min={subtotal}
                step="0.01"
              />
              {cashAmount && (
                <div className="mt-2">
                  {parseFloat(cashAmount) >= subtotal ? (
                    <div className="p-2 bg-green-50 rounded-lg">
                      <p className="text-sm text-green-700">
                        Change: ₱{(parseFloat(cashAmount) - subtotal).toFixed(2)}
                      </p>
                    </div>
                  ) : (
                    <div className="p-2 bg-red-50 rounded-lg">
                      <p className="text-sm text-red-700">
                        Amount is not enough. Need at least ₱{subtotal.toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* GCash Payment Info */}
          {paymentMethod === "gcash" && gcashAvailable && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-4 space-y-3"
            >
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="flex items-start gap-2">
                  <Smartphone className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">GCash Payment</p>
                    <p className="text-xs text-blue-700 mt-1">
                      You'll be shown the stall's GCash details after placing the order. 
                      Send the exact amount and provide the reference number for verification.
                    </p>
                  </div>
                </div>
              </div>
              
              {gcashStalls.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">GCash-enabled stalls:</p>
                  {gcashStalls.map((stall) => (
                    <div key={stall.id} className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>{stall.name}</span>
                    </div>
                  ))}
                </div>
              )}
              
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  GCash payments are verified by the stall owner. Ensure you send the exact amount 
                  and include the reference code in your message.
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
        </motion.div>

        {/* Special Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg p-4 md:p-6"
        >
          <Label className="text-base font-medium md:text-lg">Special Instructions (Optional)</Label>
          <Textarea
            placeholder="Any special requests for the stall owner"
            value={specialInstructions}
            onChange={(e) => setSpecialInstructions(e.target.value)}
            className="mt-2 md:mt-3"
          />
        </motion.div>
          </div>

          {/* Right Column - Order Summary (Desktop Only) */}
          <div className="hidden md:block">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-lg p-6 sticky top-24 shadow-lg"
            >
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Order Total</h3>
              
              <div className="space-y-4 mb-6">
                <div className="text-center py-4 border-b">
                  <div className="text-3xl font-bold text-[#6d031e]">₱{subtotal.toFixed(2)}</div>
                  <div className="text-sm text-gray-600">{cartItems.length} item{cartItems.length > 1 ? 's' : ''}</div>
                </div>

                {stallsInfo.length > 1 && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-blue-900">Multi-Stall Order</p>
                    <p className="text-xs text-blue-700">{stallsInfo.length} different stalls</p>
                  </div>
                )}

                {groupOrderEmails.length > 0 && (
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-sm font-medium text-green-900">Group Order</p>
                    <p className="text-xs text-green-700">{groupOrderEmails.length} member{groupOrderEmails.length > 1 ? 's' : ''}</p>
                  </div>
                )}

                {scheduledTime && (
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <p className="text-sm font-medium text-orange-900">Scheduled Pickup</p>
                    <p className="text-xs text-orange-700">Ready by {scheduledTime}</p>
                  </div>
                )}
              </div>

              <Button
                onClick={placeOrder}
                disabled={isProcessing || (paymentMethod === "cash" && (!cashAmount || parseFloat(cashAmount) < subtotal))}
                className="w-full bg-[#6d031e] hover:bg-red-700 text-white py-4 text-lg font-medium"
              >
                {isProcessing ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Placing Order...
                  </div>
                ) : (
                  "Place Order"
                )}
              </Button>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Button - Mobile Only */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 z-50 md:hidden"
      >
        <div className="max-w-md mx-auto">
          <Button
            onClick={placeOrder}
            disabled={isProcessing || (paymentMethod === "cash" && (!cashAmount || parseFloat(cashAmount) < subtotal))}
            className="w-full bg-[#6d031e] hover:bg-red-700 text-white py-4 text-lg font-medium"
          >
            {isProcessing ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Placing Order...
              </div>
            ) : (
              paymentMethod === "gcash" ? "Place Order & Pay with GCash" : "Place Order"
            )}
          </Button>
        </div>
      </motion.div>

      {/* GCash Payment Dialog */}
      <Dialog open={showGcashPaymentDialog} onOpenChange={(open) => {
        if (!open && gcashPaymentStep !== "complete") {
          // Warn user before closing
          if (confirm("Are you sure? Your order has been created but payment is pending. You can complete payment from the Orders page.")) {
            setShowGcashPaymentDialog(false);
            setLocation("/orders");
          }
        } else {
          setShowGcashPaymentDialog(open);
        }
      }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#6d031e] flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              Complete GCash Payment
            </DialogTitle>
            <DialogDescription>
              Send payment to the stall's GCash account
            </DialogDescription>
          </DialogHeader>

          <AnimatePresence mode="wait">
            {gcashPaymentStep === "instructions" && gcashPaymentDetails && (
              <motion.div
                key="instructions"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {/* Timer */}
                <div className="flex items-center justify-center gap-2 p-3 bg-orange-50 rounded-lg">
                  <Clock className="w-5 h-5 text-orange-600" />
                  <span className="text-orange-800 font-medium">
                    Time remaining: {formatTimeLeft(timeLeft)}
                  </span>
                </div>

                {/* Payment Amount */}
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700 mb-1">Amount to send:</p>
                  <p className="text-3xl font-bold text-blue-900">PHP {gcashPaymentDetails.amount.toFixed(2)}</p>
                </div>

                {/* GCash QR Code for Payment */}
                {gcashPaymentDetails.stallGcashQrCode ? (
                  <div className="flex flex-col items-center p-4 border-2 border-blue-200 rounded-lg bg-white">
                    <p className="text-sm font-medium text-gray-700 mb-3">Scan QR Code to Pay:</p>
                    <img
                      src={gcashPaymentDetails.stallGcashQrCode}
                      alt="GCash QR Code"
                      className="w-52 h-52 object-contain"
                    />
                    <div className="mt-3 text-center">
                      <p className="text-sm font-medium text-gray-900">{gcashPaymentDetails.stallGcashName}</p>
                      <p className="text-xs text-gray-500">{gcashPaymentDetails.stallName}</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 border-2 border-yellow-200 rounded-lg bg-yellow-50 text-center">
                    <p className="text-sm text-yellow-800">
                      No QR code available - please send manually using the number below
                    </p>
                  </div>
                )}

                {/* Manual Payment Option */}
                <div className="p-4 border rounded-lg bg-gray-50">
                  <p className="text-sm text-gray-600 mb-2">Or send manually to:</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-bold text-gray-900">{gcashPaymentDetails.stallGcashNumber}</p>
                      <p className="text-sm text-gray-600">{gcashPaymentDetails.stallGcashName}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(gcashPaymentDetails.stallGcashNumber, "GCash number")}
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Copy
                    </Button>
                  </div>
                </div>

                {/* Reference Code */}
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800 mb-2">Include this in your GCash message:</p>
                  <div className="flex items-center gap-2">
                    <code className="bg-yellow-100 px-3 py-1.5 rounded font-mono text-yellow-900 font-medium">
                      {gcashPaymentDetails.referenceCode}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(gcashPaymentDetails.referenceCode, "Reference code")}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Simple Instructions */}
                <div className="text-sm text-gray-600 space-y-1">
                  <p className="font-medium text-gray-700">How to pay:</p>
                  <p>1. Open GCash app and scan the QR code above</p>
                  <p>2. Or tap Send Money and enter the number</p>
                  <p>3. Send exactly PHP {gcashPaymentDetails.amount.toFixed(2)}</p>
                  <p>4. Add the reference code in message</p>
                </div>

                <Button
                  onClick={handleGcashPaymentComplete}
                  className="w-full bg-[#6d031e] hover:bg-red-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  I Have Completed the Payment
                </Button>
              </motion.div>
            )}



            {gcashPaymentStep === "processing" && (
              <motion.div
                key="processing"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col items-center justify-center py-8 space-y-4"
              >
                <Loader2 className="w-12 h-12 text-[#6d031e] animate-spin" />
                <p className="text-gray-600">Submitting payment...</p>
              </motion.div>
            )}

            {gcashPaymentStep === "complete" && (
              <motion.div
                key="complete"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex flex-col items-center justify-center py-8 space-y-4"
              >
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-gray-900">Payment Submitted</p>
                  <p className="text-sm text-gray-600 mt-1">
                    The stall owner will verify your payment shortly.
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    You will be redirected to your orders...
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </div>
  );
}