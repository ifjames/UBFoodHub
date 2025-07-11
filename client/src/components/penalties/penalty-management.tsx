import { useState, useEffect } from "react";
import { AlertTriangle, User, Calendar, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore } from "@/lib/store";
import { addDocument, subscribeToQuery, getCollection } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { createNotification, NotificationTemplates } from "@/lib/notifications";

interface Penalty {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  studentId: string;
  type: "warning" | "suspension" | "ban";
  reason: string;
  description: string;
  createdAt: any;
  createdBy: string;
  orderId?: string;
  expiresAt?: any;
  isActive: boolean;
}

interface PenaltyManagementProps {
  targetUserId?: string;
  showUserPenalties?: boolean;
}

export default function PenaltyManagement({ targetUserId, showUserPenalties = false }: PenaltyManagementProps) {
  const { state } = useStore();
  const { toast } = useToast();
  const [penalties, setPenalties] = useState<Penalty[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [penaltyForm, setPenaltyForm] = useState({
    userId: targetUserId || "",
    type: "warning" as "warning" | "suspension" | "ban",
    reason: "",
    description: "",
    orderId: "",
    duration: "7", // days for suspension
  });

  useEffect(() => {
    if (showUserPenalties && targetUserId) {
      // Subscribe to penalties for specific user
      const unsubscribe = subscribeToQuery(
        "penalties",
        "userId",
        "==",
        targetUserId,
        (data) => {
          const sortedPenalties = data.sort((a, b) => {
            const aTime = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
            const bTime = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
            return bTime.getTime() - aTime.getTime();
          });
          setPenalties(sortedPenalties);
        }
      );
      return unsubscribe;
    } else {
      // Load all penalties for admin view
      const unsubscribe = subscribeToQuery(
        "penalties",
        "isActive",
        "==",
        true,
        (data) => {
          const sortedPenalties = data.sort((a, b) => {
            const aTime = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
            const bTime = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
            return bTime.getTime() - aTime.getTime();
          });
          setPenalties(sortedPenalties);
        }
      );
      return unsubscribe;
    }
  }, [targetUserId, showUserPenalties]);

  useEffect(() => {
    if (state.user?.role === "admin") {
      getCollection("users").then((snapshot) => {
        const userData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUsers(userData);
      });
    }
  }, [state.user?.role]);

  const handleAssignPenalty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!penaltyForm.userId || !penaltyForm.reason || !penaltyForm.description) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const selectedUser = users.find(u => u.id === penaltyForm.userId);
      
      const expiresAt = penaltyForm.type === "suspension" 
        ? new Date(Date.now() + parseInt(penaltyForm.duration) * 24 * 60 * 60 * 1000)
        : null;

      const penaltyData = {
        userId: penaltyForm.userId,
        userName: selectedUser?.fullName || "Unknown User",
        userEmail: selectedUser?.email || "Unknown Email",
        studentId: selectedUser?.studentId || "Unknown ID",
        type: penaltyForm.type,
        reason: penaltyForm.reason,
        description: penaltyForm.description,
        createdAt: new Date(),
        createdBy: state.user?.id,
        orderId: penaltyForm.orderId || null,
        expiresAt,
        isActive: true,
      };

      await addDocument("penalties", penaltyData);

      // Send notification to user
      await createNotification(
        NotificationTemplates.penaltyAssigned(
          penaltyForm.userId,
          penaltyForm.reason,
          penaltyForm.type
        )
      );

      toast({
        title: "Penalty Assigned",
        description: `${penaltyForm.type.charAt(0).toUpperCase() + penaltyForm.type.slice(1)} penalty has been assigned to the user.`,
      });

      // Reset form
      setPenaltyForm({
        userId: targetUserId || "",
        type: "warning",
        reason: "",
        description: "",
        orderId: "",
        duration: "7",
      });
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to assign penalty. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getPenaltyBadgeColor = (type: string) => {
    switch (type) {
      case "warning":
        return "bg-yellow-100 text-yellow-800";
      case "suspension":
        return "bg-orange-100 text-orange-800";
      case "ban":
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          {showUserPenalties ? "User Penalties" : "Penalty Management"}
        </h3>
        
        {state.user?.role === "admin" && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#6d031e] hover:bg-red-700">
                Assign Penalty
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Assign Penalty</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAssignPenalty} className="space-y-4">
                {!targetUserId && (
                  <div>
                    <Label htmlFor="userId">Select User</Label>
                    <Select value={penaltyForm.userId} onValueChange={(value) => setPenaltyForm(prev => ({ ...prev, userId: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a user" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.filter(u => u.role !== "admin").map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.fullName} - {user.studentId} ({user.role})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label htmlFor="type">Penalty Type</Label>
                  <Select value={penaltyForm.type} onValueChange={(value: any) => setPenaltyForm(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="suspension">Suspension</SelectItem>
                      <SelectItem value="ban">Permanent Ban</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {penaltyForm.type === "suspension" && (
                  <div>
                    <Label htmlFor="duration">Suspension Duration (days)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={penaltyForm.duration}
                      onChange={(e) => setPenaltyForm(prev => ({ ...prev, duration: e.target.value }))}
                      min="1"
                      max="365"
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="reason">Reason</Label>
                  <Input
                    id="reason"
                    value={penaltyForm.reason}
                    onChange={(e) => setPenaltyForm(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder="e.g., Fake order, Multiple cancellations"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Detailed Description</Label>
                  <Textarea
                    id="description"
                    value={penaltyForm.description}
                    onChange={(e) => setPenaltyForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Provide detailed explanation of the violation..."
                    rows={3}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="orderId">Related Order ID (Optional)</Label>
                  <Input
                    id="orderId"
                    value={penaltyForm.orderId}
                    onChange={(e) => setPenaltyForm(prev => ({ ...prev, orderId: e.target.value }))}
                    placeholder="UBF-2025-123456"
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={isLoading} className="flex-1 bg-[#6d031e] hover:bg-red-700">
                    {isLoading ? "Assigning..." : "Assign Penalty"}
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
            </DialogContent>
          </Dialog>
        )}
      </div>

      {penalties.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Penalties</h3>
            <p className="text-gray-600">
              {showUserPenalties 
                ? "This user has no penalties on record."
                : "No active penalties in the system."
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {penalties.map((penalty) => (
            <Card key={penalty.id} className="border-l-4 border-l-red-500">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getPenaltyBadgeColor(penalty.type)}>
                        {penalty.type.toUpperCase()}
                      </Badge>
                      {penalty.expiresAt && (
                        <Badge variant="outline" className="text-orange-600">
                          Expires: {formatDate(penalty.expiresAt)}
                        </Badge>
                      )}
                    </div>
                    
                    <h4 className="font-semibold text-gray-900 mb-1">{penalty.reason}</h4>
                    <p className="text-sm text-gray-600 mb-2">{penalty.description}</p>
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {penalty.userName} ({penalty.studentId})
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(penalty.createdAt)}
                      </span>
                      {penalty.orderId && (
                        <span className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          Order: {penalty.orderId}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}