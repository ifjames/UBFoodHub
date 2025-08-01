import { Home, ShoppingCart, User, Package, Bell, LogOut } from "lucide-react";
import { useLocation } from "wouter";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { logOut } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import NotificationBell from "@/components/notifications/notification-bell";

export default function DesktopNav() {
  const [location, setLocation] = useLocation();
  const { state, dispatch } = useStore();
  const { toast } = useToast();

  const navItems = [
    {
      icon: Home,
      label: "Home",
      path: "/",
      active: location === "/"
    },
    {
      icon: ShoppingCart,
      label: "Cart",
      path: "/cart",
      active: location === "/cart"
    },
    {
      icon: Package,
      label: "Orders",
      path: "/orders",
      active: location === "/orders"
    },
    {
      icon: User,
      label: "Profile",
      path: "/profile",
      active: location === "/profile"
    }
  ];

  const handleLogout = async () => {
    try {
      await logOut();
      dispatch({ type: "SET_USER", payload: null });
      setLocation("/login");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to logout. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Show different navigation for different roles
  if (state.user?.role === 'admin') {
    return (
      <div className="hidden md:flex fixed top-0 left-0 right-0 bg-[#6d031e] text-white z-50 shadow-lg">
        <div className="max-w-7xl mx-auto w-full px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="UB FoodHub" className="w-8 h-8" />
              <span className="text-xl font-bold">UB FoodHub Admin</span>
            </div>
            <Button
              onClick={() => setLocation("/admin")}
              variant="ghost"
              className={`text-white hover:bg-red-700 ${location === "/admin" ? "bg-red-700" : ""}`}
            >
              Dashboard
            </Button>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm">Welcome, {state.user?.fullName}</span>
            <NotificationBell />
            <Button onClick={handleLogout} variant="ghost" className="text-white hover:bg-red-700">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (state.user?.role === 'stall_owner') {
    return (
      <div className="hidden md:flex fixed top-0 left-0 right-0 bg-[#6d031e] text-white z-50 shadow-lg">
        <div className="max-w-7xl mx-auto w-full px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="UB FoodHub" className="w-8 h-8" />
              <span className="text-xl font-bold">UB FoodHub Stall</span>
            </div>
            <Button
              onClick={() => setLocation("/stall-dashboard")}
              variant="ghost"
              className={`text-white hover:bg-red-700 ${location === "/stall-dashboard" ? "bg-red-700" : ""}`}
            >
              Dashboard
            </Button>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm">Welcome, {state.user?.fullName}</span>
            <NotificationBell />
            <Button onClick={handleLogout} variant="ghost" className="text-white hover:bg-red-700">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Student navigation
  return (
    <div className="hidden md:flex fixed top-0 left-0 right-0 bg-[#6d031e] text-white z-50 shadow-lg">
      <div className="max-w-7xl mx-auto w-full px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="UB FoodHub" className="w-8 h-8" />
            <span className="text-xl font-bold">UB FoodHub</span>
          </div>
          <nav className="flex items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.path}
                  onClick={() => setLocation(item.path)}
                  variant="ghost"
                  className={`text-white hover:bg-red-700 flex items-center gap-2 ${
                    item.active ? "bg-red-700" : ""
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Button>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-red-700 px-3 py-1 rounded-full">
            <span className="text-xs">Points: {state.user?.loyaltyPoints || 0}</span>
          </div>
          <span className="text-sm">Hi, {state.user?.fullName?.split(" ")[0]}</span>
          <NotificationBell />
          <Button onClick={handleLogout} variant="ghost" className="text-white hover:bg-red-700">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
}