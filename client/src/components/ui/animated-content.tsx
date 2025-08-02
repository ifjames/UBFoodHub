import React, { ReactNode } from "react";
import { motion } from "framer-motion";

interface AnimatedContentProps {
  children: ReactNode;
  distance?: number;
  direction?: "vertical" | "horizontal";
  reverse?: boolean;
  duration?: number;
  initialOpacity?: number;
  delay?: number;
  className?: string;
}

const AnimatedContent: React.FC<AnimatedContentProps> = ({
  children,
  distance = 50,
  direction = "vertical",
  reverse = false,
  duration = 0.6,
  initialOpacity = 0,
  delay = 0,
  className = "",
}) => {
  const axis = direction === "horizontal" ? "x" : "y";
  const offset = reverse ? -distance : distance;

  return (
    <motion.div
      className={className}
      initial={{
        [axis]: offset,
        opacity: initialOpacity,
      }}
      animate={{
        [axis]: 0,
        opacity: 1,
      }}
      transition={{
        duration,
        delay,
        ease: "easeOut",
      }}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedContent;