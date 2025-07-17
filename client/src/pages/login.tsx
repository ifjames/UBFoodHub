import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, ArrowLeft, User, Phone, CheckCircle } from "lucide-react";
import { useAuth } from "@/lib/store";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Spinner } from "@/components/ui/spinner";
import campusImage from "@assets/campus.png";
import ubLogo from "@assets/ub foodhub logo2_1751778236646.png";

export default function LoginPage() {
  const [authMode, setAuthMode] = useState<"social" | "email">("social");
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  const [signUpData, setSignUpData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
    studentId: "",
  });

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await signIn(loginData.email, loginData.password);
      toast({
        title: "Welcome back!",
        description: "You've successfully signed in.",
      });
      setLocation("/");
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (signUpData.password !== signUpData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (!signUpData.email.endsWith("@ub.edu.ph")) {
      toast({
        title: "Email Restriction",
        description: "Only @ub.edu.ph email addresses are allowed",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      await signUp(signUpData.email, signUpData.password, {
        name: signUpData.name,
        phoneNumber: signUpData.phoneNumber,
        studentId: signUpData.studentId,
      });
      
      toast({
        title: "Account Created!",
        description: "Please check your email to verify your account.",
      });
      
      setIsSignUp(false);
    } catch (error: any) {
      toast({
        title: "Sign Up Failed",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Mobile Layout (screens smaller than lg)
  const MobileLayout = () => (
    <div className="min-h-screen bg-gradient-to-br from-maroon-800 via-maroon-900 to-red-900 flex flex-col lg:hidden">
      {/* Header with Logo */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 relative min-h-0 bg-[#6d031e] overflow-hidden">
        {/* Campus background image */}
        <div className="absolute inset-0 overflow-hidden">
          <img 
            src={campusImage} 
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

        {authMode === "email" && (
          <Button
            onClick={() => setAuthMode("social")}
            variant="ghost"
            size="sm"
            className="absolute top-4 left-4 text-red-100 hover:text-white hover:bg-white/10 z-10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        )}
        
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
            src={ubLogo} 
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
            {authMode === "email" ? (isSignUp ? "Create Account" : "Welcome Back") : "UB FoodHub"}
          </h2>
          <p className="text-red-100 text-sm">
            {authMode === "email" ? (isSignUp ? "Join UB FoodHub today" : "Sign in to your account") : "Your campus dining companion"}
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
        {authMode === "social" ? (
          <SocialLoginForm onEmailLogin={() => setAuthMode("email")} />
        ) : (
          <EmailLoginForm 
            isSignUp={isSignUp}
            setIsSignUp={setIsSignUp}
            loginData={loginData}
            setLoginData={setLoginData}
            signUpData={signUpData}
            setSignUpData={setSignUpData}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            showConfirmPassword={showConfirmPassword}
            setShowConfirmPassword={setShowConfirmPassword}
            isLoading={isLoading}
            onEmailLogin={handleEmailLogin}
            onSignUp={handleSignUp}
          />
        )}
      </motion.div>
    </div>
  );

  // Desktop Layout (screens lg and above)
  const DesktopLayout = () => (
    <div className="min-h-screen hidden lg:flex">
      {/* Left Side - Campus Image with effects */}
      <div className="flex-1 relative overflow-hidden bg-[#6d031e]">
        <img 
          src={campusImage} 
          alt="University of Batangas Campus" 
          className="w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-[#6d031e]/60"></div>
        
        {/* Liquid glass background effects */}
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

        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(30)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1.5 h-1.5 bg-white/20 rounded-full"
              initial={{
                x: Math.random() * (typeof window !== "undefined" ? window.innerWidth / 2 : 400),
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
        
        {/* Overlay Content with logo */}
        <div className="absolute inset-0 flex flex-col justify-center items-center text-white p-12">
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
            className="w-32 h-32 mb-8 flex items-center justify-center"
          >
            <img 
              src="https://ubianfoodhub.web.app/logo.png" 
              alt="UB FoodHub Logo" 
              className="w-28 h-28 object-contain drop-shadow-2xl"
            />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-5xl font-bold mb-4">Welcome to</h1>
            <h2 className="text-6xl font-bold mb-6 text-yellow-400">UB FoodHub</h2>
            <p className="text-2xl font-light mb-8">Your campus dining companion</p>
            <div className="w-24 h-1 bg-yellow-400 mx-auto"></div>
          </motion.div>
        </div>
      </div>
      
      {/* Right Side - Login Form */}
      <div className="flex-1 bg-white flex items-center justify-center p-12">
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mb-8 text-center"
          >
            <img 
              src="https://ubianfoodhub.web.app/logo.png" 
              alt="UB FoodHub Logo" 
              className="w-20 h-20 object-contain mx-auto mb-6"
            />
            <h2 className="text-3xl font-bold text-[#6d031e] mb-2">
              {authMode === "email" ? (isSignUp ? "Create Account" : "Welcome Back") : "Get Started"}
            </h2>
            <p className="text-gray-600">
              {authMode === "email" ? (isSignUp ? "Join UB FoodHub today" : "Sign in to your account") : "Choose your preferred login method"}
            </p>
          </motion.div>
          
          {authMode === "social" ? (
            <SocialLoginForm onEmailLogin={() => setAuthMode("email")} />
          ) : (
            <div>
              <Button
                onClick={() => setAuthMode("social")}
                variant="ghost"
                className="mb-6 text-[#6d031e] hover:text-[#6d031e] hover:bg-[#6d031e]/10"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to login options
              </Button>
              <EmailLoginForm 
                isSignUp={isSignUp}
                setIsSignUp={setIsSignUp}
                loginData={loginData}
                setLoginData={setLoginData}
                signUpData={signUpData}
                setSignUpData={setSignUpData}
                showPassword={showPassword}
                setShowPassword={setShowPassword}
                showConfirmPassword={showConfirmPassword}
                setShowConfirmPassword={setShowConfirmPassword}
                isLoading={isLoading}
                onEmailLogin={handleEmailLogin}
                onSignUp={handleSignUp}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <MobileLayout />
      <DesktopLayout />
    </>
  );
}

function SocialLoginForm({ onEmailLogin }: { onEmailLogin: () => void }) {
  const { toast } = useToast();
  
  const handleGoogleLogin = async () => {
    try {
      // Import Google sign-in function
      const { signInWithGoogle } = await import("../lib/firebase");
      await signInWithGoogle();
      toast({
        title: "Welcome!",
        description: "You've successfully signed in with Google.",
      });
    } catch (error: any) {
      toast({
        title: "Google Sign-In Failed",
        description: error.message || "Failed to sign in with Google",
        variant: "destructive",
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.4 }}
      className="space-y-4"
    >
      <Button
        onClick={handleGoogleLogin}
        className="w-full text-white py-4 rounded-xl shadow-sm transition-all lg:py-3 lg:text-base bg-blue-600 hover:bg-blue-700"
      >
        <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continue with UB Mail
      </Button>
      
      <Button
        onClick={onEmailLogin}
        className="w-full text-white py-4 rounded-xl shadow-sm transition-all lg:py-3 lg:text-base"
        style={{ backgroundColor: '#6d031e' }}
      >
        <Mail className="w-5 h-5 mr-3" />
        Continue with email
      </Button>
      
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="text-xs text-center mt-8 text-[#6d031e] font-bold lg:text-gray-600"
      >
        By signing up you agree to our Terms and Conditions and Privacy Policy.
      </motion.p>
    </motion.div>
  );
}

function EmailLoginForm({
  isSignUp,
  setIsSignUp,
  loginData,
  setLoginData,
  signUpData,
  setSignUpData,
  showPassword,
  setShowPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  isLoading,
  onEmailLogin,
  onSignUp
}: {
  isSignUp: boolean;
  setIsSignUp: (value: boolean) => void;
  loginData: { email: string; password: string };
  setLoginData: (data: any) => void;
  signUpData: any;
  setSignUpData: (data: any) => void;
  showPassword: boolean;
  setShowPassword: (value: boolean) => void;
  showConfirmPassword: boolean;
  setShowConfirmPassword: (value: boolean) => void;
  isLoading: boolean;
  onEmailLogin: (e: React.FormEvent) => void;
  onSignUp: (e: React.FormEvent) => void;
}) {
  return (
    <div className="w-full max-w-sm mx-auto">
      <AnimatePresence mode="wait">
        {!isSignUp ? (
          <motion.form
            key="signin"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            onSubmit={onEmailLogin}
            className="space-y-4"
          >
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#6d031e] font-medium lg:text-gray-700">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-[#6d031e]/60 lg:text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    className="pl-10 bg-white border-[#6d031e]/20 focus:border-[#6d031e] h-12 text-[#6d031e] placeholder:text-[#6d031e]/40 lg:text-gray-900 lg:placeholder:text-gray-400 lg:border-gray-300 lg:focus:border-[#6d031e]"
                    value={loginData.email}
                    onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-[#6d031e] font-medium lg:text-gray-700">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-[#6d031e]/60 lg:text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className="pl-10 pr-10 bg-white border-[#6d031e]/20 focus:border-[#6d031e] h-12 text-[#6d031e] placeholder:text-[#6d031e]/40 lg:text-gray-900 lg:placeholder:text-gray-400 lg:border-gray-300 lg:focus:border-[#6d031e]"
                    value={loginData.password}
                    onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-[#6d031e]/60 hover:text-[#6d031e] lg:text-gray-400 lg:hover:text-gray-600"
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

            <div className="text-center pt-4">
              <p className="text-[#6d031e] lg:text-gray-600">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => setIsSignUp(true)}
                  className="hover:text-red-700 font-bold text-[#6d031e] transition-colors lg:text-[#6d031e] lg:hover:text-red-700"
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
            onSubmit={onSignUp}
            className="space-y-4"
          >
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-[#6d031e] font-medium lg:text-gray-700">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-[#6d031e]/60 lg:text-gray-400" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    className="pl-10 bg-white border-[#6d031e]/20 focus:border-[#6d031e] h-12 text-[#6d031e] placeholder:text-[#6d031e]/40 lg:text-gray-900 lg:placeholder:text-gray-400 lg:border-gray-300 lg:focus:border-[#6d031e]"
                    value={signUpData.name}
                    onChange={(e) => setSignUpData(prev => ({ ...prev, name: e.target.value }))}
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-email" className="text-[#6d031e] font-medium lg:text-gray-700">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-[#6d031e]/60 lg:text-gray-400" />
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="Enter your @ub.edu.ph email"
                    className="pl-10 bg-white border-[#6d031e]/20 focus:border-[#6d031e] h-12 text-[#6d031e] placeholder:text-[#6d031e]/40 lg:text-gray-900 lg:placeholder:text-gray-400 lg:border-gray-300 lg:focus:border-[#6d031e]"
                    value={signUpData.email}
                    onChange={(e) => setSignUpData(prev => ({ ...prev, email: e.target.value }))}
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="studentId" className="text-[#6d031e] font-medium lg:text-gray-700">Student ID</Label>
                <div className="relative">
                  <CheckCircle className="absolute left-3 top-3 h-4 w-4 text-[#6d031e]/60 lg:text-gray-400" />
                  <Input
                    id="studentId"
                    type="text"
                    placeholder="Enter your student ID"
                    className="pl-10 bg-white border-[#6d031e]/20 focus:border-[#6d031e] h-12 text-[#6d031e] placeholder:text-[#6d031e]/40 lg:text-gray-900 lg:placeholder:text-gray-400 lg:border-gray-300 lg:focus:border-[#6d031e]"
                    value={signUpData.studentId}
                    onChange={(e) => setSignUpData(prev => ({ ...prev, studentId: e.target.value }))}
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber" className="text-[#6d031e] font-medium lg:text-gray-700">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-[#6d031e]/60 lg:text-gray-400" />
                  <Input
                    id="phoneNumber"
                    type="tel"
                    placeholder="Enter your phone number"
                    className="pl-10 bg-white border-[#6d031e]/20 focus:border-[#6d031e] h-12 text-[#6d031e] placeholder:text-[#6d031e]/40 lg:text-gray-900 lg:placeholder:text-gray-400 lg:border-gray-300 lg:focus:border-[#6d031e]"
                    value={signUpData.phoneNumber}
                    onChange={(e) => setSignUpData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="signup-password" className="text-[#6d031e] font-medium lg:text-gray-700">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-[#6d031e]/60 lg:text-gray-400" />
                  <Input
                    id="signup-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    className="pl-10 pr-10 bg-white border-[#6d031e]/20 focus:border-[#6d031e] h-12 text-[#6d031e] placeholder:text-[#6d031e]/40 lg:text-gray-900 lg:placeholder:text-gray-400 lg:border-gray-300 lg:focus:border-[#6d031e]"
                    value={signUpData.password}
                    onChange={(e) => setSignUpData(prev => ({ ...prev, password: e.target.value }))}
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-[#6d031e]/60 hover:text-[#6d031e] lg:text-gray-400 lg:hover:text-gray-600"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-[#6d031e] font-medium lg:text-gray-700">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-[#6d031e]/60 lg:text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    className="pl-10 pr-10 bg-white border-[#6d031e]/20 focus:border-[#6d031e] h-12 text-[#6d031e] placeholder:text-[#6d031e]/40 lg:text-gray-900 lg:placeholder:text-gray-400 lg:border-gray-300 lg:focus:border-[#6d031e]"
                    value={signUpData.confirmPassword}
                    onChange={(e) => setSignUpData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-[#6d031e]/60 hover:text-[#6d031e] lg:text-gray-400 lg:hover:text-gray-600"
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
                  <span>Creating account...</span>
                </div>
              ) : (
                "Create Account"
              )}
            </Button>

            <div className="text-center pt-4">
              <p className="text-[#6d031e] lg:text-gray-600">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setIsSignUp(false)}
                  className="hover:text-red-700 font-bold text-[#6d031e] transition-colors lg:text-[#6d031e] lg:hover:text-red-700"
                  disabled={isLoading}
                >
                  Sign in
                </button>
              </p>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}