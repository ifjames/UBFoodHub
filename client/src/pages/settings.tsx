import { useState, useEffect } from "react";
import { ArrowLeft, Camera, Eye, EyeOff, Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useLocation } from "wouter";
import { useStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { createNotification } from "@/lib/notifications";
import BottomNav from "@/components/layout/bottom-nav";

export default function Settings() {
  const [, setLocation] = useLocation();
  const { state } = useStore();
  const { toast } = useToast();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default");

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const notificationService = NotificationService.getInstance();

  useEffect(() => {
    // Check notification permission status on component mount
    setNotificationPermission(notificationService.getPermissionStatus());
    setNotificationsEnabled(notificationService.isPermissionGranted());
  }, []);

  const handleNotificationToggle = async (enabled: boolean) => {
    if (enabled) {
      const granted = await notificationService.requestPermission();
      setNotificationsEnabled(granted);
      setNotificationPermission(notificationService.getPermissionStatus());
      
      if (granted) {
        toast({
          title: "Notifications enabled",
          description: "You'll now receive push notifications for order updates and important information.",
        });
      } else {
        toast({
          title: "Permission denied",
          description: "Please enable notifications in your browser settings to receive updates.",
          variant: "destructive",
        });
      }
    } else {
      setNotificationsEnabled(false);
      toast({
        title: "Notifications disabled",
        description: "You won't receive push notifications. You can re-enable them anytime.",
      });
    }
  };

  const handlePasswordUpdate = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "New password and confirm password do not match.",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      // TODO: Implement password update with Firebase
      toast({
        title: "Coming Soon",
        description: "Password update functionality will be available soon.",
      });
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Failed to update password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleProfilePictureUpdate = () => {
    toast({
      title: "Coming Soon",
      description: "Profile picture update will be available soon.",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="text-white p-4 bg-[#820d2a]">
        <div className="flex items-center">
          <button
            onClick={() => setLocation("/profile")}
            className="mr-4 p-2 hover:bg-red-700 rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold">Settings</h1>
        </div>
      </header>

      <div className="p-4 space-y-6 pb-20">
        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Notification Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-blue-50">
                  {notificationsEnabled ? (
                    <Bell className="h-5 w-5 text-blue-600" />
                  ) : (
                    <BellOff className="h-5 w-5 text-gray-600" />
                  )}
                </div>
                <div>
                  <h3 className="font-medium text-gray-800">Push Notifications</h3>
                  <p className="text-sm text-gray-600">
                    Get notified about order updates and important information
                  </p>
                </div>
              </div>
              <Switch
                checked={notificationsEnabled}
                onCheckedChange={handleNotificationToggle}
              />
            </div>
            
            {notificationPermission === "denied" && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">
                  Notifications are blocked in your browser. Please enable them in your browser settings to receive updates.
                </p>
              </div>
            )}
            
            {notificationPermission === "default" && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-700">
                  Enable notifications to stay updated on your orders and receive important announcements.
                </p>
              </div>
            )}
            
            {notificationsEnabled && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700">
                  ✓ Notifications are enabled. You'll receive updates about your orders and important information.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Profile Picture Section */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Picture</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center relative">
                <span className="text-[#6d031e] text-2xl font-semibold">
                  {state.user?.fullName?.charAt(0) || "U"}
                </span>
                <button
                  onClick={handleProfilePictureUpdate}
                  className="absolute -bottom-1 -right-1 w-8 h-8 bg-[#6d031e] text-white rounded-full flex items-center justify-center hover:bg-red-700 transition-colors"
                >
                  <Camera className="h-4 w-4" />
                </button>
              </div>
              <div>
                <h3 className="font-medium text-gray-800">
                  {state.user?.fullName || "Student Name"}
                </h3>
                <p className="text-sm text-gray-600">Tap the camera icon to update</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Password Change Section */}
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, currentPassword: e.target.value })
                  }
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, newPassword: e.target.value })
                  }
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                  }
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              onClick={handlePasswordUpdate}
              disabled={
                !passwordData.currentPassword ||
                !passwordData.newPassword ||
                !passwordData.confirmPassword ||
                isUpdatingPassword
              }
              className="w-full bg-[#6d031e] hover:bg-red-700"
            >
              {isUpdatingPassword ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Updating...
                </>
              ) : (
                "Update Password"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Full Name</Label>
              <p className="text-sm text-gray-600 mt-1">{state.user?.fullName || "Not available"}</p>
            </div>
            <div>
              <Label>Email</Label>
              <p className="text-sm text-gray-600 mt-1">{state.user?.email || "Not available"}</p>
            </div>
            <div>
              <Label>Student ID</Label>
              <p className="text-sm text-gray-600 mt-1">{state.user?.studentId || "Not available"}</p>
            </div>
            <div>
              <Label>Role</Label>
              <p className="text-sm text-gray-600 mt-1 capitalize">{state.user?.role || "Student"}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <BottomNav />
    </div>
  );
}