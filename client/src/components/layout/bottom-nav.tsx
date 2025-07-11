import { Home, Search, ShoppingCart, User, Package } from "lucide-react";
import { useLocation } from "wouter";
import { useStore } from "@/lib/store";
import { motion } from "framer-motion";

export default function BottomNav() {
  const [location, setLocation] = useLocation();
  const { state } = useStore();

  const navItems = [
    {
      icon: Home,
      label: "Home",
      path: "/",
      active: location === "/"
    },
    {
      icon: Search,
      label: "Search",
      path: "/search",
      active: location === "/search"
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

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 md:hidden"
    >
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <motion.button
                key={item.path}
                whileTap={{ scale: 0.95 }}
                onClick={() => setLocation(item.path)}
                className={`flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-colors ${
                  item.active
                    ? "text-maroon-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Icon className={`w-5 h-5 mb-1 ${item.active ? "fill-current" : ""}`} />
                <span className={`text-xs font-medium ${item.active ? "text-maroon-600" : "text-gray-500"}`}>
                  {item.label}
                </span>
                {item.active && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-maroon-600 rounded-full"
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}