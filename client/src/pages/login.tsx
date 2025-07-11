import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useLocation } from "wouter";
import { useStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { User, Mail, Lock, GraduationCap, Eye, EyeOff, Phone } from "lucide-react";
import { signIn, signUp, createDocument, getDocument, onAuthStateChange, signInWithGoogle, sendVerificationEmail, logOut, updateDocument } from "@/lib/firebase";

import { motion, AnimatePresence } from "framer-motion";

export default function Login() {
  const [, setLocation] = useLocation();
  const { state, dispatch } = useStore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [authMode, setAuthMode] = useState<"social" | "email">("social");
  const [isSignUp, setIsSignUp] = useState(false);
  const [waitingForVerification, setWaitingForVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");

  // Login state
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  // Register state
  const [registerData, setRegisterData] = useState({
    email: "",
    password: "",
    fullName: "",
    studentId: "",
    phoneNumber: "",
    agreeToTerms: false,
  });

  // Check for existing user authentication
  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDocument("users", firebaseUser.uid);
          if (userDoc.exists()) {
            const userData = { id: firebaseUser.uid, ...userDoc.data() } as any;
            dispatch({ type: "SET_USER", payload: userData });
            
            const role = userData.role;
            if (role === 'admin') {
              setLocation("/admin");
            } else if (role === 'stall_owner') {
              setLocation("/stall-dashboard");
            } else {
              setLocation("/");
            }
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
    });

    return () => unsubscribe();
  }, [dispatch, setLocation]);

  useEffect(() => {
    if (state.user) {
      const role = state.user.role;
      if (role === 'admin') {
        setLocation("/admin");
      } else if (role === 'stall_owner') {
        setLocation("/stall-dashboard");
      } else {
        setLocation("/");
      }
    }
  }, [state.user, setLocation]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginData.email || !loginData.password) {
      toast({
        title: "Missing Information",
        description: "Please enter both email and password.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const userCredential = await signIn(loginData.email, loginData.password);
      const firebaseUser = userCredential.user;
      
      // Check if email is verified
      if (!firebaseUser.emailVerified) {
        await logOut();
        toast({
          title: "Email Not Verified",
          description: "Please verify your email address before signing in. Check your inbox for the verification link.",
          variant: "destructive",
        });
        return;
      }
      
      const userDoc = await getDocument("users", firebaseUser.uid);
      if (userDoc.exists()) {
        const userData = { id: firebaseUser.uid, ...userDoc.data() } as any;
        dispatch({ type: "SET_USER", payload: userData });
        
        toast({
          title: "Welcome back!",
          description: `Hello, ${userData.fullName}!`,
        });

        const role = userData.role;
        if (role === 'admin') {
          setLocation("/admin");
        } else if (role === 'stall_owner') {
          setLocation("/stall-dashboard");
        } else {
          setLocation("/");
        }
      } else {
        toast({
          title: "Account Setup Required",
          description: "Please complete your account setup.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Login error:", error);
      let errorMessage = "Please check your credentials.";
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = "No account found with this email.";
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = "Incorrect password.";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Invalid email format.";
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = "This account has been disabled.";
      }
      
      toast({
        title: "Login failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all required fields
    if (!registerData.email || !registerData.password || !registerData.fullName || !registerData.studentId || !registerData.phoneNumber) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    // Validate email domain - only UB emails allowed
    const allowedDomains = ['@ub.edu.ph'];
    const emailDomain = registerData.email.substring(registerData.email.lastIndexOf('@'));
    if (!allowedDomains.includes(emailDomain)) {
      toast({
        title: "Invalid Email Domain",
        description: "Only @ub.edu.ph email addresses are allowed.",
        variant: "destructive",
      });
      return;
    }

    // Validate Terms of Service agreement
    if (!registerData.agreeToTerms) {
      toast({
        title: "Terms Required",
        description: "You must agree to the Terms of Service and Privacy Policy.",
        variant: "destructive",
      });
      return;
    }

    // Validate phone number (basic validation)
    const phoneRegex = /^(\+63|0)[0-9]{10}$/;
    if (!phoneRegex.test(registerData.phoneNumber)) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid Philippine phone number (e.g., +639123456789 or 09123456789).",
        variant: "destructive",
      });
      return;
    }

    if (registerData.password.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const userCredential = await signUp(registerData.email, registerData.password);
      const firebaseUser = userCredential.user;
      
      // Send email verification
      await sendVerificationEmail(firebaseUser);
      
      const userData = {
        email: registerData.email,
        fullName: registerData.fullName,
        studentId: registerData.studentId,
        phoneNumber: registerData.phoneNumber,
        role: "student", // Default role, admin can change later
        loyaltyPoints: 0,
        emailVerified: false,
      };
      
      await createDocument("users", firebaseUser.uid, userData);
      
      toast({
        title: "Account Created!",
        description: `A verification email has been sent to ${registerData.email}. Please check your email and click the verification link.`,
      });
      
      // Set waiting for verification state
      setWaitingForVerification(true);
      setVerificationEmail(registerData.email);
      
      // Start checking for email verification
      checkEmailVerification(firebaseUser);
      
    } catch (error: any) {
      console.error("Registration error:", error);
      let errorMessage = "Please try again.";
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "An account with this email already exists.";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Invalid email format.";
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "Password is too weak.";
      }
      
      toast({
        title: "Registration failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkEmailVerification = async (user: any) => {
    const checkInterval = setInterval(async () => {
      try {
        await user.reload();
        if (user.emailVerified) {
          clearInterval(checkInterval);
          setWaitingForVerification(false);
          
          // Update user document with verified status
          const userData = {
            email: user.email,
            fullName: user.displayName || registerData.fullName,
            studentId: registerData.studentId,
            phoneNumber: registerData.phoneNumber,
            role: "student",
            loyaltyPoints: 0,
            emailVerified: true,
          };
          
          await updateDocument("users", user.uid, userData);
          dispatch({ type: "SET_USER", payload: { id: user.uid, ...userData } });
          
          toast({
            title: "Email Verified!",
            description: "Your account has been verified successfully. Welcome to UB FoodHub!",
          });
          
          setLocation("/");
        }
      } catch (error) {
        console.error("Error checking verification:", error);
      }
    }, 3000); // Check every 3 seconds

    // Stop checking after 10 minutes
    setTimeout(() => {
      clearInterval(checkInterval);
      if (waitingForVerification) {
        setWaitingForVerification(false);
        toast({
          title: "Verification Timeout",
          description: "Please try signing in again after verifying your email.",
          variant: "destructive",
        });
        setAuthMode("social");
      }
    }, 600000); // 10 minutes
  };

  // Show verification waiting screen
  if (waitingForVerification) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-maroon-800 via-maroon-900 to-red-900 flex flex-col items-center justify-center px-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="bg-white rounded-2xl p-8 shadow-2xl max-w-md w-full text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 mx-auto mb-4"
          >
            <img src="/logo.png" alt="UB FoodHub" className="w-full h-full object-contain" />
          </motion.div>
          
          <h2 className="text-xl font-bold text-[#6d031e] mb-2">Waiting for Email Verification</h2>
          <p className="text-gray-600 mb-4">
            We've sent a verification email to:
          </p>
          <p className="font-semibold text-[#6d031e] mb-6">{verificationEmail}</p>
          
          <div className="bg-[#6d031e]/5 p-4 rounded-lg mb-6">
            <p className="text-sm text-gray-700">
              <strong>Instructions:</strong>
              <br />1. Check your email inbox
              <br />2. Click the verification link
              <br />3. This screen will automatically update
            </p>
          </div>
          
          <div className="flex items-center justify-center space-x-2 text-[#6d031e]">
            <div className="w-2 h-2 bg-[#6d031e] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-[#6d031e] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-[#6d031e] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
          
          <button
            onClick={() => {
              setWaitingForVerification(false);
              setAuthMode("social");
            }}
            className="mt-6 text-sm text-gray-500 hover:text-[#6d031e] underline"
          >
            Cancel and return to login
          </button>
        </motion.div>
      </div>
    );
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    
    try {
      const result = await signInWithGoogle();
      const firebaseUser = result.user;
      
      // Check if user exists in Firestore
      const userDoc = await getDocument("users", firebaseUser.uid);
      
      if (userDoc.exists()) {
        // Existing user - login
        const userData = { id: firebaseUser.uid, ...userDoc.data() } as any;
        dispatch({ type: "SET_USER", payload: userData });
        
        toast({
          title: "Welcome back!",
          description: `Hello ${userData.fullName || firebaseUser.displayName}!`,
        });
        
        const role = userData.role;
        if (role === 'admin') {
          setLocation("/admin");
        } else if (role === 'stall_owner') {
          setLocation("/stall-dashboard");
        } else {
          setLocation("/");
        }
      } else {
        // New user - create account with default student role
        const email = firebaseUser.email || "";
        
        // Create account with default student role - they need to complete profile
        const userData = {
          email: email,
          fullName: firebaseUser.displayName || "",
          studentId: "", // Required - will need to be completed
          phoneNumber: "", // Required - will need to be completed  
          role: "student",
          emailVerified: firebaseUser.emailVerified,
          profileComplete: false, // Flag to indicate profile needs completion
        };
        
        await createDocument("users", firebaseUser.uid, userData);
        
        dispatch({ type: "SET_USER", payload: { id: firebaseUser.uid, ...userData } });
        
        toast({
          title: "Account created!",
          description: `Welcome to UB FoodHub! Please complete your profile with Student ID and phone number.`,
        });
        
        // Redirect to profile completion or home
        setLocation("/");
      }
    } catch (error: any) {
      console.error("Google sign-in error:", error);
      let errorMessage = "Please try again.";
      
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = "Sign-in was cancelled.";
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = "Popup was blocked. Please allow popups and try again.";
      } else if (error.code === 'auth/cancelled-popup-request') {
        errorMessage = "Only one sign-in request at a time.";
      } else if (error.message && error.message.includes("@ub.edu.ph")) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Sign-in failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (authMode === "social") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-maroon-800 via-maroon-900 to-red-900 flex flex-col">
        {/* Hero Section with Logo and Illustration */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 relative min-h-0 bg-[#6d031e] overflow-hidden">
          {/* Campus background image */}
          <div className="absolute inset-0 overflow-hidden">
            <img 
              src="/campus-bg.png" 
              alt="Campus Background" 
              className="w-full h-full object-cover opacity-15"
            />
            <div className="absolute inset-0 bg-[#6d031e]/60"></div>
          </div>
          
          {/* Liquid glass background effect */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/3 backdrop-blur-sm"></div>
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 360],
                opacity: [0.1, 0.3, 0.1],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "linear",
              }}
              className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-pink-500/10 via-purple-500/10 to-blue-500/10 rounded-full blur-3xl"
            />
            <motion.div
              animate={{
                scale: [1.1, 1, 1.1],
                rotate: [360, 0],
                opacity: [0.2, 0.1, 0.2],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "linear",
              }}
              className="absolute bottom-0 right-0 w-3/4 h-3/4 bg-gradient-to-tl from-red-500/10 via-orange-500/10 to-yellow-500/10 rounded-full blur-2xl"
            />
          </div>

          {/* Floating particles from bottom */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(25)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1.5 h-1.5 bg-white/25 rounded-full"
                initial={{
                  x: Math.random() * (typeof window !== "undefined" ? window.innerWidth : 400),
                  y: typeof window !== "undefined" ? window.innerHeight + 50 : 700,
                  scale: 0,
                }}
                animate={{
                  y: -100,
                  scale: [0, 1, 0.5, 0],
                  opacity: [0, 0.8, 0.3, 0],
                }}
                transition={{
                  duration: 4 + Math.random() * 3,
                  repeat: Infinity,
                  delay: Math.random() * 3,
                  ease: "easeOut",
                }}
              />
            ))}
          </div>

          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ 
              scale: 1, 
              rotate: 0,
              y: [0, -10, 0],
            }}
            transition={{ 
              delay: 0.3, 
              duration: 0.6, 
              type: "spring",
              y: {
                duration: 1,
                repeat: Infinity,
                ease: "easeInOut",
              }
            }}
            className="w-24 h-24 mb-6 relative z-10"
          >
            <img 
              src="/logo.png" 
              alt="UB FoodHub Logo" 
              className="w-full h-full object-contain drop-shadow-2xl"
            />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="text-center mb-8 relative z-20"
          >
            <h1 className="text-3xl font-bold text-white mb-2">UB FoodHub</h1>
            <p className="text-red-100 text-lg font-medium">Your campus dining companion</p>
          </motion.div>
        </div>
        {/* Bottom Sign-in Card */}
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="bg-maroon-900/50 backdrop-blur-sm border-t border-red-700/30 rounded-t-3xl px-6 py-6 shadow-2xl max-h-[60vh] overflow-y-auto"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-bold mb-2 text-[#6d031e]">Sign up or log in</h2>
            <p className="text-[#ae0a33] font-normal">Select your preferred method to continue</p>
          </motion.div>

          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.5 }}
            >
              <Button
                onClick={handleGoogleSignIn}
                className="w-full bg-white/90 border border-red-300/50 text-gray-800 hover:bg-white py-4 rounded-xl shadow-sm transition-all"
                disabled={isLoading}
              >
                <img 
                  src="/UBlogo.png" 
                  alt="UB Logo" 
                  className="w-5 h-5 mr-3 object-contain"
                />
                Continue with UB Mail
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 0.5 }}
            >
              <Button
                onClick={() => setAuthMode("email")}
                className="w-full text-white py-4 rounded-xl shadow-sm transition-all"
                style={{ backgroundColor: '#6d031e' }}
                disabled={isLoading}
              >
                <Mail className="w-5 h-5 mr-3" />
                Continue with email
              </Button>
            </motion.div>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4, duration: 0.5 }}
            className="text-xs text-center mt-8 text-[#6d031e] font-bold"
          >
            By signing up you agree to our Terms and Conditions and Privacy Policy.
          </motion.p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-maroon-800 via-maroon-900 to-red-900 flex flex-col">
      {/* Header with Logo */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 relative min-h-0 bg-[#6d031e] overflow-hidden">
        {/* Campus background image */}
        <div className="absolute inset-0 overflow-hidden">
          <img 
            src="/campus-bg.png" 
            alt="Campus Background" 
            className="w-full h-full object-cover opacity-15"
          />
          <div className="absolute inset-0 bg-[#6d031e]/60"></div>
        </div>
        
        {/* Liquid glass background effect */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/3 backdrop-blur-sm"></div>
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 360],
              opacity: [0.1, 0.25, 0.1],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-pink-500/8 via-purple-500/8 to-blue-500/8 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1.1, 1, 1.1],
              rotate: [360, 0],
              opacity: [0.15, 0.05, 0.15],
            }}
            transition={{
              duration: 7,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute bottom-0 right-0 w-3/4 h-3/4 bg-gradient-to-tl from-red-500/8 via-orange-500/8 to-yellow-500/8 rounded-full blur-2xl"
          />
        </div>

        {/* Floating particles from bottom */}
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

        <Button
          onClick={() => setAuthMode("social")}
          variant="ghost"
          size="sm"
          className="absolute top-4 left-4 text-red-100 hover:text-white hover:bg-white/10 z-10"
        >
          ← Back
        </Button>
        
        <motion.div
          initial={{ scale: 0 }}
          animate={{ 
            scale: 1,
            y: [0, -8, 0],
          }}
          transition={{ 
            delay: 0.2, 
            duration: 0.3,
            y: {
              duration: 1.2,
              repeat: Infinity,
              ease: "easeInOut",
            }
          }}
          className="w-28 h-28 mx-auto mb-4 flex items-center justify-center relative z-10"
        >
          <img 
            src="/logo.png" 
            alt="UB FoodHub Logo" 
            className="w-24 h-24 object-contain"
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.3 }}
          className="text-center relative z-20"
        >
          <h2 className="text-xl font-bold text-white mb-2">
            {isSignUp ? "Create Account" : "Welcome Back"}
          </h2>
          <p className="text-red-100 text-sm">
            {isSignUp ? "Join UB FoodHub today" : "Sign in to your account"}
          </p>
        </motion.div>
      </div>
      {/* Bottom Form Card */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="bg-maroon-900/50 backdrop-blur-sm border-t border-red-700/30 rounded-t-3xl px-6 py-6 shadow-2xl max-h-[65vh] overflow-y-auto"
      >
        <AnimatePresence mode="wait">
          {!isSignUp ? (
            <motion.form
              key="signin"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleEmailLogin}
              className="space-y-4"
            >
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[#6d031e] font-medium">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-[#6d031e]/60" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      className="pl-10 bg-white border-[#6d031e]/20 focus:border-[#6d031e] h-12 text-[#6d031e] placeholder:text-[#6d031e]/40"
                      value={loginData.email}
                      onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-[#6d031e] font-medium">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-[#6d031e]/60" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      className="pl-10 pr-10 bg-white border-[#6d031e]/20 focus:border-[#6d031e] h-12 text-[#6d031e] placeholder:text-[#6d031e]/40"
                      value={loginData.password}
                      onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                      required
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-[#6d031e]/60 hover:text-[#6d031e]"
                      disabled={isLoading}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full text-white h-12 rounded-xl font-medium"
                style={{ backgroundColor: '#6d031e' }}
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <Spinner size="sm" />
                    <span>Signing in...</span>
                  </div>
                ) : (
                  "Sign In"
                )}
              </Button>

              <div className="text-center pt-2">
                <p className="text-[#6d031e] font-normal">
                  No account?{" "}
                  <button
                    type="button"
                    onClick={() => setIsSignUp(true)}
                    className="hover:text-red-700 font-bold text-[#6d031e] transition-colors"
                    disabled={isLoading}
                  >
                    Sign up
                  </button>
                </p>
              </div>
            </motion.form>
          ) : (
            <motion.form
              key="signup"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={handleEmailRegister}
              className="space-y-4"
            >
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="font-medium" style={{ color: '#6d031e' }}>Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-[#6d031e]/60" />
                    <Input
                      id="fullName"
                      placeholder="Enter your full name"
                      className="pl-10 bg-white border-[#6d031e]/20 focus:border-[#6d031e] py-3 text-[#6d031e] placeholder:text-[#6d031e]/40"
                      value={registerData.fullName}
                      onChange={(e) => setRegisterData(prev => ({ ...prev, fullName: e.target.value }))}
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="registerEmail" className="text-[#6d031e] font-medium">Email *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-[#6d031e]/60" />
                    <Input
                      id="registerEmail"
                      type="email"
                      placeholder="user@ub.edu.ph"
                      className="pl-10 bg-white border-[#6d031e]/20 focus:border-[#6d031e] py-3 text-[#6d031e] placeholder:text-[#6d031e]/40"
                      value={registerData.email}
                      onChange={(e) => setRegisterData(prev => ({ ...prev, email: e.target.value }))}
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="registerPassword" className="text-[#6d031e] font-medium">Password *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-[#6d031e]/60" />
                    <Input
                      id="registerPassword"
                      type={showRegisterPassword ? "text" : "password"}
                      placeholder="Create a password (min. 6 characters)"
                      className="pl-10 pr-10 bg-white border-[#6d031e]/20 focus:border-[#6d031e] py-3 text-[#6d031e] placeholder:text-[#6d031e]/40"
                      value={registerData.password}
                      onChange={(e) => setRegisterData(prev => ({ ...prev, password: e.target.value }))}
                      required
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                      className="absolute right-3 top-3 text-[#6d031e]/60 hover:text-[#6d031e]"
                      disabled={isLoading}
                    >
                      {showRegisterPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="studentId" className="text-[#6d031e] font-medium">Student ID *</Label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-3 h-4 w-4 text-[#6d031e]/60" />
                    <Input
                      id="studentId"
                      placeholder="Enter your student ID"
                      className="pl-10 bg-white border-[#6d031e]/20 focus:border-[#6d031e] py-3 text-[#6d031e] placeholder:text-[#6d031e]/40"
                      value={registerData.studentId}
                      onChange={(e) => setRegisterData(prev => ({ ...prev, studentId: e.target.value }))}
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber" className="text-[#6d031e] font-medium">Phone Number *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-[#6d031e]/60" />
                    <Input
                      id="phoneNumber"
                      type="tel"
                      placeholder="+639123456789 or 09123456789"
                      className="pl-10 bg-white border-[#6d031e]/20 focus:border-[#6d031e] py-3 text-[#6d031e] placeholder:text-[#6d031e]/40"
                      value={registerData.phoneNumber}
                      onChange={(e) => setRegisterData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>
                
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="agreeToTerms"
                    checked={registerData.agreeToTerms}
                    onCheckedChange={(checked) => setRegisterData(prev => ({ ...prev, agreeToTerms: checked === true }))}
                    disabled={isLoading}
                    className="border-[#6d031e]/30 data-[state=checked]:bg-[#6d031e] data-[state=checked]:border-[#6d031e]"
                  />
                  <Label htmlFor="agreeToTerms" className="text-sm text-[#6d031e] leading-none">
                    I agree to the{" "}
                    <Dialog>
                      <DialogTrigger asChild>
                        <button
                          type="button"
                          className="underline hover:text-red-700 font-semibold"
                        >
                          Terms of Service
                        </button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Terms of Service</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <h3 className="font-semibold text-gray-800 mb-2">1. Acceptance of Terms</h3>
                            <p className="text-gray-600 text-sm leading-relaxed">
                              By using UB FoodHub, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
                            </p>
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-800 mb-2">2. Service Description</h3>
                            <p className="text-gray-600 text-sm leading-relaxed">
                              UB FoodHub is a food ordering platform designed for University of Batangas students, faculty, and staff to order food from campus canteen stalls.
                            </p>
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-800 mb-2">3. User Responsibilities</h3>
                            <p className="text-gray-600 text-sm leading-relaxed">
                              Users are responsible for providing accurate information, maintaining the security of their accounts, and using the service in accordance with university policies.
                            </p>
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-800 mb-2">4. Order Policies</h3>
                            <p className="text-gray-600 text-sm leading-relaxed">
                              Orders are subject to availability and stall operating hours. Cancellation policies vary by stall. Users must show valid QR codes for order pickup.
                            </p>
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-800 mb-2">5. Payment Terms</h3>
                            <p className="text-gray-600 text-sm leading-relaxed">
                              Currently, cash payments are accepted upon pickup. Digital payment options may be introduced in the future with additional terms.
                            </p>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    {" "}and{" "}
                    <Dialog>
                      <DialogTrigger asChild>
                        <button
                          type="button"
                          className="underline hover:text-red-700 font-semibold"
                        >
                          Privacy Policy
                        </button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Privacy Policy</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <h3 className="font-semibold text-gray-800 mb-2">Information We Collect</h3>
                            <p className="text-gray-600 text-sm leading-relaxed">
                              We collect information you provide directly to us, such as your name, email address, student ID, and order history. We also collect usage information to improve our services.
                            </p>
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-800 mb-2">How We Use Your Information</h3>
                            <p className="text-gray-600 text-sm leading-relaxed">
                              Your information is used to process orders, communicate with you about your orders, improve our services, and ensure compliance with university policies.
                            </p>
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-800 mb-2">Information Sharing</h3>
                            <p className="text-gray-600 text-sm leading-relaxed">
                              We share order information with relevant stall owners to fulfill your orders. We do not sell or rent your personal information to third parties.
                            </p>
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-800 mb-2">Data Security</h3>
                            <p className="text-gray-600 text-sm leading-relaxed">
                              We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
                            </p>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    {" *"}
                  </Label>
                </div>
                

              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-[#6d031e] hover:bg-red-700 text-white py-4 rounded-xl text-lg font-medium"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <Spinner size="sm" />
                    <span>Creating account...</span>
                  </div>
                ) : (
                  "Create Account"
                )}
              </Button>

              <div className="text-center pt-4">
                <p className="text-[#6d031e]">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setIsSignUp(false)}
                    className="hover:text-red-700 font-bold text-[#6d031e] transition-colors"
                    disabled={isLoading}
                  >
                    Sign in
                  </button>
                </p>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}