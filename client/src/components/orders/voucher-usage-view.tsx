import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Ticket, User, DollarSign, Calendar, Tag } from "lucide-react";
import { getOrdersWithVouchers } from "@/lib/firebase";
import { motion } from "framer-motion";

interface VoucherUsageViewProps {
  stallId: string;
}

interface OrderWithVoucher {
  id: string;
  qrCode: string;
  total: number;
  voucherId: string;
  voucherDiscount: number;
  status: string;
  createdAt: any;
  voucher: any;
  customer: any;
}

export default function VoucherUsageView({ stallId }: VoucherUsageViewProps) {
  const [ordersWithVouchers, setOrdersWithVouchers] = useState<OrderWithVoucher[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (stallId) {
      loadOrdersWithVouchers();
    }
  }, [stallId]);

  const loadOrdersWithVouchers = async () => {
    setLoading(true);
    try {
      const data = await getOrdersWithVouchers(stallId);
      setOrdersWithVouchers(data as OrderWithVoucher[]);
    } catch (error) {
      console.error("Error loading orders with vouchers:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: any) => {
    let date;
    if (timestamp?.toDate) {
      date = timestamp.toDate();
    } else if (timestamp) {
      date = new Date(timestamp);
    } else {
      return 'Unknown';
    }
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'preparing':
        return 'bg-yellow-100 text-yellow-800';
      case 'ready':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ticket className="w-5 h-5" />
            Orders with Vouchers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-gray-500">Loading voucher usage...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Ticket className="w-5 h-5" />
          Orders with Vouchers ({ordersWithVouchers.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {ordersWithVouchers.length === 0 ? (
          <div className="text-center py-8">
            <Ticket className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <div className="text-gray-500 mb-2">No voucher usage yet</div>
            <div className="text-sm text-gray-400">Orders with vouchers will appear here</div>
          </div>
        ) : (
          <div className="space-y-4">
            {ordersWithVouchers.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="border-l-4 border-l-green-500">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="bg-green-100 text-green-600">
                            {order.customer?.name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">Order: {order.qrCode}</h4>
                            <Badge className={getStatusColor(order.status)}>
                              {order.status}
                            </Badge>
                          </div>
                          
                          <div className="space-y-1 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              <span>{order.customer?.name || 'Unknown Customer'}</span>
                            </div>
                            
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>{formatDate(order.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="flex items-center gap-1 text-sm font-semibold mb-1">
                          <DollarSign className="w-3 h-3" />
                          <span>₱{order.total?.toFixed(2) || '0.00'}</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          Discount: ₱{order.voucherDiscount?.toFixed(2) || '0.00'}
                        </div>
                      </div>
                    </div>

                    {/* Voucher Details */}
                    <div className="bg-gray-50 rounded-lg p-3 mt-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <Tag className="w-4 h-4 text-gray-600" />
                          <div>
                            <div className="font-medium text-sm">
                              {order.voucher?.title || `Voucher: ${order.voucher?.code}`}
                            </div>
                            <div className="text-xs text-gray-600">
                              Code: {order.voucher?.code}
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <Badge className="bg-green-100 text-green-800">
                            {order.voucher?.discountType === 'percentage' 
                              ? `${order.voucher?.discountValue}% OFF`
                              : `₱${order.voucher?.discountValue} OFF`
                            }
                          </Badge>
                        </div>
                      </div>
                      
                      {order.voucher?.description && (
                        <div className="text-xs text-gray-500 mt-2">
                          {order.voucher.description}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}