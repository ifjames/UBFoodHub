import { useState } from "react";
import { X, FileText, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore } from "@/lib/store";
import { addDocument } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

interface OrderCancellationRequestProps {
  order: any;
  onRequestSubmitted?: () => void;
}

export default function OrderCancellationRequest({ order, onRequestSubmitted }: OrderCancellationRequestProps) {
  const { state } = useStore();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestForm, setRequestForm] = useState({
    reason: "",
    category: "",
    description: "",
  });

  const cancellationReasons = [
    { value: "wrong_order", label: "Ordered wrong item" },
    { value: "financial", label: "Changed mind / Financial reasons" },
    { value: "emergency", label: "Emergency situation" },
    { value: "quality_concern", label: "Quality or safety concern" },
    { value: "timing", label: "Can't wait for pickup time" },
    { value: "duplicate", label: "Duplicate order" },
    { value: "other", label: "Other reason" },
  ];

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!requestForm.category || !requestForm.description) {
      toast({
        title: "Missing Information",
        description: "Please select a reason category and provide details.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const cancellationData = {
        orderId: order.id,
        orderQrCode: order.qrCode,
        stallId: order.stallId,
        stallName: order.stallName,
        customerId: state.user?.id,
        customerName: state.user?.fullName,
        customerEmail: state.user?.email,
        studentId: state.user?.studentId,
        reasonCategory: requestForm.category,
        reasonLabel: cancellationReasons.find(r => r.value === requestForm.category)?.label,
        description: requestForm.description,
        orderTotal: order.totalAmount,
        paymentMethod: order.paymentMethod,
        status: "pending", // pending, approved, declined
        requestedAt: new Date(),
        respondedAt: null,
        responseReason: null,
        respondedBy: null,
      };

      await addDocument("cancellationRequests", cancellationData);

      toast({
        title: "Cancellation Request Submitted",
        description: "Your request has been sent to the stall owner for review.",
      });

      // Reset form
      setRequestForm({
        reason: "",
        category: "",
        description: "",
      });
      
      setIsDialogOpen(false);
      onRequestSubmitted?.();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit cancellation request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if order can be cancelled
  const canCancel = order.status === "pending" || order.status === "preparing";

  if (!canCancel) {
    return (
      <Button disabled variant="outline" className="w-full">
        Cannot Cancel
      </Button>
    );
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full text-[#d90000] border-red-300 hover:bg-red-50 hover:text-[#d90000]">
          <X className="w-4 h-4 mr-2" />
          Request Cancellation
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            Cancel Order Request
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Order Info */}
          <Card className="bg-gray-50">
            <CardContent className="p-3">
              <h4 className="font-medium text-sm mb-1">Order Details</h4>
              <p className="text-sm text-gray-600">Order: {order.qrCode}</p>
              <p className="text-sm text-gray-600">Stall: {order.stallName}</p>
              <p className="text-sm text-gray-600">Total: ₱{order.totalAmount?.toFixed(2)}</p>
              <p className="text-sm text-gray-600">Status: {order.status}</p>
            </CardContent>
          </Card>

          {/* Warning */}
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-orange-800 mb-1">Important Notice</p>
                  <p className="text-orange-700">
                    Cancellation requests require approval from the stall owner. 
                    Frequent cancellations without valid reasons may result in penalties.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <form onSubmit={handleSubmitRequest} className="space-y-4">
            <div>
              <Label htmlFor="category">Reason for Cancellation</Label>
              <Select value={requestForm.category} onValueChange={(value) => setRequestForm(prev => ({ ...prev, category: value }))}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  {cancellationReasons.map((reason) => (
                    <SelectItem key={reason.value} value={reason.value}>
                      {reason.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">Detailed Explanation</Label>
              <Textarea
                id="description"
                value={requestForm.description}
                onChange={(e) => setRequestForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Please provide a detailed explanation for your cancellation request..."
                rows={4}
                className="mt-1"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Be specific about your situation to help the stall owner understand your request.
              </p>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-orange-600 hover:bg-orange-700"
              >
                {isSubmitting ? "Submitting..." : "Submit Request"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}