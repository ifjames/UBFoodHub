import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const logoPath = "/logo.png";

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        onComplete();
      }, 800);
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-[#6d031e] via-[#8b0a2e] to-[#a91b42] overflow-hidden"
        >
          {/* Liquid glass background effect */}
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
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "linear",
              }}
              className="absolute -top-20 -left-20 w-40 h-40 bg-white/5 rounded-full blur-xl"
            />
            <motion.div
              animate={{
                scale: [1.2, 1, 1.2],
                rotate: [360, 180, 0],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: "linear",
              }}
              className="absolute -bottom-20 -right-20 w-60 h-60 bg-white/5 rounded-full blur-xl"
            />
          </div>

          {/* Glass morphism container */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="relative z-10 p-8 backdrop-blur-xl bg-white/10 rounded-3xl border border-white/20 shadow-2xl"
          >
            {/* Logo animation */}
            <motion.div
              initial={{ scale: 0.5, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ 
                duration: 1.5, 
                delay: 0.8,
                type: "spring",
                stiffness: 100,
                damping: 10
              }}
              className="flex justify-center mb-6"
            >
              <img
                src={logoPath}
                alt="UB FoodHub"
                className="w-24 h-24 object-contain drop-shadow-2xl"
              />
            </motion.div>

            {/* App title */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 1.5 }}
              className="text-center mb-8 relative z-20"
            >
              <h1 className="text-3xl font-bold text-white mb-2">UB FoodHub</h1>
              <p className="text-white/80 text-sm">University of Batangas Food Ordering</p>
            </motion.div>

            {/* Loading indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 2 }}
              className="flex justify-center"
            >
              <div className="relative">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full"
                />
                <div className="absolute inset-0 w-8 h-8 border-2 border-transparent border-t-white/50 rounded-full animate-spin" 
                     style={{ animationDuration: '1s' }} />
              </div>
            </motion.div>

            {/* Loading text */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 2.2 }}
              className="text-center text-white/70 text-sm mt-4"
            >
              Loading your food experience...
            </motion.p>
          </motion.div>

          {/* Floating particles from bottom */}
          {[...Array(18)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-white/30 rounded-full"
              initial={{
                x: Math.random() * (typeof window !== "undefined" ? window.innerWidth : 400),
                y: typeof window !== "undefined" ? window.innerHeight + 50 : 700,
                scale: 0,
              }}
              animate={{
                y: -150,
                scale: [0, 1, 0.5, 0],
                opacity: [0, 0.8, 0.4, 0],
              }}
              transition={{
                duration: 5 + Math.random() * 3,
                repeat: Infinity,
                delay: Math.random() * 4,
                ease: "easeOut",
              }}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}