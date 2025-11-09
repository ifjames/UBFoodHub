import { useState, useEffect } from "react";
import { ArrowLeft, Plus, Gift, Calendar, Users, Store, Filter, Search, Edit, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useLocation } from "wouter";
import { useStore } from "@/lib/store";
import { getAllVouchers, deleteVoucher, getVoucherStats } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import BottomNav from "@/components/layout/bottom-nav";
import VoucherCreateModal from "@/components/vouchers/voucher-create-modal";
import VoucherRedemptionModal from "@/components/vouchers/voucher-redemption-modal";
import { usePageTitle } from "@/hooks/use-page-title";

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
  usePageTitle("Admin Vouchers");
  const [, setLocation] = useLocation();
  const { state } = useStore();
  const { toast } = useToast();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired' | 'used'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRedemptionModal, setShowRedemptionModal] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [voucherToDelete, setVoucherToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (state.user?.role === 'admin') {
      loadVouchers();
    }
  }, [state.user]);

  const loadVouchers = async () => {
    try {
      setLoading(true);
      const allVouchers = await getAllVouchers();
      
      // Fetch actual usage stats for each voucher from userVouchers collection
      const vouchersWithStats = await Promise.all(
        (allVouchers || []).map(async (voucher: any) => {
          try {
            const stats = await getVoucherStats(voucher.id);
            return {
              ...voucher,
              currentUsage: stats.totalUsed, // Use actual redemption count
            };
          } catch (error) {
            console.error(`Error getting stats for voucher ${voucher.id}:`, error);
            return voucher;
          }
        })
      );
      
      setVouchers(vouchersWithStats as Voucher[]);
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
    setVoucherToDelete(voucherId);
    setShowDeleteDialog(true);
  };

  const confirmDeleteVoucher = async () => {
    if (!voucherToDelete) return;

    try {
      await deleteVoucher(voucherToDelete);
      setVouchers(vouchers.filter(v => v.id !== voucherToDelete));
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
    } finally {
      setShowDeleteDialog(false);
      setVoucherToDelete(null);
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
      return `₱${(voucher.discountValue || 0).toFixed(2)} OFF`;
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

      <div className="p-4 md:p-6 space-y-4 md:space-y-6 pb-20 md:pb-8 max-w-7xl mx-auto">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
          <Card>
            <CardContent className="p-4 md:p-6 text-center">
              <div className="text-2xl md:text-3xl font-bold text-green-600">
                {vouchers.filter(v => v.isActive && new Date(v.validUntil) > new Date() && (v.currentUsage || 0) < (v.maxUsage || 0)).length || 0}
              </div>
              <div className="text-sm md:text-base text-gray-600">Active</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 md:p-6 text-center">
              <div className="text-2xl md:text-3xl font-bold text-orange-600">
                {vouchers.filter(v => new Date(v.validUntil) <= new Date()).length || 0}
              </div>
              <div className="text-sm md:text-base text-gray-600">Expired</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 md:p-6 text-center">
              <div className="text-2xl md:text-3xl font-bold text-red-600">
                {vouchers.filter(v => (v.currentUsage || 0) >= (v.maxUsage || 0)).length || 0}
              </div>
              <div className="text-sm md:text-base text-gray-600">Fully Used</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 md:p-6 text-center">
              <div className="text-2xl md:text-3xl font-bold text-blue-600">
                {vouchers.reduce((sum, v) => sum + (v.currentUsage || 0), 0) || 0}
              </div>
              <div className="text-sm md:text-base text-gray-600">Total Uses</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row gap-3 md:gap-4">
              <div className="relative flex-1 md:max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search vouchers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                <SelectTrigger className="w-full md:w-64">
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
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block">
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="text-left p-4 font-medium text-gray-900">Voucher</th>
                          <th className="text-left p-4 font-medium text-gray-900">Discount</th>
                          <th className="text-left p-4 font-medium text-gray-900">Code</th>
                          <th className="text-left p-4 font-medium text-gray-900">Status</th>
                          <th className="text-left p-4 font-medium text-gray-900">Usage</th>
                          <th className="text-left p-4 font-medium text-gray-900">Valid Until</th>
                          <th className="text-left p-4 font-medium text-gray-900">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        <AnimatePresence>
                          {filteredVouchers.map((voucher, index) => {
                            const voucherStatus = getVoucherStatus(voucher);
                            
                            return (
                              <motion.tr
                                key={voucher.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ delay: index * 0.02 }}
                                className="border-b hover:bg-gray-50"
                              >
                                <td className="p-4">
                                  <div>
                                    <h3 className="font-semibold text-gray-900 mb-1">{voucher.title}</h3>
                                    <p className="text-sm text-gray-600 line-clamp-2">{voucher.description}</p>
                                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                                      <div className="flex items-center gap-1">
                                        <Users className="w-3 h-3" />
                                        <span>
                                          {voucher.userTargeting === 'all' ? 'All Users' : 
                                           voucher.userTargeting === 'specific' ? 'Specific' : 'Selected'}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <Store className="w-3 h-3" />
                                        <span>
                                          {voucher.stallTargeting === 'all' ? 'All Stalls' : 
                                           `${voucher.stallNames?.length || 0} Stalls`}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="p-4">
                                  <Badge className="bg-[#820d2a] text-white">
                                    {formatDiscount(voucher)}
                                  </Badge>
                                </td>
                                <td className="p-4">
                                  <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                                    {voucher.code}
                                  </span>
                                </td>
                                <td className="p-4">
                                  <Badge className={voucherStatus.color}>
                                    {voucherStatus.status}
                                  </Badge>
                                </td>
                                <td className="p-4">
                                  <div className="text-sm">
                                    <div className="font-medium">{voucher.currentUsage || 0} / {voucher.maxUsage || 0}</div>
                                    {voucher.minOrderAmount && (
                                      <div className="text-xs text-gray-500">Min. ₱{(voucher.minOrderAmount || 0).toFixed(2)}</div>
                                    )}
                                  </div>
                                </td>
                                <td className="p-4 text-sm text-gray-600">
                                  {formatDate(voucher.validUntil)}
                                </td>
                                <td className="p-4">
                                  <div className="flex gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedVoucher(voucher);
                                        setShowRedemptionModal(true);
                                      }}
                                      title="View redemptions"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleDeleteVoucher(voucher.id)}
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </td>
                              </motion.tr>
                            );
                          })}
                        </AnimatePresence>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
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
                                Used {voucher.currentUsage || 0} of {voucher.maxUsage || 0} times
                                {voucher.minOrderAmount && (
                                  <span className="ml-2">• Min. order ₱{(voucher.minOrderAmount || 0).toFixed(2)}</span>
                                )}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 ml-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedVoucher(voucher);
                                  setShowRedemptionModal(true);
                                }}
                                title="View redemptions"
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
            </div>
          </>
        )}
      </div>

      {/* Create Voucher Modal */}
      <VoucherCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onVoucherCreated={loadVouchers}
      />

      {/* Voucher Redemption Modal */}
      <VoucherRedemptionModal
        isOpen={showRedemptionModal}
        onClose={() => {
          setShowRedemptionModal(false);
          setSelectedVoucher(null);
        }}
        voucher={selectedVoucher}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Voucher</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this voucher? This action cannot be undone.
              Any users who have this voucher will no longer be able to use it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteVoucher}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Voucher
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BottomNav />
    </div>
  );
}