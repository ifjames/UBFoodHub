import { motion } from "framer-motion";
import { useState, useEffect } from "react";

interface StallLoadingScreenProps {
  message?: string;
  className?: string;
}

const foodItems = [
  { emoji: "🍜", name: "Ramen", delay: 0 },
  { emoji: "🍕", name: "Pizza", delay: 0.1 },
  { emoji: "🍔", name: "Burger", delay: 0.2 },
  { emoji: "🌮", name: "Taco", delay: 0.3 },
  { emoji: "🍛", name: "Curry", delay: 0.4 },
  { emoji: "🍝", name: "Pasta", delay: 0.5 },
  { emoji: "🥗", name: "Salad", delay: 0.6 },
  { emoji: "🍳", name: "Fried", delay: 0.7 },
];

const loadingSteps = [
  "Finding delicious stalls...",
  "Checking today's featured dishes...",
  "Loading fresh menus...",
  "Almost ready to serve you!",
];

export default function StallLoadingScreen({ 
  message = "Loading stalls...", 
  className = "" 
}: StallLoadingScreenProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [currentMessage, setCurrentMessage] = useState(loadingSteps[0]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        const next = (prev + 1) % loadingSteps.length;
        setCurrentMessage(loadingSteps[next]);
        return next;
      });
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`flex flex-col items-center justify-center space-y-8 p-8 ${className}`}>
      {/* Main Logo with Enhanced Animation */}
      <motion.div
        className="relative"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {/* Glowing Background */}
        <motion.div
          className="absolute inset-0 w-32 h-32 bg-gradient-to-r from-[#6d031e] via-[#8b0420] to-[#6d031e] rounded-full blur-xl opacity-30"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        
        {/* Main Logo */}
        <motion.div
          className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-white/20 backdrop-blur-sm"
          animate={{
            y: [0, -8, 0],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <img
            src="/logo.png"
            alt="UB FoodHub"
            className="w-full h-full object-contain drop-shadow-lg"
          />
        </motion.div>

        {/* Rotating Ring */}
        <motion.div
          className="absolute inset-0 w-24 h-24 border-2 border-dashed border-[#6d031e]/40 rounded-full"
          animate={{ rotate: 360 }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </motion.div>

      {/* Floating Food Items */}
      <div className="relative w-80 h-20 mx-auto">
        {foodItems.map((item, index) => (
          <motion.div
            key={item.emoji}
            className="absolute flex flex-col items-center text-center"
            style={{
              left: `${(index / (foodItems.length - 1)) * 100}%`,
              transform: 'translateX(-50%)',
            }}
            initial={{ 
              y: 60, 
              opacity: 0, 
              scale: 0,
              rotate: -180 
            }}
            animate={{ 
              y: [60, 0, -10, 0], 
              opacity: [0, 1, 1, 0.7], 
              scale: [0, 1.2, 1, 1],
              rotate: [180, 0, 5, 0],
            }}
            transition={{
              duration: 2.5,
              delay: item.delay,
              repeat: Infinity,
              repeatDelay: 3,
              ease: "easeOut",
            }}
          >
            <span className="text-2xl mb-1 filter drop-shadow-sm">
              {item.emoji}
            </span>
            <span className="text-xs text-gray-600 font-medium">
              {item.name}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Enhanced Message Display */}
      <motion.div
        className="text-center space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <motion.h3
          key={currentMessage}
          className="text-xl font-semibold text-[#6d031e] mb-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.5 }}
        >
          {currentMessage}
        </motion.h3>

        {/* Progress Dots */}
        <div className="flex justify-center space-x-2">
          {loadingSteps.map((_, index) => (
            <motion.div
              key={index}
              className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                index === currentStep 
                  ? 'bg-[#6d031e]' 
                  : index < currentStep 
                    ? 'bg-[#6d031e]/60' 
                    : 'bg-gray-300'
              }`}
              animate={{
                scale: index === currentStep ? [1, 1.3, 1] : 1,
              }}
              transition={{
                duration: 0.5,
                repeat: index === currentStep ? Infinity : 0,
              }}
            />
          ))}
        </div>

        {/* Animated Loading Bar */}
        <div className="w-64 h-1 bg-gray-200 rounded-full overflow-hidden mx-auto">
          <motion.div
            className="h-full bg-gradient-to-r from-[#6d031e] via-[#8b0420] to-[#6d031e] rounded-full"
            animate={{
              x: ['-100%', '100%'],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>

        {/* Kitchen Steam Effect */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-white/30 rounded-full"
              style={{
                left: `${20 + i * 12}%`,
                bottom: '20%',
              }}
              animate={{
                y: [0, -100, -200],
                opacity: [0, 0.6, 0],
                scale: [0.5, 1, 1.5],
              }}
              transition={{
                duration: 3,
                delay: i * 0.5,
                repeat: Infinity,
                ease: "easeOut",
              }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}