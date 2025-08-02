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

            {/* Gentle floating particles */}
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-white/25 rounded-full"
                  initial={{
                    x: Math.random() * (typeof window !== "undefined" ? window.innerWidth : 400),
                    y: typeof window !== "undefined" ? window.innerHeight : 800,
                    opacity: 0,
                  }}
                  animate={{
                    y: -100,
                    x: `+=${(Math.random() - 0.5) * 50}`,
                    opacity: [0, 0.7, 0.4, 0],
                  }}
                  transition={{
                    duration: 8 + Math.random() * 4,
                    repeat: Infinity,
                    delay: Math.random() * 6,
                    ease: "linear",
                  }}
                />
              ))}
              
              {/* Medium floating particles */}
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={`medium-${i}`}
                  className="absolute w-1.5 h-1.5 bg-[hsl(345,82%,65%)]/15 rounded-full"
                  initial={{
                    x: Math.random() * (typeof window !== "undefined" ? window.innerWidth : 400),
                    y: typeof window !== "undefined" ? window.innerHeight : 800,
                    opacity: 0,
                  }}
                  animate={{
                    y: -120,
                    x: `+=${(Math.random() - 0.5) * 80}`,
                    opacity: [0, 0.5, 0.3, 0],
                  }}
                  transition={{
                    duration: 10 + Math.random() * 5,
                    repeat: Infinity,
                    delay: Math.random() * 8,
                    ease: "linear",
                  }}
                />
              ))}

              {/* Large floating particles */}
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={`large-${i}`}
                  className="absolute w-2 h-2 bg-[hsl(345,82%,70%)]/10 rounded-full"
                  initial={{
                    x: Math.random() * (typeof window !== "undefined" ? window.innerWidth : 400),
                    y: typeof window !== "undefined" ? window.innerHeight : 800,
                    opacity: 0,
                  }}
                  animate={{
                    y: -150,
                    x: `+=${(Math.random() - 0.5) * 100}`,
                    opacity: [0, 0.4, 0.2, 0],
                  }}
                  transition={{
                    duration: 12 + Math.random() * 6,
                    repeat: Infinity,
                    delay: Math.random() * 10,
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
                  {/* Very subtle glow */}
                  <motion.div
                    className="absolute inset-0 bg-[hsl(345,82%,50%)] rounded-full blur-2xl opacity-20"
                    animate={{ 
                      scale: [1, 1.05, 1],
                      opacity: [0.15, 0.25, 0.15]
                    }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  />
                  
                  <img
                    src="/logo.png"
                    alt="UB FoodHub"
                    className="relative z-10 w-32 h-32 md:w-40 md:h-40 lg:w-44 lg:h-44 drop-shadow-xl mx-auto"
                    style={{
                      mixBlendMode: "screen",
                      filter: "brightness(1.2) saturate(1.1)",
                      background: "transparent"
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
