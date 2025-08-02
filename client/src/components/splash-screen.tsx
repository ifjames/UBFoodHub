import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Utensils, ShoppingCart, Star, Clock, Users } from "lucide-react";
import logoPath from "@assets/ub foodhub logo2_1751778236646.png";

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [animationPhase, setAnimationPhase] = useState(0);

  useEffect(() => {
    // Phase progression: 0->1->2->3 (each phase 1.2 seconds)
    const phaseTimers = [
      setTimeout(() => setAnimationPhase(1), 1200),
      setTimeout(() => setAnimationPhase(2), 2400),
      setTimeout(() => setAnimationPhase(3), 3600),
    ];

    const exitTimer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        onComplete();
      }, 1000);
    }, 4800);

    return () => {
      phaseTimers.forEach(clearTimeout);
      clearTimeout(exitTimer);
    };
  }, [onComplete]);

  // Food emoji elements for animation
  const foodEmojis = ["🍕", "🍔", "🌮", "🍜", "🍗", "🥪", "🍱", "🍰"];
  const features = [
    { icon: ShoppingCart, text: "Easy Ordering", delay: 0.2 },
    { icon: Clock, text: "Quick Pickup", delay: 0.4 },
    { icon: Star, text: "Top Quality", delay: 0.6 },
    { icon: Users, text: "Student Friendly", delay: 0.8 },
  ];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.1 }}
          transition={{ duration: 1, exit: { duration: 1 } }}
          className="fixed inset-0 z-50 overflow-hidden bg-gradient-to-br from-[#1a0b2e] via-[#2d1b3d] to-[#4a1f3e] relative"
        >
          {/* Animated Background Stars */}
          <div className="absolute inset-0">
            {[...Array(50)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0.5, 1.5, 0.5],
                }}
                transition={{
                  duration: 2 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </div>

          {/* Dynamic Gradient Orbs */}
          <motion.div
            className="absolute -top-40 -left-40 w-80 h-80 bg-gradient-to-r from-purple-600/30 to-pink-600/30 rounded-full blur-3xl"
            animate={{
              x: [0, 100, 0],
              y: [0, 50, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute -bottom-40 -right-40 w-96 h-96 bg-gradient-to-r from-red-600/30 to-orange-600/30 rounded-full blur-3xl"
            animate={{
              x: [0, -80, 0],
              y: [0, -60, 0],
              scale: [1.2, 1, 1.2],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Main Content Container */}
          <div className="relative z-10 h-full flex flex-col items-center justify-center px-6 text-center">
            
            {/* Phase 0: Cinematic Entry with Logo */}
            {animationPhase >= 0 && (
              <motion.div
                initial={{ scale: 0, rotate: -180, opacity: 0 }}
                animate={{ 
                  scale: animationPhase >= 1 ? [1, 1.1, 1] : 1, 
                  rotate: 0, 
                  opacity: 1 
                }}
                transition={{ 
                  duration: 1.2, 
                  type: "spring", 
                  stiffness: 100,
                  scale: { duration: 0.6, delay: 1.2 }
                }}
                className="mb-8"
              >
                <div className="relative">
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-red-500 to-red-600 rounded-full blur-xl opacity-50"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <img
                    src={logoPath}
                    alt="UB FoodHub Bull"
                    className="relative z-10 w-32 h-32 md:w-40 md:h-40 drop-shadow-2xl"
                  />
                </div>
              </motion.div>
            )}

            {/* Phase 1: App Title with Cinematic Effect */}
            {animationPhase >= 1 && (
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8 }}
                className="mb-8"
              >
                <motion.h1
                  className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-red-400 via-red-500 to-red-600 bg-clip-text text-transparent mb-2"
                  animate={{ 
                    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] 
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                  style={{ backgroundSize: "200% 200%" }}
                >
                  UB FoodHub
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-white/80 text-lg md:text-xl font-light"
                >
                  University of Batangas Food Experience
                </motion.p>
              </motion.div>
            )}

            {/* Phase 2: Feature Showcase */}
            {animationPhase >= 2 && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="mb-12"
              >
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto">
                  {features.map((feature, index) => (
                    <motion.div
                      key={index}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ 
                        delay: feature.delay,
                        type: "spring",
                        stiffness: 100
                      }}
                      className="flex flex-col items-center p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20"
                    >
                      <feature.icon className="w-8 h-8 text-red-400 mb-2" />
                      <span className="text-white/90 text-sm font-medium">{feature.text}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Phase 3: Food Animation & Call to Action */}
            {animationPhase >= 3 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8 }}
                className="text-center"
              >
                <motion.div
                  className="flex justify-center space-x-4 mb-6 text-4xl"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  {foodEmojis.slice(0, 4).map((emoji, index) => (
                    <motion.span
                      key={index}
                      animate={{
                        y: [0, -20, 0],
                        rotate: [0, 10, -10, 0],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: index * 0.2,
                      }}
                    >
                      {emoji}
                    </motion.span>
                  ))}
                </motion.div>
                
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-white/80 text-lg mb-4 font-medium"
                >
                  Preparing your amazing food experience...
                </motion.p>

                {/* Animated Progress Bar */}
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 1.5, delay: 0.6 }}
                  className="w-48 h-2 mx-auto bg-white/20 rounded-full overflow-hidden"
                >
                  <motion.div
                    className="h-full bg-gradient-to-r from-red-500 to-red-400 rounded-full"
                    animate={{ x: ["-100%", "0%"] }}
                    transition={{ duration: 1.5, delay: 0.6 }}
                  />
                </motion.div>
              </motion.div>
            )}
          </div>

          {/* Floating Food Elements */}
          {animationPhase >= 2 && [...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-2xl select-none pointer-events-none"
              style={{
                left: `${10 + (i * 80 / 8)}%`,
                top: `${20 + Math.sin(i) * 60}%`,
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ 
                opacity: [0, 0.7, 0],
                scale: [0, 1, 0],
                y: [0, -100, -200],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: i * 0.3 + 1,
                ease: "easeOut",
              }}
            >
              {foodEmojis[i]}
            </motion.div>
          ))}

          {/* Cinematic Light Rays */}
          <motion.div
            className="absolute inset-0 opacity-30"
            style={{
              background: `conic-gradient(from 0deg at 50% 50%, transparent 0deg, rgba(255,255,255,0.1) 20deg, transparent 40deg, rgba(255,255,255,0.1) 60deg, transparent 80deg)`,
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}