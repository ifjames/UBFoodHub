import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Clock, CheckCircle, XCircle, AlertCircle, QrCode, MapPin, Phone, Star, Smartphone, CreditCard, Copy, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { useStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { subscribeToQuery, updateDocument, deleteDocument, addDocument, getDocuments } from "@/lib/firebase";
import BottomNav from "@/components/layout/bottom-nav";
import QRCode from "@/components/qr-code";
import OrderCancellationRequest from "@/components/orders/order-cancellation-request";
import { usePageTitle } from "@/hooks/use-page-title";

const orderStatusConfig: Record<string, any> = {
  awaiting_payment: {
    color: "bg-orange-100 text-orange-800 border-orange-200",
    icon: <Smartphone className="w-4 h-4" />,
    label: "Awaiting Payment",
    description: "Complete your GCash payment"
  },
  pending: {
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: <Clock className="w-4 h-4" />,
    label: "Order confirmed",
    description: "Your order is being prepared"
  },
  preparing: {
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: <Clock className="w-4 h-4" />,
    label: "Preparing",
    description: "Chef is cooking your order"
  },
  ready: {
    color: "bg-green-100 text-green-800 border-green-200",
    icon: <CheckCircle className="w-4 h-4" />,
    label: "Ready for pickup",
    description: "Your order is ready!"
  },
  completed: {
    color: "bg-green-100 text-green-800 border-green-200",
    icon: <CheckCircle className="w-4 h-4" />,
    label: "Completed",
    description: "Order delivered successfully"
  },
  cancelled: {
    color: "bg-red-100 text-red-800 border-red-200",
    icon: <XCircle className="w-4 h-4" />,
    label: "Cancelled",
    description: "Order was cancelled"
  }
};

export default function Orders() {
  usePageTitle("Orders");
  const [, setLocation] = useLocation();
  const { state } = useStore();
  const { toast } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [qrOrderUnsubscribe, setQrOrderUnsubscribe] = useState<(() => void) | null>(null);
  const [isOrderCompleted, setIsOrderCompleted] = useState(false);
  
  // GCash payment state
  const [showGcashPaymentDialog, setShowGcashPaymentDialog] = useState(false);
  const [gcashReferenceNumber, setGcashReferenceNumber] = useState("");
  const [customerGcashNumber, setCustomerGcashNumber] = useState("");
  const [isSubmittingGcash, setIsSubmittingGcash] = useState(false);
  const [gcashError, setGcashError] = useState("");

  useEffect(() => {
    if (state.user?.id) {
      const unsubscribe = subscribeToQuery("orders", "userId", "==", state.user.id, (fetchedOrders) => {
        // Sort orders by creation date, newest first
        const sortedOrders = fetchedOrders.sort((a, b) => 
          new Date(b.createdAt?.seconds * 1000 || Date.now()).getTime() - 
          new Date(a.createdAt?.seconds * 1000 || Date.now()).getTime()
        );
        setOrders(sortedOrders);
      });
      return () => unsubscribe();
    }
  }, [state.user?.id]);

  // Auto-cancel GCash orders that haven't been paid within 15 minutes
  useEffect(() => {
    const checkExpiredPayments = async () => {
      const now = new Date();
      
      for (const order of orders) {
        if (order.status === 'awaiting_payment' && order.paymentMethod === 'gcash') {
          const createdAt = order.createdAt?.seconds 
            ? new Date(order.createdAt.seconds * 1000) 
            : new Date(order.createdAt);
          
          const minutesSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60);
          
          // Auto-cancel after 15 minutes of no payment
          if (minutesSinceCreation >= 15) {
            try {
              await updateDocument("orders", order.id, {
                status: 'cancelled',
                cancelledAt: new Date(),
                cancelReason: 'GCash payment not completed within 15 minutes'
              });
              
              toast({
                title: "Order Auto-Cancelled",
                description: `Order ${order.qrCode} was cancelled due to payment timeout.`,
                variant: "destructive",
              });
            } catch (error) {
              console.error('Failed to auto-cancel order:', error);
            }
          }
        }
      }
    };

    // Check every 30 seconds
    const interval = setInterval(checkExpiredPayments, 30000);
    
    // Also check immediately when orders change
    if (orders.length > 0) {
      checkExpiredPayments();
    }
    
    return () => clearInterval(interval);
  }, [orders, toast]);

  const cancelOrder = async (orderId: string) => {
    if (!orderId) return;

    setIsLoading(true);
    try {
      await updateDocument("orders", orderId, { 
        status: "cancelled",
        cancelledAt: new Date()
      });
      
      toast({
        title: "Order cancelled",
        description: "Your order has been successfully cancelled.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const showQRCode = (order: any) => {
    setSelectedOrder(order);
    setShowQRDialog(true);
    setIsOrderCompleted(false);
    
    // Set up real-time listener for this specific order
    if (order.id) {
      const unsubscribe = subscribeToQuery("orders", "id", "==", order.id, (orderUpdates) => {
        if (orderUpdates.length > 0) {
          const updatedOrder = orderUpdates[0];
          setSelectedOrder(updatedOrder);
          
          // If order status changed to completed, show success message and close QR dialog
          if (updatedOrder.status === 'completed' && order.status !== 'completed') {
            setIsOrderCompleted(true);
            toast({
              title: "Order Completed!",
              description: "Your order has been successfully picked up. Thank you!",
            });
            
            // Close the QR dialog after a brief delay to show the success message
            setTimeout(() => {
              setShowQRDialog(false);
              setIsOrderCompleted(false);
            }, 2500);
          }
        }
      });
      
      setQrOrderUnsubscribe(() => unsubscribe);
    }
  };

  const showReviewModal = (order: any) => {
    setSelectedOrder(order);
    setReviewRating(0);
    setReviewComment("");
    setShowReviewDialog(true);
  };

  const submitReview = async () => {
    if (!selectedOrder || reviewRating === 0) {
      toast({
        title: "Rating Required",
        description: "Please provide a rating before submitting your review.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const reviewData = {
        orderId: selectedOrder.id,
        stallId: selectedOrder.stallId,
        userId: state.user?.id,
        userName: state.user?.fullName || "Anonymous",
        rating: reviewRating,
        comment: reviewComment.trim(),
        createdAt: new Date(),
      };

      await addDocument("reviews", reviewData);
      
      // Mark order as reviewed
      await updateDocument("orders", selectedOrder.id, { hasReview: true });

      // Update stall rating and review count
      try {
        // Get all reviews for this stall to calculate new average
        const stallReviews = await getDocuments("reviews", "stallId", "==", selectedOrder.stallId);
        const allReviews = [...stallReviews, reviewData]; // Include the new review
        
        const totalRating = allReviews.reduce((sum, review) => sum + (review as any).rating, 0);
        const averageRating = totalRating / allReviews.length;
        const reviewCount = allReviews.length;

        // Update stall with new rating and count
        await updateDocument("stalls", selectedOrder.stallId, {
          rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
          reviewCount: reviewCount
        });
      } catch (error) {
        console.error("Error updating stall rating:", error);
        // Don't fail the review submission if rating update fails
      }

      toast({
        title: "Review Submitted!",
        description: "Thank you for your feedback!",
      });

      setShowReviewDialog(false);
      setReviewRating(0);
      setReviewComment("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit review. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const viewOrderDetails = (order: any) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  if (orders.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm sticky top-0 z-40">
          <div className="flex items-center p-4 bg-[#820d2a]">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/")} className="mr-3">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-semibold text-[#ffffff]">My Orders</h1>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
          <div className="text-6xl mb-4">📦</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No orders yet</h2>
          <p className="text-gray-600 text-center mb-6">When you place an order, it will appear here</p>
          <Button onClick={() => setLocation("/")} className="bg-[#6d031e] hover:bg-red-700">
            Start Ordering
          </Button>
        </div>
        <BottomNav />
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
        <div className="flex items-center p-4 bg-[#820d2a] max-w-7xl mx-auto">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/")} className="mr-3 text-white hover:bg-red-700">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold text-white">My Orders</h1>
        </div>
      </motion.div>

      {/* Desktop Layout Container */}
      <div className="max-w-7xl mx-auto p-4">
        {/* Desktop: Grid Layout, Mobile: Single Column */}
        <div className="md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-6 space-y-4 md:space-y-0 pb-24">
        <AnimatePresence>
          {orders.map((order, index) => {
            const statusConfig = orderStatusConfig[order.status as keyof typeof orderStatusConfig] || orderStatusConfig.pending;
            const canCancel = order.status === 'pending' || order.status === 'preparing';
            
            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow md:p-6"
              >
                {/* Condensed Order Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">Order {order.qrCode}</h3>
                      <Badge className={`${statusConfig.color} flex items-center gap-1`}>
                        {statusConfig.icon}
                        {statusConfig.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-[#6d031e] font-medium">{order.stallName || "Unknown Stall"}</p>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-sm text-gray-600">
                        {order.createdAt ? 
                          new Date(order.createdAt.seconds * 1000).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : 
                          'Just now'
                        }
                      </p>
                      <span className="font-semibold text-lg text-[#6d031e]">₱{order.totalAmount?.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Quick Summary */}
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    {order.items?.length} item{order.items?.length !== 1 ? 's' : ''} • {order.paymentMethod === 'cash' ? 'Cash Payment' : order.paymentMethod === 'gcash' ? 'GCash' : order.paymentMethod || 'Payment method not specified'}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">{statusConfig.description}</p>
                  
                  {/* GCash Payment Status */}
                  {order.paymentMethod === 'gcash' && order.gcashPayment && (
                    <div className={`mt-2 p-2 rounded text-xs ${
                      order.gcashPayment.status === 'verified' 
                        ? 'bg-green-50 text-green-700' 
                        : order.gcashPayment.status === 'awaiting_verification'
                        ? 'bg-yellow-50 text-yellow-700'
                        : order.gcashPayment.status === 'failed'
                        ? 'bg-red-50 text-red-700'
                        : 'bg-blue-50 text-blue-700'
                    }`}>
                      {order.gcashPayment.status === 'verified' && (
                        <span className="flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> GCash Payment Verified
                        </span>
                      )}
                      {order.gcashPayment.status === 'awaiting_verification' && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Awaiting stall verification
                        </span>
                      )}
                      {order.gcashPayment.status === 'pending' && (
                        <span className="flex items-center gap-1">
                          <Smartphone className="w-3 h-3" /> Complete GCash payment
                        </span>
                      )}
                      {order.gcashPayment.status === 'failed' && (
                        <span className="flex items-center gap-1">
                          <XCircle className="w-3 h-3" /> Payment not verified
                        </span>
                      )}
                    </div>
                  )}
                  
                  {/* Auto-cancellation timer for awaiting_payment */}
                  {order.status === 'awaiting_payment' && order.paymentMethod === 'gcash' && (() => {
                    const createdAt = order.createdAt?.seconds 
                      ? new Date(order.createdAt.seconds * 1000) 
                      : new Date(order.createdAt);
                    const minutesPassed = (new Date().getTime() - createdAt.getTime()) / (1000 * 60);
                    const minutesRemaining = Math.max(0, Math.ceil(15 - minutesPassed));
                    
                    return minutesRemaining > 0 ? (
                      <div className="mt-2 p-2 rounded bg-orange-50 border border-orange-200">
                        <p className="text-xs text-orange-700 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Auto-cancel in {minutesRemaining} minute{minutesRemaining !== 1 ? 's' : ''} if not paid
                        </p>
                      </div>
                    ) : null;
                  })()}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2 md:gap-3">
                  {/* GCash Payment Button - Shows for awaiting_payment orders */}
                  {order.status === 'awaiting_payment' && order.paymentMethod === 'gcash' && (
                    <Button
                      onClick={() => {
                        setSelectedOrder(order);
                        setShowGcashPaymentDialog(true);
                      }}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-base font-medium md:h-14 md:text-lg"
                    >
                      <Smartphone className="w-5 h-5 mr-2" />
                      Complete GCash Payment
                    </Button>
                  )}
                  
                  {/* Primary action - View Details takes full width */}
                  <Button
                    onClick={() => viewOrderDetails(order)}
                    className={`w-full ${order.status === 'awaiting_payment' ? 'bg-gray-600' : 'bg-[#6d031e]'} hover:bg-red-700 text-white h-12 text-base font-medium md:h-14 md:text-lg`}
                  >
                    View Details
                  </Button>
                  
                  {/* Secondary actions in a row */}
                  <div className="flex gap-2 md:gap-3">
                    {order.status === 'completed' && !order.hasReview && (
                      <Button
                        onClick={() => showReviewModal(order)}
                        variant="outline"
                        className="flex-1 border-orange-500 text-orange-600 hover:bg-orange-500 hover:text-white"
                      >
                        <Star className="w-4 h-4 mr-1" />
                        Review
                      </Button>
                    )}
                    
                    {order.status === 'completed' && order.hasReview && (
                      <Button
                        disabled={true}
                        className="flex-1 bg-green-100 text-green-600 cursor-not-allowed"
                        title="Review already submitted"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Reviewed
                      </Button>
                    )}
                    
                    {canCancel && (
                      <OrderCancellationRequest 
                        order={order}
                        onRequestSubmitted={() => {
                          // Refresh orders list - subscription will handle the update
                        }}
                      />
                    )}
                    
                    {order.status === 'ready' && (
                      <Button
                        onClick={() => showQRCode(order)}
                        variant="outline"
                        className="flex-1 border-[#6d031e] text-[#6d031e] hover:bg-[#6d031e] hover:text-white"
                      >
                        <QrCode className="w-4 h-4 mr-1" />
                        QR Code
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        </div>
      </div>

      {/* Order Details Modal */}
      <Dialog open={showOrderDetails} onOpenChange={setShowOrderDetails}>
        <DialogContent className="max-w-md md:max-w-2xl mx-auto max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4 md:space-y-6">
              {/* Order Header */}
              <div className="flex items-center justify-between p-4 md:p-6 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-semibold text-gray-900 md:text-lg">Order {selectedOrder.qrCode}</h3>
                  <p className="text-sm md:text-base text-[#6d031e] font-medium">{selectedOrder.stallName || "Unknown Stall"}</p>
                  <p className="text-sm md:text-base text-gray-600">
                    {selectedOrder.createdAt ? 
                      new Date(selectedOrder.createdAt.seconds * 1000).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : 
                      'Just now'
                    }
                  </p>
                </div>
                <Badge className={`${orderStatusConfig[selectedOrder.status as keyof typeof orderStatusConfig]?.color || orderStatusConfig.pending.color} flex items-center gap-1 md:px-3 md:py-2 md:text-sm`}>
                  {orderStatusConfig[selectedOrder.status as keyof typeof orderStatusConfig]?.icon || orderStatusConfig.pending.icon}
                  {orderStatusConfig[selectedOrder.status as keyof typeof orderStatusConfig]?.label || 'Pending'}
                </Badge>
              </div>

              {/* Order Items */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3 md:text-lg md:mb-4">Items Ordered:</h4>
                <div className="space-y-2 md:space-y-3">
                  {selectedOrder.items && selectedOrder.items.map((item: any, itemIndex: number) => (
                    <div key={itemIndex} className="flex justify-between items-start bg-gray-50 rounded-lg p-3 md:p-4">
                      <div className="flex-1">
                        <p className="font-medium text-sm md:text-base">{item.name} x{item.quantity}</p>
                        {item.customizations && item.customizations.length > 0 && (
                          <p className="text-xs md:text-sm text-gray-600">
                            Add-ons: {item.customizations.map((c: any) => c.name).join(", ")}
                          </p>
                        )}
                      </div>
                      <span className="font-semibold text-sm md:text-base">
                        ₱{(((item.price || 0) + (item.customizations?.reduce((sum: number, custom: any) => sum + (custom.price || 0), 0) || 0)) * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Payment Info */}
              <div className="pt-3 border-t border-gray-200">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-semibold text-lg">Total: ₱{selectedOrder.totalAmount?.toFixed(2)}</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Payment Method:</span>
                    <span className="font-medium">{selectedOrder.paymentMethod === 'cash' ? 'Cash' : selectedOrder.paymentMethod || 'Not specified'}</span>
                  </div>
                  {selectedOrder.paymentMethod === 'cash' && selectedOrder.cashAmount && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Cash Amount:</span>
                        <span className="font-medium">₱{selectedOrder.cashAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Change:</span>
                        <span className="font-medium">₱{selectedOrder.changeRequired?.toFixed(2) || '0.00'}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              {selectedOrder.specialInstructions && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700">
                    <strong>Special Instructions:</strong> {selectedOrder.specialInstructions}
                  </p>
                </div>
              )}

              {/* Status Timeline */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Order Status</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${['pending', 'preparing', 'ready', 'completed'].includes(selectedOrder.status) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Order Confirmed</p>
                      <p className="text-xs text-gray-600">We've received your order</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${['preparing', 'ready', 'completed'].includes(selectedOrder.status) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Preparing</p>
                      <p className="text-xs text-gray-600">Stall owner is preparing your food</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${['ready', 'completed'].includes(selectedOrder.status) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Ready for Pickup</p>
                      <p className="text-xs text-gray-600">Your order is ready!</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${selectedOrder.status === 'completed' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Completed</p>
                      <p className="text-xs text-gray-600">Order completed successfully</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={showQRDialog} onOpenChange={(open) => {
        if (!open) {
          // Clean up the real-time listener when dialog closes
          if (qrOrderUnsubscribe) {
            qrOrderUnsubscribe();
            setQrOrderUnsubscribe(null);
          }
          setShowQRDialog(false);
          setIsOrderCompleted(false);
        }
      }}>
        <DialogContent className="max-w-sm mx-auto">
          {selectedOrder && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-4"
            >
              <DialogHeader>
                <DialogTitle>
                  {isOrderCompleted ? "Order Completed!" : "Order QR Code"}
                </DialogTitle>
              </DialogHeader>
              
              {/* Order Completed Success Message */}
              {isOrderCompleted && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-green-50 border border-green-200 rounded-lg p-6"
                >
                  <div className="flex flex-col items-center gap-3">
                    <CheckCircle className="w-16 h-16 text-green-600" />
                    <div>
                      <h3 className="font-semibold text-lg text-green-800 mb-1">
                        Successfully Picked Up!
                      </h3>
                      <p className="text-sm text-green-700">
                        Your order has been completed. Thank you for using UB FoodHub!
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
              
              {/* Regular QR Code Display */}
              {!isOrderCompleted && (
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-lg mb-1">Order {selectedOrder.qrCode}</h3>
                    <p className="text-sm text-gray-600">Show this QR code for pickup</p>
                  </div>

                  <div className="flex justify-center bg-white p-6 rounded-lg border">
                    <QRCode value={selectedOrder.qrCode} size={200} />
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-blue-800">
                      <AlertCircle className="w-4 h-4" />
                      <span className="font-medium text-sm">Pickup Instructions</span>
                    </div>
                    <p className="text-xs text-blue-700 mt-1">
                      Present this QR code to the stall owner when collecting your order. This will automatically close when scanned.
                    </p>
                  </div>

                  {/* Live Status Updates */}
                  <div className="bg-white border rounded-lg p-3">
                    <div className="text-xs text-gray-600 space-y-1">
                      <div className="flex justify-between">
                        <span>Order Total:</span>
                        <span className="font-medium">₱{selectedOrder.totalAmount?.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Status:</span>
                        <div className="flex items-center gap-2">
                          <span className={`font-medium capitalize px-2 py-1 rounded-full text-xs ${
                            orderStatusConfig[selectedOrder.status as keyof typeof orderStatusConfig]?.color || 'bg-gray-100 text-gray-800'
                          }`}>
                            {orderStatusConfig[selectedOrder.status as keyof typeof orderStatusConfig]?.label || selectedOrder.status}
                          </span>
                          {selectedOrder.status === 'ready' && (
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          )}
                        </div>
                      </div>
                      {selectedOrder.estimatedTime && (
                        <div className="flex justify-between">
                          <span>Est. Time:</span>
                          <span className="font-medium">{selectedOrder.estimatedTime}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    onClick={() => {
                      if (qrOrderUnsubscribe) {
                        qrOrderUnsubscribe();
                        setQrOrderUnsubscribe(null);
                      }
                      setShowQRDialog(false);
                    }}
                    className="w-full"
                  >
                    Close
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle>Rate Your Experience</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="font-medium text-gray-900 mb-1">{selectedOrder.stallName}</h3>
                <p className="text-sm text-gray-600">Order #{selectedOrder.qrCode}</p>
              </div>

              {/* Star Rating */}
              <div className="space-y-2">
                <Label>How would you rate this order?</Label>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className={`p-1 transition-colors ${
                        star <= reviewRating 
                          ? 'text-yellow-400' 
                          : 'text-gray-300 hover:text-yellow-300'
                      }`}
                    >
                      <Star 
                        className="w-8 h-8" 
                        fill={star <= reviewRating ? 'currentColor' : 'none'}
                      />
                    </button>
                  ))}
                </div>
                <p className="text-center text-sm text-gray-600">
                  {reviewRating === 0 && "Tap to rate"}
                  {reviewRating === 1 && "Poor"}
                  {reviewRating === 2 && "Fair"}
                  {reviewRating === 3 && "Good"}
                  {reviewRating === 4 && "Very Good"}
                  {reviewRating === 5 && "Excellent"}
                </p>
              </div>

              {/* Comment */}
              <div className="space-y-2">
                <Label htmlFor="review-comment">Add a comment (optional)</Label>
                <Textarea
                  id="review-comment"
                  placeholder="Tell us about your experience..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowReviewDialog(false)}
                  className="flex-1"
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={submitReview}
                  className="flex-1 bg-[#6d031e] hover:bg-red-700 pl-[69px] pr-[69px]"
                  disabled={isLoading || reviewRating === 0}
                >
                  {isLoading ? "Submitting..." : "Submit Review"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* GCash Payment Dialog */}
      <Dialog open={showGcashPaymentDialog} onOpenChange={setShowGcashPaymentDialog}>
        <DialogContent className="max-w-md mx-auto max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#6d031e]">
              <Smartphone className="w-5 h-5" />
              Complete GCash Payment
            </DialogTitle>
            <DialogDescription>
              Send payment to the stall's GCash account
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-4">
              {/* Payment Amount */}
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700 mb-1">Amount to send:</p>
                <p className="text-3xl font-bold text-blue-900">PHP {selectedOrder.totalAmount?.toFixed(2)}</p>
              </div>

              {/* GCash QR Code */}
              {selectedOrder.gcashPayment?.stallGcashQrCode ? (
                <div className="flex flex-col items-center p-4 border-2 border-blue-200 rounded-lg bg-white">
                  <p className="text-sm font-medium text-gray-700 mb-3">Scan QR Code to Pay:</p>
                  <img
                    src={selectedOrder.gcashPayment.stallGcashQrCode}
                    alt="GCash QR Code"
                    className="w-52 h-52 object-contain"
                  />
                  <div className="mt-3 text-center">
                    <p className="text-sm font-medium text-gray-900">
                      {selectedOrder.gcashPayment?.stallGcashName || 'GCash Account'}
                    </p>
                    <p className="text-xs text-gray-500">{selectedOrder.stallName}</p>
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
                <p className="text-sm text-gray-600 mb-2">Send to GCash Number:</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-bold text-gray-900">
                      {selectedOrder.gcashPayment?.stallGcashNumber || 'Not available'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {selectedOrder.gcashPayment?.stallGcashName || 'N/A'}
                    </p>
                  </div>
                  {selectedOrder.gcashPayment?.stallGcashNumber && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(selectedOrder.gcashPayment?.stallGcashNumber || '');
                        toast({ title: "Copied", description: "GCash number copied to clipboard" });
                      }}
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Copy
                    </Button>
                  )}
                </div>
              </div>

              {/* Reference Code */}
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800 mb-2">Include this in your GCash message:</p>
                <div className="flex items-center gap-2">
                  <code className="bg-yellow-100 px-3 py-1.5 rounded font-mono text-yellow-900 font-medium">
                    {selectedOrder.qrCode}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(selectedOrder.qrCode || '');
                      toast({ title: "Copied", description: "Reference code copied to clipboard" });
                    }}
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
                <p>3. Send exactly PHP {selectedOrder.totalAmount?.toFixed(2)}</p>
                <p>4. Add the reference code in message</p>
              </div>

              {gcashError && (
                <div className="p-2 bg-red-50 rounded text-sm text-red-700">
                  {gcashError}
                </div>
              )}

              {/* Submit Button */}
              <Button
                onClick={async () => {
                  setIsSubmittingGcash(true);
                  setGcashError("");

                  try {
                    // Update order status to awaiting verification
                    await updateDocument("orders", selectedOrder.id, {
                      'gcashPayment.status': 'awaiting_verification',
                      'gcashPayment.submittedAt': new Date(),
                      status: 'pending' // Move from awaiting_payment to pending
                    });

                    toast({
                      title: "Payment Submitted",
                      description: "The stall owner will verify your payment shortly.",
                    });

                    setShowGcashPaymentDialog(false);
                  } catch (error) {
                    setGcashError("Failed to submit payment. Please try again.");
                  } finally {
                    setIsSubmittingGcash(false);
                  }
                }}
                className="w-full bg-[#6d031e] hover:bg-red-700"
                disabled={isSubmittingGcash}
              >
                {isSubmittingGcash ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    I Have Completed the Payment
                  </>
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}