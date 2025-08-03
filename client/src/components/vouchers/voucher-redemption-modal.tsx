import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, ShoppingBag, Calendar, DollarSign } from "lucide-react";
import { getVoucherRedemptions, getVoucherStats } from "@/lib/firebase";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

interface VoucherRedemptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  voucher: any;
}

interface Redemption {
  id: string;
  userId: string;
  voucherId: string;
  isUsed: boolean;
  usedAt: string;
  orderId?: string;
  user: any;
  order?: any;
}

interface VoucherStats {
  totalRedeemed: number;
  totalUsed: number;
  maxUsage: number;
  remainingUses: number;
}

export default function VoucherRedemptionModal({ isOpen, onClose, voucher }: VoucherRedemptionModalProps) {
  const { toast } = useToast();
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [stats, setStats] = useState<VoucherStats>({
    totalRedeemed: 0,
    totalUsed: 0,
    maxUsage: 0,
    remainingUses: 0
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && voucher?.id) {
      loadRedemptionData();
    }
  }, [isOpen, voucher?.id]);

  const loadRedemptionData = async () => {
    setLoading(true);
    try {
      const [redemptionsData, statsData] = await Promise.all([
        getVoucherRedemptions(voucher.id),
        getVoucherStats(voucher.id)
      ]);
      
      setRedemptions(redemptionsData as Redemption[]);
      setStats(statsData);
    } catch (error) {
      console.error("Error loading redemption data:", error);
      toast({
        title: "Error",
        description: "Failed to load voucher redemption data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!voucher) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Voucher Redemptions: {voucher.code}
          </DialogTitle>
          <DialogDescription>
            View detailed redemption history and usage statistics for this voucher.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="text-gray-500">Loading redemption data...</div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stats Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.totalRedeemed}</div>
                  <div className="text-sm text-gray-600">Total Redeemed</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.totalUsed}</div>
                  <div className="text-sm text-gray-600">Actually Used</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">{stats.maxUsage}</div>
                  <div className="text-sm text-gray-600">Max Usage</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-orange-600">{stats.remainingUses}</div>
                  <div className="text-sm text-gray-600">Remaining</div>
                </CardContent>
              </Card>
            </div>

            {/* Redemptions List */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Redemption History</h3>
              
              {redemptions.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <div className="text-gray-500">No redemptions yet</div>
                  <div className="text-sm text-gray-400">This voucher hasn't been redeemed by any users</div>
                </div>
              ) : (
                <div className="space-y-3">
                  {redemptions.map((redemption, index) => (
                    <motion.div
                      key={redemption.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="border-l-4 border-l-blue-500">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <Avatar className="w-10 h-10">
                                <AvatarFallback className="bg-blue-100 text-blue-600">
                                  {redemption.user?.name?.charAt(0) || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-semibold">{redemption.user?.name || 'Unknown User'}</h4>
                                  <Badge variant={redemption.isUsed ? "default" : "secondary"}>
                                    {redemption.isUsed ? "Used" : "Redeemed"}
                                  </Badge>
                                </div>
                                
                                <div className="space-y-1 text-sm text-gray-600">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    <span>Redeemed: {formatDate(redemption.usedAt)}</span>
                                  </div>
                                  
                                  {redemption.user?.email && (
                                    <div>Email: {redemption.user.email}</div>
                                  )}
                                  
                                  {redemption.user?.studentId && (
                                    <div>Student ID: {redemption.user.studentId}</div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {redemption.order && (
                              <div className="ml-4 text-right">
                                <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
                                  <ShoppingBag className="w-3 h-3" />
                                  <span>Order: {redemption.order.qrCode}</span>
                                </div>
                                <div className="flex items-center gap-1 text-sm font-semibold">
                                  <DollarSign className="w-3 h-3" />
                                  <span>₱{redemption.order.total?.toFixed(2) || '0.00'}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}