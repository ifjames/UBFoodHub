import { useState, useEffect } from "react";
import { ArrowLeft, Plus, Gift, Calendar, Users, Store, Filter, Search, Edit, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocation } from "wouter";
import { useStore } from "@/lib/store";
import { getAllVouchers, deleteVoucher } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import BottomNav from "@/components/layout/bottom-nav";
import VoucherCreateModal from "@/components/vouchers/voucher-create-modal";

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
  isActive: boolean;
  userTargeting: 'all' | 'specific' | 'selected';
  targetUserIds?: string[];
  stallTargeting: 'all' | 'specific';
  stallIds?: string[];
  stallNames?: string[];
  maxUsage: number;
  currentUsage: number;
  createdAt: string;
  createdBy: string;
}

export default function AdminVouchers() {
  const [, setLocation] = useLocation();
  const { state } = useStore();
  const { toast } = useToast();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired' | 'used'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (state.user?.role === 'admin') {
      loadVouchers();
    }
  }, [state.user]);

  const loadVouchers = async () => {
    try {
      setLoading(true);
      const allVouchers = await getAllVouchers();
      setVouchers((allVouchers || []) as Voucher[]);
    } catch (error) {
      console.error("Error loading vouchers:", error);
      setVouchers([]);
      toast({
        title: "Error",
        description: "Failed to load vouchers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVoucher = async (voucherId: string) => {
    if (!confirm("Are you sure you want to delete this voucher?")) return;

    try {
      await deleteVoucher(voucherId);
      setVouchers(vouchers.filter(v => v.id !== voucherId));
      toast({
        title: "Voucher deleted",
        description: "The voucher has been successfully deleted",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete voucher",
        variant: "destructive",
      });
    }
  };

  const getFilteredVouchers = () => {
    let filtered = vouchers;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(v => 
        v.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    const now = new Date();
    switch (statusFilter) {
      case 'active':
        filtered = filtered.filter(v => 
          v.isActive && 
          new Date(v.validUntil) > now &&
          v.currentUsage < v.maxUsage
        );
        break;
      case 'expired':
        filtered = filtered.filter(v => new Date(v.validUntil) <= now);
        break;
      case 'used':
        filtered = filtered.filter(v => v.currentUsage >= v.maxUsage);
        break;
    }

    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

  const filteredVouchers = getFilteredVouchers();

  const getVoucherStatus = (voucher: Voucher) => {
    const now = new Date();
    const validUntil = new Date(voucher.validUntil);
    
    if (!voucher.isActive) {
      return { status: 'Inactive', color: 'bg-gray-100 text-gray-600' };
    } else if (voucher.currentUsage >= voucher.maxUsage) {
      return { status: 'Fully Used', color: 'bg-red-100 text-red-600' };
    } else if (validUntil <= now) {
      return { status: 'Expired', color: 'bg-orange-100 text-orange-600' };
    } else {
      return { status: 'Active', color: 'bg-green-100 text-green-600' };
    }
  };

  const formatDiscount = (voucher: Voucher) => {
    if (voucher.discountType === 'percentage') {
      return `${voucher.discountValue}% OFF`;
    } else {
      return `₱${voucher.discountValue.toFixed(2)} OFF`;
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (state.user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">You don't have permission to view this page.</p>
          <Button onClick={() => setLocation("/")} className="bg-[#820d2a] hover:bg-[#6b0f22]">
            Go Back Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="flex items-center justify-between p-4 bg-[#820d2a]">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/admin")}
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-white" />
              <h1 className="text-lg font-semibold text-white">Voucher Management</h1>
            </div>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-white text-[#820d2a] hover:bg-gray-100"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Voucher
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-4 pb-20 md:pb-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {vouchers.filter(v => v.isActive && new Date(v.validUntil) > new Date() && v.currentUsage < v.maxUsage).length}
              </div>
              <div className="text-sm text-gray-600">Active</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">
                {vouchers.filter(v => new Date(v.validUntil) <= new Date()).length}
              </div>
              <div className="text-sm text-gray-600">Expired</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">
                {vouchers.filter(v => v.currentUsage >= v.maxUsage).length}
              </div>
              <div className="text-sm text-gray-600">Fully Used</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {vouchers.reduce((sum, v) => sum + v.currentUsage, 0)}
              </div>
              <div className="text-sm text-gray-600">Total Uses</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search vouchers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Vouchers</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="used">Fully Used</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Vouchers List */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-8">
              <div className="text-gray-500">Loading vouchers...</div>
            </div>
          ) : filteredVouchers.length === 0 ? (
            <div className="text-center py-8">
              <Gift className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <div className="text-gray-500 mb-2">No vouchers found</div>
              <div className="text-sm text-gray-400 mb-4">
                {searchTerm || statusFilter !== 'all' 
                  ? "Try adjusting your filters"
                  : "Create your first voucher to get started"
                }
              </div>
              {!searchTerm && statusFilter === 'all' && (
                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-[#820d2a] hover:bg-[#6b0f22]"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Voucher
                </Button>
              )}
            </div>
          ) : (
            <AnimatePresence>
              {filteredVouchers.map((voucher, index) => {
                const voucherStatus = getVoucherStatus(voucher);
                
                return (
                  <motion.div
                    key={voucher.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-gray-900">{voucher.title}</h3>
                              <Badge className={voucherStatus.color}>
                                {voucherStatus.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{voucher.description}</p>
                            
                            {/* Discount and Code */}
                            <div className="flex items-center gap-3 mb-2">
                              <Badge className="bg-[#820d2a] text-white">
                                {formatDiscount(voucher)}
                              </Badge>
                              <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                                {voucher.code}
                              </span>
                            </div>

                            {/* Targeting Info */}
                            <div className="flex flex-wrap gap-2 text-xs text-gray-500 mb-2">
                              <div className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                <span>
                                  {voucher.userTargeting === 'all' ? 'All Users' : 
                                   voucher.userTargeting === 'specific' ? 'Specific Users' : 'Selected Users'}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Store className="w-3 h-3" />
                                <span>
                                  {voucher.stallTargeting === 'all' ? 'All Stalls' : 
                                   `${voucher.stallNames?.length || 0} Stalls`}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span>Valid until {formatDate(voucher.validUntil)}</span>
                              </div>
                            </div>

                            {/* Usage Stats */}
                            <div className="text-xs text-gray-500">
                              Used {voucher.currentUsage} of {voucher.maxUsage} times
                              {voucher.minOrderAmount && (
                                <span className="ml-2">• Min. order ₱{voucher.minOrderAmount.toFixed(2)}</span>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2 ml-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                // TODO: View voucher details
                                toast({
                                  title: "Feature coming soon",
                                  description: "Voucher details view will be available soon",
                                });
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteVoucher(voucher.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Create Voucher Modal */}
      <VoucherCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onVoucherCreated={loadVouchers}
      />

      <BottomNav />
    </div>
  );
}