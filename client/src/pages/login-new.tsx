import { useState, FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Lock, Mail, User, Phone, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { TermsDialog } from "@/components/TermsDialog";

export default function LoginPage() {
  const { signIn, signUp } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Simple state management without dependencies
  const [authMode, setAuthMode] = useState<"social" | "email">("social");
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Login form fields
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
  // Signup form fields
  const [signUpName, setSignUpName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [studentId, setStudentId] = useState("");
  
  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showTermsDialog, setShowTermsDialog] = useState(false);
  const [showPrivacyDialog, setShowPrivacyDialog] = useState(false);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signIn(loginEmail, loginPassword);
      console.log("Login result:", result);
      console.log("User role:", result.role);
      
      toast({
        title: "Welcome back!",
        description: "You've successfully signed in.",
      });
      
      // Add a small delay to ensure state updates
      setTimeout(() => {
        if (result.role === "admin") {
          console.log("Redirecting to admin dashboard");
          setLocation("/admin");
        } else if (result.role === "stall_owner") {
          console.log("Redirecting to stall dashboard");
          setLocation("/stall-dashboard");
        } else {
          console.log("Redirecting to home");
          setLocation("/");
        }
      }, 100);
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

  const handleSignUp = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!agreedToTerms) {
      toast({
        title: "Terms Agreement Required",
        description: "You must agree to the Terms of Service and Privacy Policy to create an account",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (signUpPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (!signUpEmail.endsWith("@ub.edu.ph")) {
      toast({
        title: "Email Restriction",
        description: "Only @ub.edu.ph email addresses are allowed",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      await signUp(signUpEmail, signUpPassword, {
        name: signUpName,
        phoneNumber,
        studentId,
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

  const handleGoogleAuth = () => {
    console.log("Google auth clicked");
  };

  if (authMode === "social") {
    return (
      <div className="min-h-screen flex relative overflow-hidden">
        {/* Desktop Left Panel */}
        <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-[#6d031e] via-[#8b0420] to-[#4a0115] items-center justify-center p-8">
          <div className="absolute inset-0 bg-black/20"></div>
          
          {/* Floating Particles */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-white/10 rounded-full animate-float"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`,
                  animationDuration: `${3 + Math.random() * 4}s`,
                }}
              ></div>
            ))}
          </div>
          
          {/* Content */}
          <div className="relative z-10 text-center text-white">
            <div className="mb-8">
              <img
                src="/logo.png"
                alt="UB FoodHub"
                className="w-32 h-32 mx-auto mb-4 animate-bounce-gentle animate-glow"
              />
            </div>
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white to-red-200 bg-clip-text text-transparent">
              UB FoodHub
            </h1>
            <p className="text-xl text-red-100 mb-6">
              Your Campus Food Ordering Solution
            </p>
            <div className="backdrop-blur-sm bg-white/10 rounded-2xl p-6 border border-white/20">
              <p className="text-red-50">
                Order from your favorite campus restaurants, skip the lines, and enjoy seamless pickup with QR codes.
              </p>
            </div>
          </div>
        </div>

        {/* Mobile/Desktop Right Panel */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gradient-to-br from-[#6d031e] via-[#8b0420] to-[#4a0115] lg:bg-white lg:bg-gradient-to-br lg:from-gray-50 lg:to-white">
          <div className="w-full max-w-md space-y-8">
            {/* Mobile Logo */}
            <div className="text-center lg:hidden">
              <img
                src="/logo.png"
                alt="UB FoodHub"
                className="w-24 h-24 mx-auto mb-4"
              />
              <h1 className="text-2xl font-bold text-white mb-2">UB FoodHub</h1>
              <p className="text-red-100 text-sm">Campus Food Ordering</p>
            </div>

            {/* Login Form Container */}
            <div className="backdrop-blur-sm bg-white/95 lg:bg-white rounded-2xl p-8 shadow-2xl border border-white/20 lg:border-gray-200">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-[#6d031e] lg:text-gray-900 mb-2">
                  Welcome to UB FoodHub
                </h2>
                <p className="text-[#6d031e]/70 lg:text-gray-600">
                  Sign in to start ordering
                </p>
              </div>

              <div className="space-y-4">
                <button
                  onClick={handleGoogleAuth}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center space-x-3 bg-[#6d031e] hover:bg-[#5a0219] text-white py-3 px-4 rounded-xl font-medium transition-colors h-12 disabled:opacity-50"
                >
                  <img
                    src="/UBlogo.png"
                    alt="UB"
                    className="w-5 h-5"
                  />
                  <span>Continue with UB Mail</span>
                </button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#6d031e]/20 lg:border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-[#6d031e]/60 lg:text-gray-500">Or</span>
                  </div>
                </div>

                <button
                  onClick={() => setAuthMode("email")}
                  disabled={isLoading}
                  className="w-full bg-white border border-[#6d031e]/30 lg:border-gray-300 text-[#6d031e] lg:text-gray-700 hover:bg-[#6d031e]/5 lg:hover:bg-gray-50 py-3 px-4 rounded-xl font-medium transition-colors h-12 disabled:opacity-50"
                >
                  Sign in with Email
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* Desktop Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-[#6d031e] via-[#8b0420] to-[#4a0115] items-center justify-center p-8">
        <div className="absolute inset-0 bg-black/20"></div>
        
        {/* Floating Particles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white/10 rounded-full animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 4}s`,
              }}
            ></div>
          ))}
        </div>
        
        {/* Content */}
        <div className="relative z-10 text-center text-white">
          <div className="mb-8">
            <img
              src="/logo.png"
              alt="UB FoodHub"
              className="w-32 h-32 mx-auto mb-4 animate-bounce-gentle animate-glow"
            />
          </div>
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white to-red-200 bg-clip-text text-transparent">
            UB FoodHub
          </h1>
          <p className="text-xl text-red-100 mb-6">
            Your Campus Food Ordering Solution
          </p>
          <div className="backdrop-blur-sm bg-white/10 rounded-2xl p-6 border border-white/20">
            <p className="text-red-50">
              Order from your favorite campus restaurants, skip the lines, and enjoy seamless pickup with QR codes.
            </p>
          </div>
        </div>
      </div>

      {/* Mobile/Desktop Right Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gradient-to-br from-[#6d031e] via-[#8b0420] to-[#4a0115] lg:bg-white lg:bg-gradient-to-br lg:from-gray-50 lg:to-white">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="text-center lg:hidden">
            <img
              src="/logo.png"
              alt="UB FoodHub"
              className="w-24 h-24 mx-auto mb-4"
            />
            <h1 className="text-2xl font-bold text-white mb-2">UB FoodHub</h1>
            <p className="text-red-100 text-sm">Campus Food Ordering</p>
          </div>

          {/* Login Form Container */}
          <div className="backdrop-blur-sm bg-white/95 lg:bg-white rounded-2xl p-8 shadow-2xl border border-white/20 lg:border-gray-200">
            <div className="text-center mb-8">
              <button
                onClick={() => setAuthMode("social")}
                className="text-[#6d031e] hover:text-red-700 mb-4 text-sm font-medium"
                disabled={isLoading}
              >
                ← Back to login options
              </button>
              <h2 className="text-2xl font-bold text-[#6d031e] lg:text-gray-900 mb-2">
                {isSignUp ? "Create Account" : "Sign In"}
              </h2>
              <p className="text-[#6d031e]/70 lg:text-gray-600">
                {isSignUp ? "Join UB FoodHub community" : "Welcome back to UB FoodHub"}
              </p>
            </div>

            <AnimatePresence mode="wait">
              {!isSignUp ? (
                <motion.form
                  key="login"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleLogin}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-[#6d031e] font-medium lg:text-gray-700">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-[#6d031e]/60 lg:text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your @ub.edu.ph email"
                        className="pl-10 bg-white border-[#6d031e]/20 focus:border-[#6d031e] h-12 text-[#6d031e] placeholder:text-[#6d031e]/40 lg:text-gray-900 lg:placeholder:text-gray-400 lg:border-gray-300 lg:focus:border-[#6d031e]"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
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
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
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

                  <Button 
                    type="submit" 
                    className="w-full text-white h-12 rounded-xl font-medium"
                    style={{ backgroundColor: '#6d031e' }}
                    disabled={isLoading}
                  >
                    {isLoading ? "Signing in..." : "Sign In"}
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
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleSignUp}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="signup-name" className="text-[#6d031e] font-medium lg:text-gray-700">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-[#6d031e]/60 lg:text-gray-400" />
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="Enter your full name"
                        className="pl-10 bg-white border-[#6d031e]/20 focus:border-[#6d031e] h-12 text-[#6d031e] placeholder:text-[#6d031e]/40 lg:text-gray-900 lg:placeholder:text-gray-400 lg:border-gray-300 lg:focus:border-[#6d031e]"
                        value={signUpName}
                        onChange={(e) => setSignUpName(e.target.value)}
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-[#6d031e] font-medium lg:text-gray-700">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-[#6d031e]/60 lg:text-gray-400" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="Enter your @ub.edu.ph email"
                        className="pl-10 bg-white border-[#6d031e]/20 focus:border-[#6d031e] h-12 text-[#6d031e] placeholder:text-[#6d031e]/40 lg:text-gray-900 lg:placeholder:text-gray-400 lg:border-gray-300 lg:focus:border-[#6d031e]"
                        value={signUpEmail}
                        onChange={(e) => setSignUpEmail(e.target.value)}
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-student-id" className="text-[#6d031e] font-medium lg:text-gray-700">Student ID</Label>
                    <div className="relative">
                      <GraduationCap className="absolute left-3 top-3 h-4 w-4 text-[#6d031e]/60 lg:text-gray-400" />
                      <Input
                        id="signup-student-id"
                        type="text"
                        placeholder="Enter your student ID"
                        className="pl-10 bg-white border-[#6d031e]/20 focus:border-[#6d031e] h-12 text-[#6d031e] placeholder:text-[#6d031e]/40 lg:text-gray-900 lg:placeholder:text-gray-400 lg:border-gray-300 lg:focus:border-[#6d031e]"
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-phone" className="text-[#6d031e] font-medium lg:text-gray-700">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-[#6d031e]/60 lg:text-gray-400" />
                      <Input
                        id="signup-phone"
                        type="tel"
                        placeholder="Enter your phone number"
                        className="pl-10 bg-white border-[#6d031e]/20 focus:border-[#6d031e] h-12 text-[#6d031e] placeholder:text-[#6d031e]/40 lg:text-gray-900 lg:placeholder:text-gray-400 lg:border-gray-300 lg:focus:border-[#6d031e]"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
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
                        value={signUpPassword}
                        onChange={(e) => setSignUpPassword(e.target.value)}
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
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
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
                  
                  <div className="flex items-start space-x-2 mt-4">
                    <input
                      type="checkbox"
                      id="terms-signup"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="mt-1 w-4 h-4 accent-[#6d031e]"
                      disabled={isLoading}
                    />
                    <label 
                      htmlFor="terms-signup" 
                      className="text-xs text-[#6d031e] font-medium lg:text-gray-700 cursor-pointer"
                    >
                      I agree to the{" "}
                      <button
                        type="button"
                        onClick={() => setShowTermsDialog(true)}
                        className="text-[#6d031e] hover:text-red-700 underline font-semibold"
                        disabled={isLoading}
                      >
                        Terms of Service
                      </button>
                      {" "}and{" "}
                      <button
                        type="button"
                        onClick={() => setShowPrivacyDialog(true)}
                        className="text-[#6d031e] hover:text-red-700 underline font-semibold"
                        disabled={isLoading}
                      >
                        Privacy Policy
                      </button>
                    </label>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full text-white h-12 rounded-xl font-medium"
                    style={{ backgroundColor: '#6d031e' }}
                    disabled={isLoading || !agreedToTerms}
                  >
                    {isLoading ? "Creating account..." : "Create Account"}
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
        </div>
      </div>

      {/* Terms Dialogs */}
      <TermsDialog 
        isOpen={showTermsDialog} 
        onClose={() => setShowTermsDialog(false)} 
        type="terms"
      />
      <TermsDialog 
        isOpen={showPrivacyDialog} 
        onClose={() => setShowPrivacyDialog(false)} 
        type="privacy"
      />
    </div>
  );
}