import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import logoPath from "@assets/ub foodhub logo2_1751778236646.png";

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 800),   // Logo zoom out
      setTimeout(() => setPhase(2), 2000),  // Title appear
      setTimeout(() => setPhase(3), 3200),  // Tagline appear
    ];

    const exitTimer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 600);
    }, 4500);

    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(exitTimer);
    };
  }, [onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, exit: { duration: 0.6 } }}
          className="fixed inset-0 z-50 overflow-hidden bg-gradient-to-b from-[#1a0606] via-[#2d0b0b] to-black"
        >
          {/* Netflix-style animated background */}
          <div className="absolute inset-0">
            {/* Cinematic sweep effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{ duration: 2, ease: "easeInOut", repeat: Infinity, repeatDelay: 3 }}
              style={{ transform: "skewX(-15deg)", width: "120%" }}
            />
            
            {/* Subtle grain overlay */}
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(139,10,46,0.1)_100%)]" />
          </div>

          {/* Main cinematic content */}
          <div className="relative z-10 h-full flex flex-col items-center justify-center">
            
            {/* Phase 0: Logo entrance - Netflix style zoom */}
            <motion.div
              initial={{ scale: 3, opacity: 0 }}
              animate={{ 
                scale: phase >= 1 ? 1 : 3,
                opacity: 1
              }}
              transition={{ 
                duration: 1.5, 
                ease: [0.25, 0.46, 0.45, 0.94]  // Netflix-style easing
              }}
              className="mb-8"
            >
              <div className="relative">
                {/* Glowing background for logo */}
                <motion.div
                  className="absolute inset-0 bg-[hsl(345,82%,28%)] rounded-full blur-2xl opacity-60"
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.6, 0.8, 0.6]
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
                
                <img
                  src={logoPath}
                  alt="UB FoodHub"
                  className="relative z-10 w-24 h-24 md:w-32 md:h-32 drop-shadow-2xl"
                />
              </div>
            </motion.div>

            {/* Phase 1: Title reveal with letterpress effect */}
            {phase >= 2 && (
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                className="text-center mb-4"
              >
                <motion.h1
                  className="text-5xl md:text-7xl font-bold text-white mb-3 tracking-tight"
                  style={{ 
                    textShadow: "0 0 20px rgba(139,10,46,0.8), 0 0 40px rgba(139,10,46,0.6)" 
                  }}
                  initial={{ letterSpacing: "0.5em", opacity: 0 }}
                  animate={{ letterSpacing: "normal", opacity: 1 }}
                  transition={{ duration: 1.2, delay: 0.3 }}
                >
                  <span className="text-[hsl(345,82%,55%)]">UB</span>{" "}
                  <span className="text-white">FoodHub</span>
                </motion.h1>
              </motion.div>
            )}

            {/* Phase 2: Subtitle with typewriter effect */}
            {phase >= 3 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="text-center"
              >
                <motion.p
                  className="text-lg md:text-xl text-gray-300 font-light tracking-wide"
                  initial={{ width: 0 }}
                  animate={{ width: "auto" }}
                  transition={{ duration: 1.5, delay: 0.7 }}
                  style={{ 
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    borderRight: "2px solid hsl(345,82%,55%)"
                  }}
                >
                  University of Batangas Food Experience
                </motion.p>
                
                {/* Remove blinking cursor after animation */}
                <motion.div
                  initial={{ opacity: 1 }}
                  animate={{ opacity: 0 }}
                  transition={{ delay: 2.5, duration: 0.3 }}
                  className="inline-block w-0.5 h-6 bg-[hsl(345,82%,55%)] ml-1"
                />
              </motion.div>
            )}

            {/* Subtle loading indicator - Netflix style */}
            <motion.div
              className="absolute bottom-16 left-1/2 transform -translate-x-1/2"
              initial={{ opacity: 0 }}
              animate={{ opacity: phase >= 3 ? 1 : 0 }}
              transition={{ delay: 1.5 }}
            >
              <div className="flex space-x-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 bg-[hsl(345,82%,55%)] rounded-full"
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.5, 1, 0.5]
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: i * 0.2
                    }}
                  />
                ))}
              </div>
            </motion.div>
          </div>

          {/* Netflix-style cinematic vignette */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 100%)"
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}