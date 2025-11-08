import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { usePageTitle } from "@/hooks/use-page-title";
import { Home, ArrowLeft, Search } from "lucide-react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useStore } from "@/lib/store";

export default function NotFound() {
  usePageTitle("Page Not Found");
  const [, setLocation] = useLocation();
  const { state } = useStore();

  const handleGoHome = () => {
    if (!state.user) {
      setLocation("/login");
    } else if (state.user.role === "admin") {
      setLocation("/admin");
    } else if (state.user.role === "stall_owner") {
      setLocation("/stall-dashboard");
    } else {
      setLocation("/");
    }
  };

  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#6d031e] via-[#8b0a2e] to-[#a91b42] flex items-center justify-center overflow-hidden relative">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/3 backdrop-blur-sm"></div>
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            rotate: [0, 360],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-pink-500/15 via-purple-500/15 to-blue-500/15 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.3, 1, 1.3],
            rotate: [360, 0],
            opacity: [0.3, 0.1, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute bottom-0 right-0 w-3/4 h-3/4 bg-gradient-to-tl from-red-500/15 via-orange-500/15 to-yellow-500/15 rounded-full blur-2xl"
        />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 bg-white/20 rounded-full"
            initial={{
              x: Math.random() * (typeof window !== "undefined" ? window.innerWidth : 400),
              y: typeof window !== "undefined" ? window.innerHeight + 50 : 700,
              scale: 0,
            }}
            animate={{
              y: -100,
              scale: [0, 1, 0.5, 0],
              opacity: [0, 0.7, 0.3, 0],
            }}
            transition={{
              duration: 3.5 + Math.random() * 2.5,
              repeat: Infinity,
              delay: Math.random() * 2.5,
              ease: "easeOut",
            }}
          />
        ))}
      </div>

      {/* Content */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        <Card className="backdrop-blur-xl bg-white/95 border-white/20 shadow-2xl">
          <div className="p-8 text-center">
            {/* Logo */}
            <motion.div
              initial={{ scale: 0.5, rotate: -180 }}
              animate={{ 
                scale: 1, 
                rotate: 0,
              }}
              transition={{ duration: 0.6 }}
              className="flex justify-center mb-6"
            >
              <img 
                src="/logo.png" 
                alt="UB FoodHub" 
                className="w-20 h-20 object-contain"
              />
            </motion.div>

            {/* 404 Number */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="mb-4"
            >
              <h1 className="text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#6d031e] to-[#a91b42]">
                404
              </h1>
            </motion.div>

            {/* Message */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="mb-2"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Page Not Found
              </h2>
              <p className="text-gray-600 text-sm">
                Oops! The page you're looking for doesn't exist or has been moved.
              </p>
            </motion.div>

            {/* Search icon */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="my-6 flex justify-center"
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#6d031e] to-[#a91b42] flex items-center justify-center">
                <Search className="w-8 h-8 text-white" />
              </div>
            </motion.div>

            {/* Action buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="flex flex-col gap-3"
            >
              <Button
                onClick={handleGoHome}
                className="w-full bg-gradient-to-r from-[#6d031e] to-[#a91b42] hover:from-[#8b0a2e] hover:to-[#c02450] text-white"
                data-testid="button-go-home"
              >
                <Home className="w-4 h-4 mr-2" />
                Go to Home
              </Button>
              <Button
                onClick={handleGoBack}
                variant="outline"
                className="w-full border-[#6d031e] text-[#6d031e] hover:bg-[#6d031e]/10 hover:text-[#6d031e]"
                data-testid="button-go-back"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
            </motion.div>
          </div>
        </Card>

        {/* Footer hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="text-center mt-4 text-white/80 text-sm"
        >
          Need help? Contact support at UB FoodHub
        </motion.p>
      </motion.div>
    </div>
  );
}
