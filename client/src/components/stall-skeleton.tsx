import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";

interface StallSkeletonProps {
  count?: number;
  className?: string;
}

export default function StallSkeleton({ count = 8, className = "" }: StallSkeletonProps) {
  return (
    <div className={`grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${className}`}>
      {Array.from({ length: count }, (_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1, duration: 0.4 }}
        >
          <Card className="bg-white border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300">
            <CardContent className="p-0">
              {/* Image Skeleton */}
              <div className="relative">
                <motion.div
                  className="w-full h-32 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200"
                  animate={{
                    backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  style={{
                    backgroundSize: '200% 100%',
                  }}
                />
                
                {/* Heart Icon Skeleton */}
                <div className="absolute top-2 right-2">
                  <div className="w-8 h-8 bg-gray-300 rounded-full animate-pulse" />
                </div>

                {/* Status Badge Skeleton */}
                <div className="absolute top-2 left-2">
                  <div className="px-2 py-1 bg-gray-300 rounded-full w-16 h-6 animate-pulse" />
                </div>
              </div>

              {/* Content Skeleton */}
              <div className="p-3">
                {/* Title */}
                <motion.div
                  className="h-5 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded mb-2"
                  animate={{
                    backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.2,
                  }}
                  style={{
                    backgroundSize: '200% 100%',
                  }}
                />

                {/* Description */}
                <motion.div
                  className="h-3 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded mb-3 w-4/5"
                  animate={{
                    backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.4,
                  }}
                  style={{
                    backgroundSize: '200% 100%',
                  }}
                />

                {/* Rating and Location Row */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-1">
                    <div className="w-4 h-4 bg-gray-300 rounded animate-pulse" />
                    <motion.div
                      className="h-3 w-8 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded"
                      animate={{
                        backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 0.6,
                      }}
                      style={{
                        backgroundSize: '200% 100%',
                      }}
                    />
                  </div>
                  <motion.div
                    className="h-3 w-12 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded"
                    animate={{
                      backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 0.8,
                    }}
                    style={{
                      backgroundSize: '200% 100%',
                    }}
                  />
                </div>

                {/* Categories */}
                <div className="flex flex-wrap gap-1">
                  {[1, 2].map((_, j) => (
                    <motion.div
                      key={j}
                      className="h-5 w-12 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-full"
                      animate={{
                        backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 1 + j * 0.1,
                      }}
                      style={{
                        backgroundSize: '200% 100%',
                      }}
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

export function FeaturedStallSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
    >
      <Card className="bg-gradient-to-r from-[#6d031e] to-[#8b0420] text-white border-none overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-white/30 rounded animate-pulse" />
              <div className="h-4 w-24 bg-white/30 rounded animate-pulse" />
            </div>
            <div className="w-8 h-8 bg-white/30 rounded-full animate-pulse" />
          </div>

          <div className="flex items-center space-x-4">
            <motion.div
              className="w-16 h-16 bg-gradient-to-r from-white/20 via-white/30 to-white/20 rounded-lg"
              animate={{
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              style={{
                backgroundSize: '200% 100%',
              }}
            />
            
            <div className="flex-1">
              <motion.div
                className="h-5 bg-gradient-to-r from-white/20 via-white/30 to-white/20 rounded mb-2"
                animate={{
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.2,
                }}
                style={{
                  backgroundSize: '200% 100%',
                }}
              />
              <motion.div
                className="h-3 bg-gradient-to-r from-white/20 via-white/30 to-white/20 rounded w-3/4"
                animate={{
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.4,
                }}
                style={{
                  backgroundSize: '200% 100%',
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}