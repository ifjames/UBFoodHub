import { useState, useEffect } from "react";
import { ArrowLeft, Ticket, Gift, Calendar, Clock, Tag, Copy, Check, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useStore } from "@/lib/store";
import { getUserVouchers, validateVoucher } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

interface Voucher {
  id: string;
  code: string;
  title: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  validUntil: string;
  isUsed: boolean;
  usageCount: number;
  maxUsage: number;
  stallIds?: string[];
  stallNames?: string[];
  createdAt: string;
}

interface StudentVoucherDashboardProps {
  onBack: () => void;
}

export default function StudentVoucherDashboard({ onBack }: StudentVoucherDashboardProps) {
  const { state } = useStore();
  const { toast } = useToast();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string>("");
  const [activeTab, setActiveTab] = useState<'available' | 'used' | 'expired'>('available');
  const [manualCode, setManualCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    if (state.user?.uid) {
      loadVouchers();
    }
  }, [state.user?.uid]);

  const loadVouchers = async () => {
    try {
      setLoading(true);
      if (state.user?.uid) {
        const userVouchers = await getUserVouchers(state.user.uid);
        setVouchers((userVouchers || []) as Voucher[]);
      }
    } catch (error) {
      console.error("Error loading vouchers:", error);
      setVouchers([]);
    } finally {
      setLoading(false);
    }
  };

  const copyVoucherCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      toast({
        title: "Code copied!",
        description: "Voucher code has been copied to clipboard",
      });
      setTimeout(() => setCopiedCode(""), 2000);
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Could not copy voucher code",
        variant: "destructive",
      });
    }
  };

  const handleValidateManualCode = async () => {
    if (!manualCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a voucher code",
        variant: "destructive",
      });
      return;
    }

    setIsValidating(true);
    try {
      // Find voucher by code in existing vouchers
      const existingVoucher = vouchers.find(v => v.code.toLowerCase() === manualCode.toLowerCase());
      
      if (existingVoucher) {
        const result = await validateVoucher(state.user?.uid || "", existingVoucher.id);
        if (result.success) {
          toast({
            title: "Voucher found!",
            description: `Valid voucher: ${existingVoucher.title || existingVoucher.code}`,
          });
          setManualCode("");
          // Refresh vouchers to show any updates
          loadVouchers();
        } else {
          toast({
            title: "Invalid voucher",
            description: result.error,
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Voucher not found",
          description: "This voucher code is not available for your account",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to validate voucher code",
        variant: "destructive",
      });
    } finally {
      setIsValidating(false);
    }
  };

  const getVouchersByTab = () => {
    const now = new Date();
    
    switch (activeTab) {
      case 'available':
        return vouchers.filter(v => 
          !v.isUsed && 
          v.usageCount < v.maxUsage &&
          new Date(v.validUntil) > now
        );
      case 'used':
        return vouchers.filter(v => v.isUsed || v.usageCount >= v.maxUsage);
      case 'expired':
        return vouchers.filter(v => 
          !v.isUsed && 
          v.usageCount < v.maxUsage &&
          new Date(v.validUntil) <= now
        );
      default:
        return [];
    }
  };

  const filteredVouchers = getVouchersByTab();

  const formatDiscount = (voucher: Voucher) => {
    if (voucher.discountType === 'percentage') {
      return `${voucher.discountValue}% OFF`;
    } else {
      return `₱${voucher.discountValue.toFixed(2)} OFF`;
    }
  };

  const formatValidUntil = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getVoucherStatus = (voucher: Voucher) => {
    const now = new Date();
    const validUntil = new Date(voucher.validUntil);
    
    if (voucher.isUsed || voucher.usageCount >= voucher.maxUsage) {
      return { status: 'used', color: 'bg-gray-100 text-gray-600' };
    } else if (validUntil <= now) {
      return { status: 'expired', color: 'bg-red-100 text-red-600' };
    } else {
      return { status: 'available', color: 'bg-green-100 text-green-600' };
    }
  };

  const tabCounts = {
    available: vouchers.filter(v => 
      !v.isUsed && 
      v.usageCount < v.maxUsage &&
      new Date(v.validUntil) > new Date()
    ).length,
    used: vouchers.filter(v => v.isUsed || v.usageCount >= v.maxUsage).length,
    expired: vouchers.filter(v => 
      !v.isUsed && 
      v.usageCount < v.maxUsage &&
      new Date(v.validUntil) <= new Date()
    ).length
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="flex items-center p-4 bg-[#820d2a]">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="mr-3 text-white hover:bg-white/20"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-white" />
            <h1 className="text-lg font-semibold text-white">My Vouchers</h1>
          </div>
        </div>
      </div>

      {/* Desktop Layout Container */}
      <div className="max-w-4xl mx-auto p-4 space-y-4">
        {/* Manual Voucher Code Entry */}
        <Card className="bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Enter Voucher Code
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Input
                placeholder="Enter your voucher code here"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={handleValidateManualCode}
                disabled={isValidating || !manualCode.trim()}
                className="bg-[#820d2a] hover:bg-[#6d031e]"
              >
                {isValidating ? "Validating..." : "Validate"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card className="text-center">
            <CardContent className="p-3">
              <div className="text-lg font-bold text-green-600">{tabCounts.available}</div>
              <div className="text-xs text-gray-600">Available</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-3">
              <div className="text-lg font-bold text-gray-600">{tabCounts.used}</div>
              <div className="text-xs text-gray-600">Used</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-3">
              <div className="text-lg font-bold text-red-600">{tabCounts.expired}</div>
              <div className="text-xs text-gray-600">Expired</div>
            </CardContent>
          </Card>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-white rounded-lg p-1">
          {[
            { key: 'available', label: 'Available', count: tabCounts.available },
            { key: 'used', label: 'Used', count: tabCounts.used },
            { key: 'expired', label: 'Expired', count: tabCounts.expired }
          ].map((tab) => (
            <Button
              key={tab.key}
              variant={activeTab === tab.key ? "default" : "ghost"}
              className={`flex-1 ${activeTab === tab.key ? 'bg-[#820d2a] text-white' : 'text-gray-600'}`}
              onClick={() => setActiveTab(tab.key as any)}
            >
              {tab.label} ({tab.count})
            </Button>
          ))}
        </div>

        {/* Vouchers List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="text-gray-500">Loading vouchers...</div>
            </div>
          ) : filteredVouchers.length === 0 ? (
            <div className="text-center py-8">
              <Ticket className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <div className="text-gray-500 mb-2">No vouchers found</div>
              <div className="text-sm text-gray-400">
                {activeTab === 'available' && "You don't have any available vouchers"}
                {activeTab === 'used' && "No used vouchers yet"}
                {activeTab === 'expired' && "No expired vouchers"}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {filteredVouchers.map((voucher, index) => {
                  const voucherStatus = getVoucherStatus(voucher);
                
                return (
                  <motion.div
                    key={voucher.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className={`${activeTab !== 'available' ? 'opacity-75' : ''}`}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Gift className="w-4 h-4 text-[#820d2a]" />
                              <h3 className="font-semibold text-gray-900">{voucher.title}</h3>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{voucher.description}</p>
                            
                            {/* Discount Amount */}
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className="bg-[#820d2a] text-white">
                                {formatDiscount(voucher)}
                              </Badge>
                              {voucher.minOrderAmount && (
                                <span className="text-xs text-gray-500">
                                  Min. order ₱{voucher.minOrderAmount.toFixed(2)}
                                </span>
                              )}
                            </div>

                            {/* Stall Information */}
                            {voucher.stallNames && voucher.stallNames.length > 0 && (
                              <div className="flex items-center gap-1 mb-2">
                                <Tag className="w-3 h-3 text-gray-500" />
                                <span className="text-xs text-gray-500">
                                  Valid at: {voucher.stallNames.join(", ")}
                                </span>
                              </div>
                            )}

                            {/* Expiry */}
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Calendar className="w-3 h-3" />
                              <span>Valid until {formatValidUntil(voucher.validUntil)}</span>
                            </div>
                          </div>

                          <Badge className={voucherStatus.color}>
                            {voucherStatus.status}
                          </Badge>
                        </div>

                        {/* Voucher Code */}
                        <div className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Voucher Code</div>
                            <div className="font-mono font-bold text-gray-900">{voucher.code}</div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyVoucherCode(voucher.code)}
                            disabled={activeTab !== 'available'}
                            className="ml-3"
                          >
                            {copiedCode === voucher.code ? (
                              <Check className="w-4 h-4 text-green-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        </div>

                        {/* Usage Information */}
                        {voucher.maxUsage > 1 && (
                          <div className="mt-2 text-xs text-gray-500">
                            Used {voucher.usageCount} of {voucher.maxUsage} times
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}