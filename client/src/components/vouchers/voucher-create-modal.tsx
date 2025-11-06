import { useState, useEffect } from "react";
import { X, Plus, Minus, Calendar, Users, Store, Tag, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useStore } from "@/lib/store";
import { createVoucher, getAllUsers, getAllStalls } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

interface VoucherCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVoucherCreated: () => void;
}

interface User {
  uid: string;
  fullName: string;
  email: string;
  role: string;
}

interface Stall {
  id: string;
  name: string;
  category: string;
}

export default function VoucherCreateModal({ isOpen, onClose, onVoucherCreated }: VoucherCreateModalProps) {
  const { state } = useStore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [stalls, setStalls] = useState<Stall[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    code: '',
    discountType: 'fixed' as 'percentage' | 'fixed',
    discountValue: 0,
    minOrderAmount: 0,
    maxDiscount: 0,
    validUntil: '',
    maxUsage: 1,
    userTargeting: 'all' as 'all' | 'specific' | 'selected',
    targetUserEmails: [] as string[],
    stallTargeting: 'all' as 'all' | 'specific',
    targetStallIds: [] as string[],
    isActive: true,
  });

  const [newUserEmail, setNewUserEmail] = useState('');
  const [selectedStalls, setSelectedStalls] = useState<string[]>([]);
  const [step, setStep] = useState(1); // Multi-step form

  useEffect(() => {
    if (isOpen) {
      loadData();
      generateVoucherCode();
    }
  }, [isOpen]);

  const loadData = async () => {
    try {
      const [usersData, stallsData] = await Promise.all([
        getAllUsers(),
        getAllStalls()
      ]);
      setUsers((usersData || []).filter((u: any) => u.role === 'student') as User[]);
      setStalls((stallsData || []) as Stall[]);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const generateVoucherCode = () => {
    const prefix = 'UBF';
    const suffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    setFormData(prev => ({ ...prev, code: `${prefix}${suffix}` }));
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addUserEmail = () => {
    const email = newUserEmail.trim();
    if (!email) return;

    // Validate email format and domain
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    if (!email.endsWith("@ub.edu.ph")) {
      toast({
        title: "Invalid domain",
        description: "Only @ub.edu.ph email addresses are allowed",
        variant: "destructive",
      });
      return;
    }

    if (formData.targetUserEmails.includes(email)) {
      toast({
        title: "Email already added",
        description: "This email is already in the list",
        variant: "destructive",
      });
      return;
    }

    setFormData(prev => ({
      ...prev,
      targetUserEmails: [...prev.targetUserEmails, email]
    }));
    setNewUserEmail('');
  };

  const removeUserEmail = (email: string) => {
    setFormData(prev => ({
      ...prev,
      targetUserEmails: prev.targetUserEmails.filter(e => e !== email)
    }));
  };

  const handleStallSelection = (stallId: string) => {
    setSelectedStalls(prev => 
      prev.includes(stallId) 
        ? prev.filter(id => id !== stallId)
        : [...prev, stallId]
    );
    
    setFormData(prev => ({
      ...prev,
      targetStallIds: selectedStalls.includes(stallId)
        ? prev.targetStallIds.filter(id => id !== stallId)
        : [...prev.targetStallIds, stallId]
    }));
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.title.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a voucher title",
        variant: "destructive",
      });
      return;
    }

    if (!formData.description.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a voucher description",
        variant: "destructive",
      });
      return;
    }

    if (formData.discountValue <= 0) {
      toast({
        title: "Validation Error",
        description: "Discount value must be greater than 0",
        variant: "destructive",
      });
      return;
    }

    if (formData.discountType === 'percentage' && formData.discountValue > 100) {
      toast({
        title: "Validation Error",
        description: "Percentage discount cannot exceed 100%",
        variant: "destructive",
      });
      return;
    }

    if (!formData.validUntil) {
      toast({
        title: "Validation Error",
        description: "Please select an expiry date",
        variant: "destructive",
      });
      return;
    }

    if (new Date(formData.validUntil) <= new Date()) {
      toast({
        title: "Validation Error",
        description: "Expiry date must be in the future",
        variant: "destructive",
      });
      return;
    }

    if (formData.userTargeting === 'selected' && formData.targetUserEmails.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please add at least one user email for selected user targeting",
        variant: "destructive",
      });
      return;
    }

    if (formData.stallTargeting === 'specific' && formData.targetStallIds.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select at least one stall for specific stall targeting",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const voucherData = {
        ...formData,
        stallNames: formData.stallTargeting === 'specific' 
          ? stalls.filter(s => formData.targetStallIds.includes(s.id)).map(s => s.name)
          : [],
        createdBy: state.user?.uid || '',
        currentUsage: 0,
      };

      await createVoucher(voucherData);
      
      toast({
        title: "Voucher Created!",
        description: `Voucher "${formData.title}" has been created successfully`,
      });

      onVoucherCreated();
      onClose();
      resetForm();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create voucher. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      code: '',
      discountType: 'fixed',
      discountValue: 0,
      minOrderAmount: 0,
      maxDiscount: 0,
      validUntil: '',
      maxUsage: 1,
      userTargeting: 'all',
      targetUserEmails: [],
      stallTargeting: 'all',
      targetStallIds: [],
      isActive: true,
    });
    setNewUserEmail('');
    setSelectedStalls([]);
    setStep(1);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const getMinDateTime = () => {
    const now = new Date();
    now.setHours(now.getHours() + 1); // At least 1 hour from now
    return now.toISOString().slice(0, 16);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-[#820d2a]" />
            Create New Voucher
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Step Indicator */}
          <div className="flex justify-center mb-6">
            <div className="flex items-center space-x-2">
              {[1, 2, 3].map((num) => (
                <div key={num} className={`flex items-center ${num < 3 ? 'space-x-2' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step >= num ? 'bg-[#820d2a] text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {num}
                  </div>
                  {num < 3 && <div className={`w-8 h-0.5 ${step > num ? 'bg-[#820d2a]' : 'bg-gray-200'}`} />}
                </div>
              ))}
            </div>
          </div>

          {/* Step 1: Basic Information */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Information</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Voucher Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Student Discount"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code">Voucher Code *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
                      className="font-mono"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={generateVoucherCode}
                    >
                      Generate
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what this voucher offers..."
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="discountType">Discount Type *</Label>
                  <Select value={formData.discountType} onValueChange={(value) => handleInputChange('discountType', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Fixed Amount (₱)</SelectItem>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discountValue">
                    Discount Value * {formData.discountType === 'percentage' ? '(%)' : '(₱)'}
                  </Label>
                  <Input
                    id="discountValue"
                    type="number"
                    min="0"
                    max={formData.discountType === 'percentage' ? 100 : undefined}
                    step={formData.discountType === 'percentage' ? 1 : 0.01}
                    value={formData.discountValue}
                    onChange={(e) => handleInputChange('discountValue', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Conditions & Limits */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Conditions & Limits</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minOrderAmount">Minimum Order Amount (₱)</Label>
                  <Input
                    id="minOrderAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.minOrderAmount}
                    onChange={(e) => handleInputChange('minOrderAmount', parseFloat(e.target.value) || 0)}
                    placeholder="0 = No minimum"
                  />
                </div>
                {formData.discountType === 'percentage' && (
                  <div className="space-y-2">
                    <Label htmlFor="maxDiscount">Maximum Discount (₱)</Label>
                    <Input
                      id="maxDiscount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.maxDiscount}
                      onChange={(e) => handleInputChange('maxDiscount', parseFloat(e.target.value) || 0)}
                      placeholder="0 = No maximum"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="validUntil">Valid Until *</Label>
                  <Input
                    id="validUntil"
                    type="datetime-local"
                    min={getMinDateTime()}
                    value={formData.validUntil}
                    onChange={(e) => handleInputChange('validUntil', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxUsage">Maximum Usage *</Label>
                  <Input
                    id="maxUsage"
                    type="number"
                    min="1"
                    value={formData.maxUsage}
                    onChange={(e) => handleInputChange('maxUsage', parseInt(e.target.value) || 1)}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                />
                <Label htmlFor="isActive">Activate voucher immediately</Label>
              </div>
            </div>
          )}

          {/* Step 3: Targeting */}
          {step === 3 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Targeting Options</h3>
              
              {/* User Targeting */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    User Targeting
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Select value={formData.userTargeting} onValueChange={(value) => handleInputChange('userTargeting', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="selected">Selected Users (by email)</SelectItem>
                    </SelectContent>
                  </Select>

                  {formData.userTargeting === 'selected' && (
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Enter UB email address (@ub.edu.ph)"
                          value={newUserEmail}
                          onChange={(e) => setNewUserEmail(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && addUserEmail()}
                        />
                        <Button type="button" onClick={addUserEmail}>
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      {formData.targetUserEmails.length > 0 && (
                        <div className="space-y-2">
                          <Label>Selected Users ({formData.targetUserEmails.length})</Label>
                          <div className="max-h-32 overflow-y-auto space-y-1">
                            {formData.targetUserEmails.map((email) => (
                              <div key={email} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                                <span className="text-sm">{email}</span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeUserEmail(email)}
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Stall Targeting */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Store className="w-4 h-4" />
                    Stall Targeting
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Select value={formData.stallTargeting} onValueChange={(value) => handleInputChange('stallTargeting', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Stalls</SelectItem>
                      <SelectItem value="specific">Specific Stalls</SelectItem>
                    </SelectContent>
                  </Select>

                  {formData.stallTargeting === 'specific' && (
                    <div className="space-y-3">
                      <Label>Select Stalls ({formData.targetStallIds.length} selected)</Label>
                      <div className="max-h-48 overflow-y-auto grid grid-cols-1 gap-2">
                        {stalls.map((stall) => (
                          <div
                            key={stall.id}
                            className={`flex items-center justify-between p-3 border rounded cursor-pointer transition-colors ${
                              formData.targetStallIds.includes(stall.id)
                                ? 'border-[#820d2a] bg-red-50'
                                : 'border-gray-200 hover:bg-gray-50'
                            }`}
                            onClick={() => handleStallSelection(stall.id)}
                          >
                            <div>
                              <div className="font-medium">{stall.name}</div>
                              <div className="text-sm text-gray-600">{stall.category}</div>
                            </div>
                            {formData.targetStallIds.includes(stall.id) && (
                              <Badge className="bg-[#820d2a]">Selected</Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6 border-t">
            {step > 1 ? (
              <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>
                Previous
              </Button>
            ) : (
              <div></div>
            )}
            
            {step < 3 ? (
              <Button type="button" onClick={() => setStep(step + 1)}>
                Next
              </Button>
            ) : (
              <Button type="button" onClick={handleSubmit} disabled={loading}>
                {loading ? "Creating..." : "Create Voucher"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}