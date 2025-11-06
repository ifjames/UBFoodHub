import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showLogo?: boolean;
}

export function Spinner({ className, size = "md", showLogo = false }: SpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6", 
    lg: "w-8 h-8"
  };

  const logoSizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16"
  };

  if (showLogo) {
    return (
      <div className="flex flex-col items-center space-y-4">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className={cn("relative", logoSizeClasses[size])}
        >
          <img 
            src="/logo.png" 
            alt="UB FoodHub" 
            className="w-full h-full object-contain"
          />
        </motion.div>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className={cn(
            "border-2 border-maroon-200 border-t-maroon-600 rounded-full",
            sizeClasses[size],
            className
          )}
        />
      </div>
    );
  }

  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      className={cn(
        "border-2 border-maroon-200 border-t-maroon-600 rounded-full",
        sizeClasses[size],
        className
      )}
    />
  );
}