import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Clock, CheckCircle, XCircle, AlertCircle, QrCode, MapPin, Phone, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { useStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { subscribeToQuery, updateDocument, deleteDocument, addDocument } from "@/lib/firebase";
import BottomNav from "@/components/layout/bottom-nav";
import QRCode from "@/components/qr-code";
import OrderCancellationRequest from "@/components/orders/order-cancellation-request";

const orderStatusConfig = {
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
        restaurantId: selectedOrder.stallId,
        userId: state.user?.id,
        userName: state.user?.fullName || "Anonymous",
        rating: reviewRating,
        comment: reviewComment.trim(),
        createdAt: new Date(),
      };

      await addDocument("reviews", reviewData);
      
      // Mark order as reviewed
      await updateDocument("orders", selectedOrder.id, { hasReview: true });

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
        <div className="flex items-center p-4 bg-[#820d2a]">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/")} className="mr-3 text-white hover:bg-red-700">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold text-white">My Orders</h1>
        </div>
      </motion.div>

      <div className="p-4 space-y-4 pb-24">
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
                className="bg-white rounded-lg p-4 shadow-sm"
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
                    {order.items?.length} item{order.items?.length !== 1 ? 's' : ''} • {order.paymentMethod === 'cash' ? 'Cash Payment' : order.paymentMethod || 'Payment method not specified'}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">{statusConfig.description}</p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => viewOrderDetails(order)}
                    className="flex-1 bg-[#6d031e] hover:bg-red-700 text-white"
                  >
                    View Details
                  </Button>
                  
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
                      className="border-[#6d031e] text-[#6d031e] hover:bg-[#6d031e] hover:text-white"
                    >
                      <QrCode className="w-4 h-4 mr-1" />
                      QR Code
                    </Button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Order Details Modal */}
      <Dialog open={showOrderDetails} onOpenChange={setShowOrderDetails}>
        <DialogContent className="max-w-md mx-auto max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              {/* Order Header */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-semibold text-gray-900">Order {selectedOrder.qrCode}</h3>
                  <p className="text-sm text-[#6d031e] font-medium">{selectedOrder.stallName || "Unknown Stall"}</p>
                  <p className="text-sm text-gray-600">
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
                <Badge className={`${orderStatusConfig[selectedOrder.status as keyof typeof orderStatusConfig]?.color || orderStatusConfig.pending.color} flex items-center gap-1`}>
                  {orderStatusConfig[selectedOrder.status as keyof typeof orderStatusConfig]?.icon || orderStatusConfig.pending.icon}
                  {orderStatusConfig[selectedOrder.status as keyof typeof orderStatusConfig]?.label || 'Pending'}
                </Badge>
              </div>

              {/* Order Items */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Items Ordered:</h4>
                <div className="space-y-2">
                  {selectedOrder.items && selectedOrder.items.map((item: any, itemIndex: number) => (
                    <div key={itemIndex} className="flex justify-between items-start bg-gray-50 rounded-lg p-3">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.name} x{item.quantity}</p>
                        {item.customizations && item.customizations.length > 0 && (
                          <p className="text-xs text-gray-600">
                            Add-ons: {item.customizations.map((c: any) => c.name).join(", ")}
                          </p>
                        )}
                      </div>
                      <span className="font-semibold text-sm">
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
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="max-w-sm mx-auto">
          {selectedOrder && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-4"
            >
              <DialogHeader>
                <DialogTitle>Order QR Code</DialogTitle>
              </DialogHeader>
              
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
                    Present this QR code to the stall owner when collecting your order.
                  </p>
                </div>

                <div className="text-xs text-gray-600 space-y-1">
                  <div className="flex justify-between">
                    <span>Order Total:</span>
                    <span className="font-medium">₱{selectedOrder.totalAmount?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className="font-medium capitalize">{selectedOrder.status}</span>
                  </div>
                  {selectedOrder.estimatedTime && (
                    <div className="flex justify-between">
                      <span>Est. Time:</span>
                      <span className="font-medium">{selectedOrder.estimatedTime}</span>
                    </div>
                  )}
                </div>

                <Button
                  onClick={() => setShowQRDialog(false)}
                  className="w-full"
                >
                  Close
                </Button>
              </div>
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
                  className="flex-1 bg-[#6d031e] hover:bg-red-700"
                  disabled={isLoading || reviewRating === 0}
                >
                  {isLoading ? "Submitting..." : "Submit Review"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}