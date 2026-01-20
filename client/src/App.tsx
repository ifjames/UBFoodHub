import { useState, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { motion } from "framer-motion";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { StoreProvider } from "./lib/store.tsx";
import AuthGuard from "@/components/auth-guard";
import SplashScreen from "@/components/splash-screen";
import DesktopNav from "@/components/layout/desktop-nav";
import NotFound from "@/pages/not-found";
import LoginNew from "@/pages/login-new";
import Home from "@/pages/home";
import Restaurant from "@/pages/restaurant";
import Cart from "@/pages/cart";
import Checkout from "@/pages/checkout";
import Orders from "@/pages/orders";
import Profile from "@/pages/profile";

import AdminDashboard from "@/pages/admin-dashboard";
import AdminVouchers from "@/pages/admin-vouchers";
import StallDashboard from "@/pages/stall-dashboard";
import Settings from "@/pages/settings";
import HelpCenter from "@/pages/help-center";
import TermsPolicies from "@/pages/terms-policies";
import { onAuthStateChange, getDocument, auth, logOut } from "@/lib/firebase";
import { useStore } from "@/lib/store";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginNew} />
      <Route path="/">
        <AuthGuard>
          <DesktopNav />
          <Home />
        </AuthGuard>
      </Route>
      <Route path="/restaurant/:id">
        <AuthGuard>
          <DesktopNav />
          <Restaurant />
        </AuthGuard>
      </Route>
      <Route path="/cart">
        <AuthGuard>
          <DesktopNav />
          <Cart />
        </AuthGuard>
      </Route>
      <Route path="/checkout">
        <AuthGuard>
          <DesktopNav />
          <Checkout />
        </AuthGuard>
      </Route>
      <Route path="/orders">
        <AuthGuard>
          <DesktopNav />
          <Orders />
        </AuthGuard>
      </Route>
      <Route path="/profile">
        <AuthGuard>
          <DesktopNav />
          <Profile />
        </AuthGuard>
      </Route>

      <Route path="/admin">
        <AuthGuard allowedRoles={["admin"]}>
          <AdminDashboard />
        </AuthGuard>
      </Route>
      <Route path="/admin/vouchers">
        <AuthGuard allowedRoles={["admin"]}>
          <AdminVouchers />
        </AuthGuard>
      </Route>
      <Route path="/stall-dashboard">
        <AuthGuard allowedRoles={["stall_owner"]}>
          <StallDashboard />
        </AuthGuard>
      </Route>
      <Route path="/settings">
        <AuthGuard>
          <DesktopNav />
          <Settings />
        </AuthGuard>
      </Route>
      <Route path="/help-center">
        <AuthGuard>
          <DesktopNav />
          <HelpCenter />
        </AuthGuard>
      </Route>
      <Route path="/terms-policies">
        <AuthGuard>
          <DesktopNav />
          <TermsPolicies />
        </AuthGuard>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function AuthProvider({ children }: { children: React.ReactNode }) {
  const { dispatch } = useStore();
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isAuthComplete, setIsAuthComplete] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // Ensure Firebase auth is ready before proceeding with timeout
          const authPromise = auth.authStateReady();
          const timeoutPromise = new Promise((_, reject) => {
            timeoutId = setTimeout(() => reject(new Error('Auth timeout')), 10000);
          });
          
          await Promise.race([authPromise, timeoutPromise]);
          clearTimeout(timeoutId);
          
          // Get user document from Firestore with retry logic for new Google sign-ins
          let userDoc = await getDocument("users", firebaseUser.uid);
          
          // If document doesn't exist, retry a few times (for new Google sign-in accounts being created)
          if (!userDoc.exists()) {
            console.log("User document not found, retrying in case it's being created...");
            for (let i = 0; i < 3; i++) {
              await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
              userDoc = await getDocument("users", firebaseUser.uid);
              if (userDoc.exists()) {
                console.log(`User document found on retry ${i + 1}`);
                break;
              }
            }
          }
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const userRole = userData.role || 'student';
            const isEmailVerified = firebaseUser.emailVerified || userData.emailVerified || false;
            const isActive = userData.isActive !== undefined ? userData.isActive : true; // Default to true for backward compatibility
            
            // Check if account is deactivated - block authentication completely
            if (isActive === false) {
              console.log("Account is deactivated, signing out:", firebaseUser.email);
              sessionStorage.setItem('loginError', 'Your account has been deactivated by an administrator. Please contact support for assistance.');
              await logOut();
              dispatch({ type: "SET_USER", payload: null });
              window.location.href = "/login";
              return;
            }
            
            // Sync email verification status from Firebase Auth to Firestore if it has changed
            if (userData.emailVerified !== firebaseUser.emailVerified && firebaseUser.emailVerified) {
              console.log("Updating email verification status in Firestore for:", firebaseUser.email);
              const { updateDocument } = await import("./lib/firebase");
              await updateDocument("users", firebaseUser.uid, {
                emailVerified: firebaseUser.emailVerified
              });
            }
            
            // Check email verification for students - block authentication completely
            // But skip this check if we're currently creating an account
            const isCreatingAccount = sessionStorage.getItem('creatingAccount') === 'true';
            if (userRole === "student" && !isEmailVerified && !isCreatingAccount) {
              console.log("Student account not verified, signing out:", firebaseUser.email);
              await logOut();
              dispatch({ type: "SET_USER", payload: null });
              return;
            }
            
            const userPayload = {
              id: firebaseUser.uid,
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              fullName: userData.fullName || '',
              studentId: userData.studentId || null,
              phoneNumber: userData.phoneNumber || null,
              department: userData.department || null,
              yearLevel: userData.yearLevel || null,
              profileCompleted: userData.profileCompleted || false,
              role: userRole,
              loyaltyPoints: userData.loyaltyPoints || 0,
              photoURL: userData.photoURL || firebaseUser.photoURL || null,
              emailVerified: isEmailVerified,
              createdAt: userData.createdAt || new Date(),
            };

            // Set user in store - let the login page handle redirection
            dispatch({
              type: "SET_USER",
              payload: userPayload
            });
            
            console.log("Firebase auth synced for user:", firebaseUser.email);
            console.log("User role detected:", userRole);
            console.log("Firebase current user after sync:", auth.currentUser?.email);
            
            // Mark auth as complete after a small delay
            setTimeout(() => {
              setIsAuthComplete(true);
            }, 200);
          } else {
            console.warn("User document not found in Firestore after retries, signing out");
            // Document still doesn't exist after retries, sign out the user
            await logOut();
            dispatch({ type: "SET_USER", payload: null });
            setIsAuthComplete(true);
          }
        } else {
          // Add a small delay before clearing to prevent race conditions
          setTimeout(() => {
            dispatch({ type: "SET_USER", payload: null });
            setIsAuthComplete(true);
            console.log("No Firebase user found, clearing store");
          }, 1000);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        if (error instanceof Error && error.message === 'Auth timeout') {
          console.warn("Firebase auth took too long, continuing with fallback");
        }
      } finally {
        clearTimeout(timeoutId);
        // Only set loading to false after a minimum delay to ensure loading screen is visible
        setTimeout(() => {
          setIsAuthLoading(false);
        }, 1500);
      }
    });

    return () => {
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, [dispatch]);

  if (isAuthLoading || !isAuthComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#6d031e] via-[#8b0a2e] to-[#a91b42] flex items-center justify-center overflow-hidden">
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
        </div>

        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1.5 h-1.5 bg-white/20 rounded-full"
              initial={{
                x: Math.random() * (typeof window !== "undefined" ? window.innerWidth : 400),
                y: typeof window !== "undefined" ? window.innerHeight + 50 : 700,
                scale: 0,
              }}
              animate={{
                y: -100,
                scale: [0, 1, 0.5, 0],
                opacity: [0, 0.7, 0.3, 0],
              }}
              transition={{
                duration: 3.5 + Math.random() * 2.5,
                repeat: Infinity,
                delay: Math.random() * 2.5,
                ease: "easeOut",
              }}
            />
          ))}
        </div>

        {/* Glass morphism container */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="relative z-10 p-8 backdrop-blur-xl bg-white/10 rounded-3xl border border-white/20 shadow-2xl"
        >
          {/* Logo animation */}
          <motion.div
            initial={{ scale: 0.5, rotate: -180 }}
            animate={{ 
              scale: 1, 
              rotate: 0,
              y: [0, -10, 0],
            }}
            transition={{ 
              duration: 1,
              rotate: { duration: 1 },
              scale: { duration: 1 },
              y: {
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }
            }}
            className="flex justify-center mb-6"
          >
            <img 
              src="/logo.png" 
              alt="UB FoodHub" 
              className="w-20 h-20 object-contain drop-shadow-2xl"
            />
          </motion.div>
          
          {/* Loading text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-2xl font-bold text-white mb-2">Loading your account...</h1>
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-white/70 text-sm"
            >
              Syncing your profile
            </motion.div>
          </motion.div>

          {/* Loading dots */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
            className="flex justify-center space-x-1 mt-6"
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-white/60 rounded-full"
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return children;
}

function App() {
  const [showSplash, setShowSplash] = useState(() => {
    // Check if splash has been shown in this session
    const splashShown = sessionStorage.getItem('splashShown');
    return !splashShown;
  });

  const handleSplashComplete = () => {
    // Mark splash as shown for this session
    sessionStorage.setItem('splashShown', 'true');
    setShowSplash(false);
  };

  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <StoreProvider>
        <AuthProvider>
          <TooltipProvider>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.8, 
                ease: "easeOut",
                // Enhanced mobile transition
                y: { duration: 0.9, ease: [0.23, 1, 0.32, 1] }
              }}
              className="w-full bg-white min-h-screen relative md:max-w-none max-w-md mx-auto md:shadow-none shadow-xl"
            >
              <Toaster />
              <Router />
            </motion.div>
          </TooltipProvider>
        </AuthProvider>
      </StoreProvider>
    </QueryClientProvider>
  );
}

export default App;
