import { useState } from "react";
import { ArrowLeft, Settings, Ticket, Medal, HelpCircle, FileText, LogOut, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation } from "wouter";
import { useStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { logOut } from "@/lib/firebase";
import BottomNav from "@/components/layout/bottom-nav";

export default function Profile() {
  const [, setLocation] = useLocation();
  const { state, dispatch } = useStore();
  const { toast } = useToast();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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

  const menuItems = [
    { 
      icon: Ticket, 
      title: "Vouchers", 
      subtitle: "Coming Soon",
      bgColor: "bg-gray-50",
      iconColor: "text-gray-400",
      locked: true
    },
    { 
      icon: Medal, 
      title: "UB Rewards", 
      subtitle: "Coming Soon",
      bgColor: "bg-gray-50",
      iconColor: "text-gray-400",
      locked: true
    },
  ];

  const generalItems = [
    { 
      icon: HelpCircle, 
      title: "Help center", 
      subtitle: "FAQs and support",
      action: () => setLocation("/help-center")
    },
    { 
      icon: FileText, 
      title: "Terms & policies", 
      subtitle: "Legal information",
      action: () => setLocation("/terms-policies")
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="text-white p-4 bg-[#820d2a]">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => setLocation("/")}
              className="mr-4 p-2 hover:bg-red-700 rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-semibold">Account</h1>
          </div>
          <button 
            onClick={() => setLocation("/settings")}
            className="text-red-200 hover:text-white"
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>
      </header>
      <div className="p-4 space-y-6 pb-20">
        {/* Profile Header */}
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <span className="text-[#6d031e] text-xl font-semibold">
              {state.user?.fullName?.charAt(0) || "U"}
            </span>
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
          <div className="space-y-3">
            {menuItems.map((item, index) => (
              <Card key={index} className={`${item.locked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-md'} transition-shadow`}>
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
          <div className="space-y-3">
            {generalItems.map((item, index) => (
              <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow" onClick={item.action}>
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
                    <ArrowLeft className="h-4 w-4 text-gray-400 rotate-180" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Order History */}
        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setLocation("/orders")}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-red-50">
                  <FileText className="h-5 w-5 text-[#6d031e]" />
                </div>
                <div>
                  <p className="font-medium text-gray-800">Order History</p>
                  <p className="text-sm text-gray-600">View all your past orders</p>
                </div>
              </div>
              <ArrowLeft className="h-4 w-4 text-gray-400 rotate-180" />
            </div>
          </CardContent>
        </Card>

        {/* Logout Button */}
        <Button
          onClick={handleLogout}
          variant="outline"
          className="w-full text-red-600 border-red-200 hover:bg-red-50"
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
