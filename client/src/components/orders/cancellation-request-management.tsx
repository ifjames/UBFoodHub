import { useState, useEffect } from "react";
import { CheckCircle, XCircle, FileText, Clock, User, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useStore } from "@/lib/store";
import { subscribeToQuery, updateDocument, addDocument, getDocument } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { createNotification, NotificationTemplates } from "@/lib/notifications";

interface CancellationRequest {
  id: string;
  orderId: string;
  orderQrCode: string;
  stallId: string;
  stallName: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  studentId: string;
  profilePicture?: string;
  reasonCategory: string;
  reasonLabel: string;
  description: string;
  orderTotal: number;
  paymentMethod: string;
  status: "pending" | "approved" | "declined";
  requestedAt: any;
  respondedAt?: any;
  responseReason?: string;
  respondedBy?: string;
}

interface CancellationRequestManagementProps {
  stallId: string;
}

export default function CancellationRequestManagement({ stallId }: CancellationRequestManagementProps) {
  const { state } = useStore();
  const { toast } = useToast();
  const [requests, setRequests] = useState<CancellationRequest[]>([]);
  const [enrichedRequests, setEnrichedRequests] = useState<CancellationRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<CancellationRequest | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [responseReason, setResponseReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (stallId) {
      const unsubscribe = subscribeToQuery(
        "cancellationRequests",
        "stallId",
        "==",
        stallId,
        (data) => {
          const sortedRequests = data.sort((a, b) => {
            const aTime = a.requestedAt?.toDate ? a.requestedAt.toDate() : new Date(a.requestedAt);
            const bTime = b.requestedAt?.toDate ? b.requestedAt.toDate() : new Date(b.requestedAt);
            return bTime.getTime() - aTime.getTime();
          });
          setRequests(sortedRequests);
        }
      );
      return unsubscribe;
    }
  }, [stallId]);

  // Enrich requests with user profile pictures
  useEffect(() => {
    const enrichRequestsWithUserData = async () => {
      if (requests.length === 0) {
        setEnrichedRequests([]);
        return;
      }

      try {
        const enriched = await Promise.all(
          requests.map(async (request) => {
            try {
              const userDoc = await getDocument("users", request.customerId);
              if (userDoc.exists()) {
                const userData = userDoc.data();
                return {
                  ...request,
                  profilePicture: userData.photoURL || null,
                  studentId: userData.studentId || request.studentId || 'N/A'
                };
              }
              return request;
            } catch (error) {
              console.error("Error fetching user data for cancellation:", error);
              return request;
            }
          })
        );
        setEnrichedRequests(enriched);
      } catch (error) {
        console.error("Error enriching cancellation requests:", error);
        setEnrichedRequests(requests);
      }
    };

    enrichRequestsWithUserData();
  }, [requests]);

  const handleApproveRequest = async (request: CancellationRequest) => {
    setIsProcessing(true);
    try {
      // Update cancellation request status
      await updateDocument("cancellationRequests", request.id, {
        status: "approved",
        respondedAt: new Date(),
        responseReason: responseReason || "Request approved by stall owner",
        respondedBy: state.user?.id,
      });

      // Cancel the actual order
      await updateDocument("orders", request.orderId, {
        status: "cancelled",
        cancelledAt: new Date(),
        cancelledBy: state.user?.id,
        cancellationReason: request.reasonLabel,
      });

      // Send notification to customer
      await createNotification(
        NotificationTemplates.orderCancellationRequest(
          request.customerId,
          request.orderQrCode,
          "approved"
        )
      );

      toast({
        title: "Request Approved",
        description: "The cancellation request has been approved and the order has been cancelled.",
      });

      setSelectedRequest(null);
      setIsDialogOpen(false);
      setResponseReason("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve the cancellation request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeclineRequest = async (request: CancellationRequest) => {
    if (!responseReason.trim()) {
      toast({
        title: "Reason Required",
        description: "Please provide a reason for declining the request.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      // Update cancellation request status
      await updateDocument("cancellationRequests", request.id, {
        status: "declined",
        respondedAt: new Date(),
        responseReason,
        respondedBy: state.user?.id,
      });

      // Send notification to customer
      await createNotification(
        NotificationTemplates.orderCancellationRequest(
          request.customerId,
          request.orderQrCode,
          "declined",
          responseReason
        )
      );

      toast({
        title: "Request Declined",
        description: "The cancellation request has been declined.",
      });

      setSelectedRequest(null);
      setIsDialogOpen(false);
      setResponseReason("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to decline the cancellation request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "declined":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (timestamp: any) => {
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const pendingRequests = enrichedRequests.filter(r => r.status === "pending");
  const processedRequests = enrichedRequests.filter(r => r.status !== "pending");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <FileText className="w-5 h-5 text-orange-600" />
          Cancellation Requests
        </h3>
        <Badge variant="outline" className="text-orange-600">
          {pendingRequests.length} Pending
        </Badge>
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Pending Requests</h4>
          {pendingRequests.map((request) => (
            <Card key={request.id} className="border-l-4 border-l-orange-500" data-testid={`cancellation-card-${request.id}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      {request.profilePicture ? (
                        <img 
                          src={request.profilePicture} 
                          alt={request.customerName}
                          className="w-10 h-10 rounded-full object-cover border-2 border-orange-500"
                          data-testid={`cancellation-profile-${request.id}`}
                        />
                      ) : (
                        <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-medium text-sm">
                            {request.customerName?.charAt(0) || 'S'}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-sm" data-testid={`cancellation-name-${request.id}`}>
                          {request.customerName}
                        </p>
                        <p className="text-xs text-gray-500" data-testid={`cancellation-studentid-${request.id}`}>
                          Student ID: {request.studentId || 'N/A'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getStatusBadgeColor(request.status)}>
                        {request.status.toUpperCase()}
                      </Badge>
                      <Badge variant="outline">
                        Order: {request.orderQrCode}
                      </Badge>
                    </div>
                    
                    <h4 className="font-semibold text-gray-900 mb-1">{request.reasonLabel}</h4>
                    <p className="text-sm text-gray-600 mb-2">{request.description}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(request.requestedAt)}
                      </span>
                      <span>Total: ₱{request.orderTotal.toFixed(2)}</span>
                      <span>Payment: {request.paymentMethod}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2 ml-4">
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedRequest(request);
                        setIsDialogOpen(true);
                      }}
                      className="bg-blue-600 hover:bg-blue-700"
                      data-testid={`button-review-${request.id}`}
                    >
                      Review
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Processed Requests */}
      {processedRequests.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Recent Responses</h4>
          {processedRequests.slice(0, 5).map((request) => (
            <Card key={request.id} className="bg-gray-50">
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  {request.profilePicture ? (
                    <img 
                      src={request.profilePicture} 
                      alt={request.customerName}
                      className="w-8 h-8 rounded-full object-cover border border-gray-300"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium text-xs">
                        {request.customerName?.charAt(0) || 'S'}
                      </span>
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={getStatusBadgeColor(request.status)}>
                        {request.status.toUpperCase()}
                      </Badge>
                      <span className="text-sm text-gray-600">
                        Order: {request.orderQrCode}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{request.reasonLabel}</p>
                    <p className="text-xs text-gray-500">
                      {request.customerName} ({request.studentId}) • {formatDate(request.respondedAt)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {enrichedRequests.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Cancellation Requests</h3>
            <p className="text-gray-600">
              Customer cancellation requests will appear here for your review.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Review Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              Review Cancellation Request
            </DialogTitle>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              {/* Request Details */}
              <Card className="bg-gray-50">
                <CardContent className="p-3">
                  <h4 className="font-medium text-sm mb-2">Request Details</h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Order:</span> {selectedRequest.orderQrCode}</p>
                    <p><span className="font-medium">Customer:</span> {selectedRequest.customerName}</p>
                    <p><span className="font-medium">Student ID:</span> {selectedRequest.studentId}</p>
                    <p><span className="font-medium">Total:</span> ₱{selectedRequest.orderTotal.toFixed(2)}</p>
                    <p><span className="font-medium">Reason:</span> {selectedRequest.reasonLabel}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Customer's Explanation */}
              <div>
                <Label className="text-sm font-medium">Customer's Explanation</Label>
                <Card className="mt-1">
                  <CardContent className="p-3">
                    <p className="text-sm text-gray-700">{selectedRequest.description}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Response Reason */}
              <div>
                <Label htmlFor="responseReason">Your Response (Required for decline)</Label>
                <Textarea
                  id="responseReason"
                  value={responseReason}
                  onChange={(e) => setResponseReason(e.target.value)}
                  placeholder="Provide reason for your decision..."
                  rows={3}
                  className="mt-1"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => handleApproveRequest(selectedRequest)}
                  disabled={isProcessing}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {isProcessing ? "Processing..." : "Approve"}
                </Button>
                <Button
                  onClick={() => handleDeclineRequest(selectedRequest)}
                  disabled={isProcessing}
                  variant="destructive"
                  className="flex-1"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  {isProcessing ? "Processing..." : "Decline"}
                </Button>
              </div>
              
              <Button
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  setResponseReason("");
                }}
                className="w-full"
              >
                Cancel
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}