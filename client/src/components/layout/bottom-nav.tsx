import { Home, ShoppingCart, User, Package, Settings, BarChart3, Users } from "lucide-react";
import { useLocation } from "wouter";
import { useStore } from "@/lib/store";
import { motion } from "framer-motion";
import Dock, { type DockItemData } from "@/components/ui/dock";
import "@/components/ui/dock.css";

export default function BottomNav() {
  const [location, setLocation] = useLocation();
  const { state } = useStore();

  // Role-specific navigation items
  const getNavItems = () => {
    if (state.user?.role === 'admin') {
      return [
        {
          icon: BarChart3,
          label: "Dashboard",
          path: "/admin",
          active: location === "/admin",
          key: "admin-dashboard"
        },
        {
          icon: Settings,
          label: "Settings",
          path: "/settings",
          active: location === "/settings",
          key: "admin-settings"
        },
        {
          icon: User,
          label: "Profile",
          path: "/profile",
          active: location === "/profile",
          key: "admin-profile"
        }
      ];
    }

    if (state.user?.role === 'stall_owner') {
      return [
        {
          icon: BarChart3,
          label: "Dashboard",
          path: "/stall-dashboard",
          active: location === "/stall-dashboard",
          key: "stall-dashboard"
        },
        {
          icon: Settings,
          label: "Settings",
          path: "/settings",
          active: location === "/settings",
          key: "stall-settings"
        },
        {
          icon: User,
          label: "Profile",
          path: "/profile",
          active: location === "/profile",
          key: "stall-profile"
        }
      ];
    }

    // Default student navigation
    return [
      {
        icon: Home,
        label: "Home",
        path: "/",
        active: location === "/",
        key: "student-home"
      },
      {
        icon: ShoppingCart,
        label: "Cart",
        path: "/cart",
        active: location === "/cart",
        key: "student-cart"
      },
      {
        icon: Package,
        label: "Orders",
        path: "/orders",
        active: location === "/orders",
        key: "student-orders"
      },
      {
        icon: User,
        label: "Profile",
        path: "/profile",
        active: location === "/profile",
        key: "student-profile"
      }
    ];
  };

  const navItems = getNavItems();

  // Convert navigation items to dock items
  const dockItems: DockItemData[] = navItems.map((item) => {
    const Icon = item.icon;
    return {
      icon: <Icon size={20} />,
      label: item.label,
      onClick: () => setLocation(item.path),
      isActive: item.active
    };
  });

  return (
    <div className="md:hidden">
      <Dock 
        items={dockItems}
        panelHeight={68}
        baseItemSize={50}
        magnification={70}
        distance={150}
      />
    </div>
  );
}