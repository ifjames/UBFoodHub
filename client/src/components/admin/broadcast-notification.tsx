import { useState, useEffect } from "react";
import { Send, Users, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore } from "@/lib/store";
import { getCollection } from "@/lib/firebase";
import { sendBroadcastNotification } from "@/lib/notifications";
import { useToast } from "@/hooks/use-toast";

export default function BroadcastNotification() {
  const { state } = useStore();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [notificationForm, setNotificationForm] = useState({
    title: "",
    message: "",
    targetRole: "all", // all, student, stall_owner
  });

  useEffect(() => {
    if (state.user?.role === "admin") {
      getCollection("users").then((snapshot) => {
        const userData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })).filter(user => user.role !== "admin"); // Don't include other admins
        setUsers(userData);
      });
    }
  }, [state.user?.role]);

  const handleRoleSelect = (role: string) => {
    setNotificationForm(prev => ({ ...prev, targetRole: role }));
    
    if (role === "all") {
      setSelectedUsers(users.map(u => u.id));
    } else {
      setSelectedUsers(users.filter(u => u.role === role).map(u => u.id));
    }
  };

  const handleUserToggle = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!notificationForm.title || !notificationForm.message) {
      toast({
        title: "Missing Information",
        description: "Please provide both title and message.",
        variant: "destructive",
      });
      return;
    }

    if (selectedUsers.length === 0) {
      toast({
        title: "No Recipients",
        description: "Please select at least one user to receive the notification.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    try {
      const success = await sendBroadcastNotification(
        selectedUsers,
        notificationForm.title,
        notificationForm.message,
        state.user?.id || ""
      );

      if (success) {
        toast({
          title: "Notification Sent",
          description: `Successfully sent notification to ${selectedUsers.length} user${selectedUsers.length > 1 ? 's' : ''}.`,
        });

        // Reset form
        setNotificationForm({
          title: "",
          message: "",
          targetRole: "all",
        });
        setSelectedUsers([]);
        setIsDialogOpen(false);
      } else {
        throw new Error("Failed to send notification");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send notification. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const getSelectedUsersByRole = () => {
    const students = selectedUsers.filter(id => 
      users.find(u => u.id === id)?.role === "student"
    ).length;
    const stallOwners = selectedUsers.filter(id => 
      users.find(u => u.id === id)?.role === "stall_owner"
    ).length;
    
    return { students, stallOwners };
  };

  if (state.user?.role !== "admin") {
    return null;
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#6d031e] hover:bg-red-700">
          <Send className="w-4 h-4 mr-2" />
          Send Notification
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" aria-describedby="broadcast-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#6d031e]" />
            Broadcast Notification
          </DialogTitle>
          <p id="broadcast-description" className="text-sm text-gray-600">
            Send notifications to selected users or groups
          </p>
        </DialogHeader>

        <form onSubmit={handleSendNotification} className="space-y-4">
          <div>
            <Label htmlFor="title">Notification Title</Label>
            <Input
              id="title"
              value={notificationForm.title}
              onChange={(e) => setNotificationForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., System Maintenance, New Feature Available"
              required
            />
          </div>

          <div>
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={notificationForm.message}
              onChange={(e) => setNotificationForm(prev => ({ ...prev, message: e.target.value }))}
              placeholder="Enter your notification message here..."
              rows={4}
              required
            />
          </div>

          <div>
            <Label htmlFor="targetRole">Target Audience</Label>
            <Select value={notificationForm.targetRole} onValueChange={handleRoleSelect}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="student">Students Only</SelectItem>
                <SelectItem value="stall_owner">Stall Owners Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* User Selection */}
          <div className="space-y-2">
            <Label>Recipients ({selectedUsers.length} selected)</Label>
            <Card className="max-h-40 overflow-y-auto">
              <CardContent className="p-3">
                <div className="space-y-2">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={user.id}
                        checked={selectedUsers.includes(user.id)}
                        onCheckedChange={() => handleUserToggle(user.id)}
                      />
                      <label htmlFor={user.id} className="text-sm flex-1 cursor-pointer">
                        <span className="font-medium">{user.fullName}</span>
                        <span className="text-gray-500 ml-2">
                          ({user.role === "stall_owner" ? "Stall Owner" : "Student"})
                        </span>
                      </label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Selection Summary */}
          {selectedUsers.length > 0 && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-blue-800">
                    Will notify: {selectedUsers.length} user{selectedUsers.length > 1 ? 's' : ''}
                  </span>
                </div>
                {(() => {
                  const { students, stallOwners } = getSelectedUsersByRole();
                  return (
                    <div className="text-xs text-blue-700 mt-1">
                      {students > 0 && <span>{students} student{students > 1 ? 's' : ''}</span>}
                      {students > 0 && stallOwners > 0 && <span>, </span>}
                      {stallOwners > 0 && <span>{stallOwners} stall owner{stallOwners > 1 ? 's' : ''}</span>}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={isSending || selectedUsers.length === 0}
              className="flex-1 bg-[#6d031e] hover:bg-red-700"
            >
              {isSending ? "Sending..." : `Send to ${selectedUsers.length} User${selectedUsers.length !== 1 ? 's' : ''}`}
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
  );
}