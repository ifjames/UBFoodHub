import { useState } from "react";
import { ArrowLeft, Settings, Ticket, Medal, HelpCircle, FileText, LogOut, Lock, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation } from "wouter";
import { useStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { logOut, getUserLoyaltyTier } from "@/lib/firebase";
import BottomNav from "@/components/layout/bottom-nav";
import LoyaltyDashboard from "@/components/loyalty/loyalty-dashboard";
import StudentVoucherDashboard from "@/components/vouchers/student-voucher-dashboard";
import { usePageTitle } from "@/hooks/use-page-title";

export default function Profile() {
  usePageTitle("Profile");
  const [, setLocation] = useLocation();
  const { state, dispatch } = useStore();
  const { toast } = useToast();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLoyalty, setShowLoyalty] = useState(false);
  const [showVouchers, setShowVouchers] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logOut();
      dispatch({ type: "SET_USER", payload: null });
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account.",
      });
      setLocation("/login");
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "There was an error logging you out. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  const userPoints = state.user?.loyaltyPoints || 0;
  const loyaltyTier = getUserLoyaltyTier(userPoints);

  // Check if user is admin or stall owner
  const isAdminOrStallOwner = state.user?.role === 'admin' || state.user?.role === 'stall_owner';

  const menuItems = [
    { 
      icon: Award, 
      title: "Loyalty Points", 
      subtitle: isAdminOrStallOwner ? "Admin/Staff access restricted" : `${userPoints} points • ${loyaltyTier.tier} member`,
      bgColor: "bg-maroon-50",
      iconColor: "text-maroon-600",
      locked: isAdminOrStallOwner,
      action: () => setShowLoyalty(true)
    },
    { 
      icon: Ticket, 
      title: "Vouchers", 
      subtitle: isAdminOrStallOwner ? "Admin/Staff access restricted" : "Discount coupons & offers",
      bgColor: "bg-green-50",
      iconColor: "text-green-600",
      locked: isAdminOrStallOwner,
      action: () => setShowVouchers(true)
    },
  ];

  const generalItems = [
    { 
      icon: Settings, 
      title: "Settings", 
      subtitle: isAdminOrStallOwner ? "Admin/Staff access restricted" : "Account preferences",
      locked: isAdminOrStallOwner,
      action: () => setLocation("/settings")
    },
    { 
      icon: HelpCircle, 
      title: "Help center", 
      subtitle: isAdminOrStallOwner ? "Admin/Staff access restricted" : "FAQs and support",
      locked: isAdminOrStallOwner,
      action: () => setLocation("/help-center")
    },
    { 
      icon: FileText, 
      title: "Terms & policies", 
      subtitle: "Legal information",
      locked: false,
      action: () => setLocation("/terms-policies")
    },
  ];

  if (showLoyalty) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="text-white p-4 bg-[#820d2a]">
          <div className="flex items-center gap-3 max-w-4xl mx-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowLoyalty(false)}
              className="text-white hover:bg-red-700 -ml-2"
              data-testid="button-back-loyalty"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-semibold">Loyalty Points</h1>
          </div>
        </header>

        <div className="p-4 pb-20 md:pb-8 max-w-4xl mx-auto">
          <LoyaltyDashboard />
        </div>

        <BottomNav />
      </div>
    );
  }

  if (showVouchers && !isAdminOrStallOwner) {
    return <StudentVoucherDashboard onBack={() => setShowVouchers(false)} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="text-white p-4 bg-[#820d2a]">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center">
            <button
              onClick={() => setLocation("/")}
              className="mr-4 p-2 hover:bg-red-700 rounded-full transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-semibold">Account</h1>
          </div>
          {/* Settings button - mobile only */}
          {!isAdminOrStallOwner && (
            <button 
              onClick={() => setLocation("/settings")}
              className="text-red-200 hover:text-white p-2 hover:bg-red-700 rounded-full transition-colors md:hidden"
              data-testid="button-settings-mobile"
            >
              <Settings className="h-5 w-5" />
            </button>
          )}
        </div>
      </header>
      <div className="p-4 space-y-6 pb-20 md:pb-8 max-w-4xl mx-auto">
        {/* Profile Header */}
        <div className="flex items-center space-x-4 bg-white rounded-lg p-6 shadow-sm">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center overflow-hidden">
            {state.user?.photoURL ? (
              <img 
                src={state.user.photoURL} 
                alt={state.user.fullName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-[#6d031e] text-xl font-semibold">
                {state.user?.fullName?.charAt(0) || "U"}
              </span>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">
              {state.user?.fullName || "Student Name"}
            </h3>
            <p className="text-sm text-gray-600">{state.user?.email || "student@ub.edu.ph"}</p>
            <p className="text-sm text-gray-600">
              {state.user?.studentId || "UB-2024-001234"}
            </p>
          </div>
        </div>

        {/* Perks Section */}
        <div>
          <h4 className="font-medium text-gray-800 mb-3">Perks for you</h4>
          <div className="space-y-3 md:grid md:grid-cols-2 md:gap-3 md:space-y-0">
            {menuItems.map((item, index) => (
              <Card 
                key={index} 
                className={`${item.locked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-md'} transition-shadow`}
                onClick={item.locked ? undefined : item.action}
              >
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${item.bgColor}`}>
                        <item.icon className={`h-5 w-5 ${item.iconColor}`} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{item.title}</p>
                        <p className="text-sm text-gray-600">{item.subtitle}</p>
                      </div>
                    </div>
                    {item.locked ? (
                      <Lock className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ArrowLeft className="h-4 w-4 text-gray-400 rotate-180" />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* General Section */}
        <div>
          <h4 className="font-medium text-gray-800 mb-3">General</h4>
          <div className="space-y-3 md:grid md:grid-cols-2 md:gap-3 md:space-y-0">
            {generalItems.map((item, index) => (
              <Card 
                key={index} 
                className={`${item.locked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-md'} transition-shadow ${item.title === 'Settings' ? 'hidden md:block' : ''}`}
                onClick={item.locked ? undefined : item.action}
                data-testid={`card-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-gray-50">
                        <item.icon className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{item.title}</p>
                        <p className="text-sm text-gray-600">{item.subtitle}</p>
                      </div>
                    </div>
                    {item.locked ? (
                      <Lock className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ArrowLeft className="h-4 w-4 text-gray-400 rotate-180" />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>


        {/* Logout Button */}
        <Button
          onClick={handleLogout}
          variant="outline"
          className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
          disabled={isLoggingOut}
        >
          {isLoggingOut ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
              Logging out...
            </>
          ) : (
            <>
              <LogOut className="h-4 w-4 mr-2" />
              Log out
            </>
          )}
        </Button>

        {/* Version */}
        <p className="text-center text-xs text-gray-500">Version 1.0.0 (2024001)</p>
      </div>
      <BottomNav />
    </div>
  );
}
