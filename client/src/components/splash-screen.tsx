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
      // Longer delay for mobile to ensure smooth transition
      const isMobile = typeof window !== "undefined" && window.innerWidth <= 768;
      setTimeout(onComplete, isMobile ? 1200 : 1000);
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

            {/* Visible floating particles */}
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(25)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-white/60 rounded-full"
                  initial={{
                    x: Math.random() * (typeof window !== "undefined" ? window.innerWidth : 400),
                    y: typeof window !== "undefined" ? window.innerHeight + 50 : 800,
                    opacity: 0,
                  }}
                  animate={{
                    y: -100,
                    x: `+=${(Math.random() - 0.5) * 60}`,
                    opacity: [0, 0.8, 0.6, 0],
                  }}
                  transition={{
                    duration: 6 + Math.random() * 3,
                    repeat: Infinity,
                    delay: Math.random() * 4,
                    ease: "linear",
                  }}
                />
              ))}
              
              {/* Larger particles */}
              {[...Array(15)].map((_, i) => (
                <motion.div
                  key={`large-${i}`}
                  className="absolute w-3 h-3 bg-[hsl(345,82%,75%)]/40 rounded-full"
                  initial={{
                    x: Math.random() * (typeof window !== "undefined" ? window.innerWidth : 400),
                    y: typeof window !== "undefined" ? window.innerHeight + 80 : 800,
                    opacity: 0,
                  }}
                  animate={{
                    y: -120,
                    x: `+=${(Math.random() - 0.5) * 80}`,
                    opacity: [0, 0.6, 0.4, 0],
                  }}
                  transition={{
                    duration: 8 + Math.random() * 4,
                    repeat: Infinity,
                    delay: Math.random() * 6,
                    ease: "linear",
                  }}
                />
              ))}
            </div>

            {/* Subtle grain overlay - lightened */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(139,10,46,0.05)_100%)]" />
          </div>

          {/* Main cinematic content - everything appears together */}
          <div className="relative z-10 h-full flex flex-col items-center justify-center">
            
            {/* Everything appears together smoothly */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="flex flex-col items-center justify-center text-center w-full"
            >
              {/* Logo */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                className="mb-8 flex justify-center items-center"
              >
                <div className="relative flex justify-center items-center">
                  <img
                    src="/logo.png"
                    alt="UB FoodHub"
                    className="w-32 h-32 md:w-40 md:h-40 lg:w-44 lg:h-44 mx-auto"
                    style={{
                      background: "none",
                      filter: "none"
                    }}
                  />
                </div>
              </motion.div>

              {/* Title */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
                className="mb-4 w-full text-center"
              >
                <h1
                  className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-3 tracking-tight px-4"
                  style={{
                    textShadow: "0 0 20px rgba(139,10,46,0.6), 0 0 40px rgba(139,10,46,0.4)",
                  }}
                >
                  <span className="text-[hsl(345,82%,55%)]">UB</span>{" "}
                  <span className="text-white">FoodHub</span>
                </h1>
              </motion.div>

              {/* Subtitle */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
                className="w-full text-center"
              >
                <p className="text-base sm:text-lg md:text-xl text-gray-300 font-light tracking-wide px-4">
                  University of Batangas Food Experience
                </p>
              </motion.div>
            </motion.div>

          </div>


        </motion.div>
      )}
    </AnimatePresence>
  );
}
