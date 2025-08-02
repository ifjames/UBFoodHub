import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 400),   // Logo zoom out - faster
      setTimeout(() => setPhase(2), 1000),  // Title appear - faster  
      setTimeout(() => setPhase(3), 1800),  // Tagline appear - faster
    ];

    const exitTimer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 800);
    }, 4200); // Longer duration to let animations complete

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

          {/* Main cinematic content */}
          <div className="relative z-10 h-full flex flex-col items-center justify-center">
            {/* Phase 0: Logo entrance - smooth cinematic */}
            <motion.div
              initial={{ scale: 2, opacity: 0, y: 0 }}
              animate={{ 
                scale: 1,
                opacity: 1,
                y: phase >= 2 ? -30 : 0
              }}
              transition={{ 
                scale: { duration: 1.2, ease: [0.23, 1, 0.32, 1] },
                opacity: { duration: 1.2, ease: "easeOut" },
                y: { duration: 0.8, ease: [0.23, 1, 0.32, 1] }
              }}
              className={`${phase >= 2 ? 'mb-4' : 'mb-8'} transition-all duration-800`}
            >
              <div className="relative">
                {/* Subtle glow without harsh borders */}
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

            {/* Phase 1: Title reveal with letterpress effect */}
            {phase >= 2 && (
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                className="text-center mb-4"
              >
                <motion.h1
                  className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-3 tracking-tight px-4"
                  style={{
                    textShadow:
                      "0 0 20px rgba(139,10,46,0.8), 0 0 40px rgba(139,10,46,0.6)",
                  }}
                  initial={{ letterSpacing: "0.5em", opacity: 0 }}
                  animate={{ letterSpacing: "normal", opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.1 }}
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
                  className="text-base sm:text-lg md:text-xl text-gray-300 font-light tracking-wide px-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                >
                  University of Batangas Food Experience
                </motion.p>
              </motion.div>
            )}


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
