import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const exitTimer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 1000); // Slightly longer for smoother transition
    }, 3500);

    return () => {
      clearTimeout(exitTimer);
    };
  }, [onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.5, exit: { duration: 0.8, ease: "easeInOut" } }}
          className="fixed inset-0 z-50 overflow-hidden bg-gradient-to-b from-[hsl(345,82%,15%)] via-[hsl(345,82%,20%)] to-[hsl(345,82%,10%)]"
        >
          {/* Netflix-style animated background */}
          <div className="absolute inset-0">
            {/* Cinematic sweep effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{
                duration: 2,
                ease: "easeInOut",
                repeat: Infinity,
                repeatDelay: 3,
              }}
              style={{ transform: "skewX(-15deg)", width: "120%" }}
            />

            {/* Subtle grain overlay - lightened */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(139,10,46,0.05)_100%)]" />
          </div>

          {/* Main cinematic content - everything appears together */}
          <div className="relative z-10 h-full flex flex-col items-center justify-center text-center">
            
            {/* Logo - ultra smooth entrance */}
            <motion.div
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="mb-8"
            >
              <div className="relative">
                {/* Subtle glow */}
                <motion.div
                  className="absolute inset-0 bg-[hsl(345,82%,40%)] rounded-full blur-3xl opacity-30"
                  animate={{ 
                    scale: [1, 1.1, 1],
                    opacity: [0.2, 0.4, 0.2]
                  }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                />
                
                <img
                  src="/logo.png"
                  alt="UB FoodHub"
                  className="relative z-10 w-32 h-32 md:w-40 md:h-40 lg:w-44 lg:h-44 drop-shadow-2xl"
                />
              </div>
            </motion.div>

            {/* Title - appears after logo */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.6 }}
              className="mb-4"
            >
              <motion.h1
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-3 tracking-tight px-4"
                style={{
                  textShadow: "0 0 20px rgba(139,10,46,0.8), 0 0 40px rgba(139,10,46,0.6)",
                }}
                initial={{ letterSpacing: "0.3em", opacity: 0 }}
                animate={{ letterSpacing: "normal", opacity: 1 }}
                transition={{ duration: 1, delay: 0.8 }}
              >
                <span className="text-[hsl(345,82%,55%)]">UB</span>{" "}
                <span className="text-white">FoodHub</span>
              </motion.h1>
            </motion.div>

            {/* Subtitle - appears last */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.2 }}
            >
              <motion.p
                className="text-base sm:text-lg md:text-xl text-gray-300 font-light tracking-wide px-4"
              >
                University of Batangas Food Experience
              </motion.p>
            </motion.div>

          </div>

          {/* Lightened cinematic vignette */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.15) 100%)",
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
