import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Award, Star, Gift, Clock, TrendingUp } from "lucide-react";
import { useStore } from "@/lib/store";
import { getUserLoyaltyTier, redeemLoyaltyPoints, getLoyaltyTransactions, getUserVouchers } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

export default function LoyaltyDashboard() {
  const { state, dispatch } = useStore();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [pointsToRedeem, setPointsToRedeem] = useState("");
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [showRedeemDialog, setShowRedeemDialog] = useState(false);

  const userPoints = state.user?.loyaltyPoints || 0;
  const loyaltyTier = getUserLoyaltyTier(userPoints);

  useEffect(() => {
    if (state.user?.uid) {
      loadTransactions();
      loadVouchers();
    }
  }, [state.user?.uid]);

  const loadTransactions = async () => {
    try {
      const txns = await getLoyaltyTransactions(state.user.uid);
      setTransactions(txns || []);
    } catch (error) {
      // Silently handle errors and show empty state
      setTransactions([]);
    }
  };

  const loadVouchers = async () => {
    try {
      const userVouchers = await getUserVouchers(state.user.uid);
      setVouchers(userVouchers || []);
    } catch (error) {
      // Silently handle errors and show empty state
      setVouchers([]);
    }
  };

  const handleRedeem = async () => {
    const points = parseInt(pointsToRedeem);
    if (!points || points < 100 || points % 100 !== 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount (multiples of 100 points)",
        variant: "destructive",
      });
      return;
    }

    if (points > userPoints) {
      toast({
        title: "Insufficient Points",
        description: "You don't have enough points for this redemption",
        variant: "destructive",
      });
      return;
    }

    setIsRedeeming(true);
    try {
      const result = await redeemLoyaltyPoints(state.user.uid, points);
      if (result.success) {
        // Update user points in store
        dispatch({
          type: "SET_USER",
          payload: {
            ...state.user,
            loyaltyPoints: result.newTotal
          }
        });

        toast({
          title: "Points Redeemed!",
          description: `You've received ₱${result.discountAmount.toFixed(2)} discount voucher (Code: ${result.voucherCode})`,
        });

        setPointsToRedeem("");
        setShowRedeemDialog(false);
        loadTransactions();
        loadVouchers();
      } else {
        toast({
          title: "Redemption Failed",
          description: result.error || "Unable to redeem points",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to redeem points. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRedeeming(false);
    }
  };

  const quickRedeemOptions = [100, 200, 500, 1000].filter(amount => amount <= userPoints);

  return (
    <div className="space-y-6">
      {/* Points Overview */}
      <Card className="bg-gradient-to-r from-[#820d2a] to-[#B22222] text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-6 h-6" />
                <span className="text-lg font-semibold">Loyalty Points</span>
              </div>
              <div className="text-3xl font-bold mb-1">{userPoints.toLocaleString()} pts</div>
              <Badge className={`${loyaltyTier.color} bg-white/20 hover:bg-white/30`}>
                <Star className="w-3 h-3 mr-1" />
                {loyaltyTier.tier} Member
              </Badge>
            </div>
            <div className="text-right">
              <div className="text-sm opacity-90 mb-1">Tier Benefits</div>
              <div className="text-xs opacity-75">{loyaltyTier.benefits}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Gift className="w-5 h-5 text-maroon-600" />
              Redeem Points
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-sm text-gray-600">
                Convert your points to discount vouchers
              </div>
              <div className="text-sm font-medium text-maroon-600">
                100 points = ₱10 discount
              </div>
              <Dialog open={showRedeemDialog} onOpenChange={setShowRedeemDialog}>
                <DialogTrigger asChild>
                  <Button 
                    className="w-full bg-maroon-600 hover:bg-maroon-700"
                    disabled={userPoints < 100}
                  >
                    Redeem Points
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Redeem Loyalty Points</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="text-sm text-gray-600">
                      Available Points: <span className="font-semibold">{userPoints}</span>
                    </div>
                    
                    {/* Quick Options */}
                    <div>
                      <div className="text-sm font-medium mb-2">Quick Redeem</div>
                      <div className="grid grid-cols-2 gap-2">
                        {quickRedeemOptions.map(amount => (
                          <Button
                            key={amount}
                            variant="outline"
                            size="sm"
                            onClick={() => setPointsToRedeem(amount.toString())}
                            className="text-xs"
                          >
                            {amount} pts → ₱{(amount / 10).toFixed(0)}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Custom Amount (multiples of 100)</label>
                      <Input
                        type="number"
                        placeholder="Enter points to redeem"
                        value={pointsToRedeem}
                        onChange={(e) => setPointsToRedeem(e.target.value)}
                        min="100"
                        step="100"
                      />
                    </div>

                    <Button 
                      onClick={handleRedeem}
                      disabled={isRedeeming || !pointsToRedeem}
                      className="w-full"
                    >
                      {isRedeeming ? "Redeeming..." : "Redeem Points"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Earn More Points
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Regular Orders</span>
                  <span className="font-medium">1 pt per ₱10</span>
                </div>
                <div className="flex justify-between">
                  <span>New Stalls</span>
                  <span className="font-medium text-green-600">2x Points!</span>
                </div>
                <div className="flex justify-between">
                  <span>Next Tier ({loyaltyTier.tier === "Bronze" ? "Silver" : "Gold"})</span>
                  <span className="font-medium">{loyaltyTier.tier === "Bronze" ? "500" : "1000"} pts</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length > 0 ? (
            <div className="space-y-3">
              {transactions.slice(0, 10).map((transaction, index) => (
                <motion.div
                  key={transaction.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <div className="font-medium text-sm">{transaction.description}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(transaction.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                  <div className={`font-semibold ${
                    transaction.type === "earned" ? "text-green-600" : "text-red-600"
                  }`}>
                    {transaction.type === "earned" ? "+" : ""}{transaction.points} pts
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-6">
              <Award className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <div>No transactions yet</div>
              <div className="text-sm">Start ordering to earn points!</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}