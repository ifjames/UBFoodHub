import { motion } from "framer-motion";

const logoPath = "/logo.png";

interface LoadingIndicatorProps {
  message?: string;
  size?: "sm" | "md" | "lg";
  variant?: "logo" | "spinner" | "dots" | "splash";
  className?: string;
}

export default function LoadingIndicator({
  message = "Loading...",
  size = "md",
  variant = "spinner",
  className = "",
}: LoadingIndicatorProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  const logoSizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  };

  if (variant === "splash") {
    return (
      <div
        className={`flex flex-col items-center justify-center space-y-6 p-8 ${className}`}
      >
        {/* Liquid glass background effect */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/3 backdrop-blur-sm"></div>
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 360],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-pink-500/12 via-purple-500/12 to-blue-500/12 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              rotate: [360, 0],
              opacity: [0.3, 0.1, 0.3],
            }}
            transition={{
              duration: 7,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute bottom-0 right-0 w-3/4 h-3/4 bg-gradient-to-tl from-red-500/12 via-orange-500/12 to-yellow-500/12 rounded-full blur-2xl"
          />
        </div>

        {/* Floating particles from bottom */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(22)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-white/25 rounded-full"
              initial={{
                x: Math.random() * (typeof window !== "undefined" ? window.innerWidth : 800),
                y: typeof window !== "undefined" ? window.innerHeight + 50 : 700,
                scale: 0,
              }}
              animate={{
                y: -120,
                scale: [0, 1, 0.5, 0],
                opacity: [0, 0.8, 0.4, 0],
              }}
              transition={{
                duration: 4 + Math.random() * 3,
                repeat: Infinity,
                delay: Math.random() * 3,
                ease: "easeOut",
              }}
            />
          ))}
        </div>

        {/* Logo with glass effect */}
        <motion.div
          className="relative"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          <motion.div
            className="w-24 h-24 rounded-full flex items-center justify-center relative overflow-hidden bg-transparent"
            animate={{
              y: [0, -10, 0],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <img
              src={logoPath}
              alt="Loading"
              className="w-20 h-20 object-contain drop-shadow-lg"
            />
          </motion.div>
        </motion.div>

        {/* Message */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <motion.p
            className="text-white text-lg font-medium mb-2"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            {message}
          </motion.p>

          {/* Loading dots */}
          <div className="flex justify-center space-x-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-white/60 rounded-full"
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  if (variant === "logo") {
    return (
      <div
        className={`flex flex-col items-center justify-center space-y-4 ${className}`}
      >
        <motion.div
          animate={{
            y: [0, -10, 0],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="relative"
        >
          <img
            src={logoPath}
            alt="Loading"
            className={`${logoSizeClasses[size]} object-contain drop-shadow-lg`}
          />
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-gray-600 font-medium"
        >
          {message}
        </motion.p>

        {/* Animated loading dots */}
        <div className="flex space-x-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 1, 0.3],
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: i * 0.2,
              }}
              className="w-2 h-2 bg-[#6d031e] rounded-full"
            />
          ))}
        </div>
      </div>
    );
  }

  if (variant === "dots") {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="flex space-x-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.4, 1, 0.4],
              }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: i * 0.1,
              }}
              className="w-2 h-2 bg-[#6d031e] rounded-full"
            />
          ))}
        </div>
        <span className="text-sm text-gray-600 ml-2">{message}</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <div className="relative">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className={`${sizeClasses[size]} border-2 border-gray-200 border-t-[#6d031e] rounded-full`}
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className={`absolute inset-0 ${sizeClasses[size]} border-2 border-transparent border-t-red-300 rounded-full`}
        />
      </div>
      <motion.span
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="text-sm text-gray-600 font-medium"
      >
        {message}
      </motion.span>
    </div>
  );
}

// Button loading state component
export function LoadingButton({
  children,
  isLoading,
  loadingText,
  className = "",
  ...props
}: {
  children: React.ReactNode;
  isLoading: boolean;
  loadingText?: string;
  className?: string;
  [key: string]: any;
}) {
  return (
    <button
      disabled={isLoading}
      className={`relative inline-flex items-center justify-center ${className} ${
        isLoading ? "hidden" : ""
      }`}
      {...props}
    >
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex items-center justify-center bg-inherit rounded-inherit"
        >
          <LoadingIndicator
            message={loadingText}
            size="sm"
            variant="dots"
            className="text-white"
          />
        </motion.div>
      )}
      <motion.div
        animate={{ opacity: isLoading ? 0 : 1 }}
        className={isLoading ? "invisible" : "visible"}
      >
        {children}
      </motion.div>
    </button>
  );
}
