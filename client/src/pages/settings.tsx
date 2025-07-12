import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Camera, Eye, EyeOff, Bell, BellOff, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useLocation } from "wouter";
import { useStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { createNotification } from "@/lib/notifications";
import NotificationService from "@/lib/notification-service";
import BottomNav from "@/components/layout/bottom-nav";
import { updatePassword, updateProfile, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { auth, updateDocument } from "@/lib/firebase";

export default function Settings() {
  const [, setLocation] = useLocation();
  const { state } = useStore();
  const { toast } = useToast();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const notificationService = NotificationService.getInstance();

  useEffect(() => {
    // Check notification permission status on component mount
    const currentPermission = notificationService.getPermissionStatus();
    const isGranted = notificationService.isPermissionGranted();
    
    setNotificationPermission(currentPermission);
    setNotificationsEnabled(isGranted);
    
    // Listen for permission changes
    const checkPermission = () => {
      const newPermission = notificationService.getPermissionStatus();
      const newGranted = notificationService.isPermissionGranted();
      
      if (newPermission !== notificationPermission) {
        setNotificationPermission(newPermission);
        setNotificationsEnabled(newGranted);
      }
    };
    
    // Check permission every few seconds to detect manual browser changes
    const interval = setInterval(checkPermission, 3000);
    
    return () => clearInterval(interval);
  }, [notificationPermission]);

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
    if (!passwordData.currentPassword.trim()) {
      toast({
        title: "Current password required",
        description: "Please enter your current password.",
        variant: "destructive",
      });
      return;
    }

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
      // Wait a moment to ensure auth state is stable
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const user = auth.currentUser;
      console.log("Current user:", user ? "Found" : "Not found");
      console.log("User email:", user?.email);
      console.log("User providers:", user?.providerData?.map(p => p.providerId));
      
      if (!user) {
        throw new Error("No authenticated user found. Please refresh the page and try again.");
      }

      if (!user.email) {
        throw new Error("User email not found");
      }

      // Check if user signed in with Google (password change not allowed)
      const isGoogleUser = user.providerData.some(
        provider => provider.providerId === 'google.com'
      );

      if (isGoogleUser) {
        toast({
          title: "Password change not available",
          description: "You signed in with Google. Password changes are managed through your Google account.",
          variant: "destructive",
        });
        return;
      }

      console.log("Attempting password change for user:", user.email);

      // Re-authenticate user with current password
      const credential = EmailAuthProvider.credential(user.email, passwordData.currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, passwordData.newPassword);

      // Send notification when password changes
      try {
        const notificationService = NotificationService.getInstance();
        if (notificationService.isPermissionGranted()) {
          await notificationService.sendPasswordChangeNotification();
        }
      } catch (notificationError) {
        console.log("Notification sending failed:", notificationError);
        // Don't fail the password update for notification errors
      }

      // Clear form
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      toast({
        title: "Password updated",
        description: "Your password has been successfully changed.",
      });
    } catch (error: any) {
      console.error("Password update error:", error);
      let errorMessage = "Failed to update password. Please try again.";
      
      if (error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
        errorMessage = "Current password is incorrect. Please check and try again.";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "New password is too weak. Use at least 6 characters with numbers and symbols.";
      } else if (error.code === "auth/requires-recent-login") {
        errorMessage = "For security, please log out and log back in, then try again.";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Too many failed attempts. Please wait a few minutes and try again.";
      } else if (error.code === "auth/user-disabled") {
        errorMessage = "Your account has been disabled. Please contact support.";
      } else if (error.code === "auth/operation-not-allowed") {
        errorMessage = "Password changes are not allowed for this account type.";
      } else if (error.message) {
        errorMessage = `Update failed: ${error.message}`;
      }

      toast({
        title: "Update failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleProfilePictureUpdate = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 10MB for Cloudinary)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 10MB.",
        variant: "destructive",
      });
      return;
    }

    setIsUpdatingProfile(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error("No authenticated user found");
      }

      // Upload to Cloudinary using signed upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', import.meta.env.VITE_CLOUDINARY_API_KEY || '914293414295782');
      formData.append('timestamp', Math.floor(Date.now() / 1000).toString());
      formData.append('folder', `ub-foodhub/profile-pictures/${user.uid}`);
      
      // For now, use unsigned upload (we'll need to create an upload preset)
      // Instead, let's use a simple approach with base64 encoding

      // Convert file to base64 and store it temporarily
      // For now, let's use a simple data URL approach
      const reader = new FileReader();
      const photoURL = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Update Firebase Auth profile
      await updateProfile(user, {
        photoURL: photoURL
      });

      // Update user document in Firestore (optional - skip if it fails)
      try {
        await updateDocument("users", user.uid, {
          photoURL: photoURL,
          updatedAt: new Date()
        });
      } catch (firestoreError) {
        console.log("Firestore update skipped:", firestoreError);
        // Continue anyway as the auth profile was updated
      }

      // Update local state
      dispatch({
        type: "SET_USER",
        payload: {
          ...state.user!,
          photoURL: photoURL
        }
      });

      toast({
        title: "Profile picture updated",
        description: "Your profile picture has been successfully changed.",
      });
    } catch (error) {
      console.error("Error updating profile picture:", error);
      toast({
        title: "Update failed",
        description: "Failed to update profile picture. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const syncGoogleProfilePicture = async () => {
    setIsUpdatingProfile(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error("No authenticated user found");
      }

      // Check if user has a Google photo URL from their current photoURL or provider data
      let googlePhotoURL = null;
      
      // First check if current photoURL is from Google
      if (user.photoURL && user.photoURL.includes('googleusercontent.com')) {
        googlePhotoURL = user.photoURL;
      } else {
        // Check provider data for Google photo
        const googleProvider = user.providerData.find(
          provider => provider.providerId === 'google.com'
        );
        googlePhotoURL = googleProvider?.photoURL;
      }

      if (!googlePhotoURL) {
        toast({
          title: "No Google photo found",
          description: "This account doesn't have a Google profile picture to sync. Try uploading a custom image instead.",
          variant: "destructive",
        });
        return;
      }

      // Update Firebase Auth profile
      await updateProfile(user, {
        photoURL: googlePhotoURL
      });

      // Update user document in Firestore
      try {
        await updateDocument("users", user.uid, {
          photoURL: googlePhotoURL,
          updatedAt: new Date()
        });
      } catch (firestoreError) {
        console.log("Firestore update skipped:", firestoreError);
        // Continue anyway as the auth profile was updated
      }

      // Update local state
      dispatch({
        type: "SET_USER",
        payload: {
          ...state.user!,
          photoURL: googlePhotoURL
        }
      });

      toast({
        title: "Profile picture synced",
        description: "Your Google profile picture has been synced successfully.",
      });
    } catch (error) {
      console.error("Error syncing Google profile picture:", error);
      toast({
        title: "Sync failed",
        description: "Failed to sync Google profile picture. Make sure you signed in with Google.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingProfile(false);
    }
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
                  Notifications are blocked in your browser. To enable them:
                </p>
                <ul className="text-sm text-red-700 mt-2 list-disc list-inside">
                  <li>Click the lock icon in your address bar</li>
                  <li>Set "Notifications" to "Allow"</li>
                  <li>Refresh this page</li>
                </ul>
              </div>
            )}
            
            {notificationPermission === "default" && !notificationsEnabled && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  Turn on notifications to receive updates about your orders, penalties, and important announcements.
                </p>
              </div>
            )}
            
            {notificationPermission === "granted" && notificationsEnabled && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700">
                  ✓ You'll receive notifications for: Order updates, Penalties, Email verification reminders, Admin announcements, and Security changes.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 text-green-700 border-green-300 hover:bg-green-100"
                  onClick={() => {
                    notificationService.sendAnnouncementNotification(
                      "Test Notification", 
                      "This is a test to make sure your notifications are working!"
                    );
                  }}
                >
                  Send Test Notification
                </Button>
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
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center relative overflow-hidden">
                {state.user?.photoURL ? (
                  <img 
                    src={state.user.photoURL} 
                    alt={state.user.fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-[#6d031e] text-2xl font-semibold">
                    {state.user?.fullName?.charAt(0) || "U"}
                  </span>
                )}
                <button
                  onClick={handleProfilePictureUpdate}
                  disabled={isUpdatingProfile}
                  className="absolute bottom-0 right-0 w-7 h-7 bg-[#6d031e] text-white rounded-full flex items-center justify-center hover:bg-red-700 transition-colors disabled:opacity-50 border-2 border-white shadow-sm"
                >
                  {isUpdatingProfile ? (
                    <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent"></div>
                  ) : (
                    <Camera className="h-3 w-3" />
                  )}
                </button>
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-800">
                  {state.user?.fullName || "Student Name"}
                </h3>
                <p className="text-sm text-gray-600">Tap the camera icon to update</p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={syncGoogleProfilePicture}
                  disabled={isUpdatingProfile}
                  className="mt-2 text-blue-600 border-blue-200 hover:bg-blue-50"
                >
                  {isUpdatingProfile ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-2"></div>
                      Syncing...
                    </>
                  ) : (
                    <>
                      <Camera className="h-3 w-3 mr-2" />
                      Sync Google Photo
                    </>
                  )}
                </Button>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
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