import { ReactNode, useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { useLocation } from "wouter";
import ProfileCompletionModal from "./profile-completion-modal";
import NotificationService from "@/lib/notification-service";

interface AuthGuardProps {
  children: ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { state } = useStore();
  const [, setLocation] = useLocation();
  const [showProfileCompletion, setShowProfileCompletion] = useState(false);

  useEffect(() => {
    if (!state.user) {
      setLocation("/login");
      return;
    }

    // Check email verification for students - block access if not verified
    if (state.user.role === "student" && !state.user.emailVerified) {
      // Clear user state and redirect to login immediately
      setLocation("/login");
      return;
    }

    // Check if user needs to complete their profile (missing student ID or phone number)
    // Only show profile completion modal for students, not admins or stall owners
    const needsProfileCompletion = state.user && 
      state.user.role === "student" && (
        !state.user.studentId || 
        !state.user.phoneNumber ||
        state.user.studentId.trim() === "" ||
        state.user.phoneNumber.trim() === ""
      );

    if (needsProfileCompletion) {
      setShowProfileCompletion(true);
    }

    // Send notification for email verification (for non-students or as reminder)
    if (state.user && !state.user.emailVerified && state.user.role !== "student") {
      const notificationService = NotificationService.getInstance();
      if (notificationService.isPermissionGranted()) {
        notificationService.sendVerificationNotification();
      }
    }
  }, [state.user, setLocation]);

  if (!state.user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-maroon-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="text-maroon-600 text-xl font-bold">UB</div>
          </div>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {children}
      <ProfileCompletionModal
        isOpen={showProfileCompletion}
        onComplete={() => setShowProfileCompletion(false)}
      />
    </>
  );
}
