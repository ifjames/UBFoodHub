import { useState, FormEvent } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, Lock, Mail, User, Phone, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { TermsDialog } from "./TermsDialog";

interface IsolatedLoginFormProps {
  isSignUp: boolean;
  onToggleMode: (isSignUp: boolean) => void;
  onGoogleAuth: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export function IsolatedLoginForm({ 
  isSignUp, 
  onToggleMode, 
  onGoogleAuth, 
  isLoading, 
  setIsLoading 
}: IsolatedLoginFormProps) {
  const { signIn, signUp } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Form state - isolated from parent
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
  const [signUpName, setSignUpName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [studentId, setStudentId] = useState("");
  
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
      toast({
        title: "Welcome back!",
        description: "You've successfully signed in.",
      });
      
      if (result.role === "admin") {
        setLocation("/admin");
      } else if (result.role === "stall_owner") {
        setLocation("/stall-dashboard");
      } else {
        setLocation("/");
      }
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

    // Validate Student ID - exactly 7 numbers only
    const studentIdPattern = /^\d{7}$/;
    if (!studentIdPattern.test(studentId)) {
      toast({
        title: "Invalid Student ID",
        description: "Student ID must be exactly 7 numbers (e.g., 1234567)",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // Validate Philippine phone number format
    const phonePattern = /^\+63\s9\d{2}\s\d{3}\s\d{4}$/;
    if (!phonePattern.test(phoneNumber)) {
      toast({
        title: "Invalid Phone Number",
        description: "Phone number must be in format: +63 9XX XXX XXXX (e.g., +63 960 381 8382)",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // Basic abuse prevention - check password strength
    if (signUpPassword.length < 8) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 8 characters long",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // Check for common weak passwords
    const commonPasswords = ['password', '12345678', 'qwerty123', 'admin123', 'student123'];
    if (commonPasswords.includes(signUpPassword.toLowerCase())) {
      toast({
        title: "Weak Password",
        description: "Please choose a stronger password that's not commonly used",
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
      
      onToggleMode(false);
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

  if (isSignUp) {
    return (
      <>
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
                placeholder="1234567 (7 numbers only)"
                className="pl-10 bg-white border-[#6d031e]/20 focus:border-[#6d031e] h-12 text-[#6d031e] placeholder:text-[#6d031e]/40 lg:text-gray-900 lg:placeholder:text-gray-400 lg:border-gray-300 lg:focus:border-[#6d031e]"
                value={studentId}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 7);
                  setStudentId(value);
                }}
                maxLength={7}
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
                placeholder="+63 960 381 8382"
                className="pl-10 bg-white border-[#6d031e]/20 focus:border-[#6d031e] h-12 text-[#6d031e] placeholder:text-[#6d031e]/40 lg:text-gray-900 lg:placeholder:text-gray-400 lg:border-gray-300 lg:focus:border-[#6d031e]"
                value={phoneNumber}
                onChange={(e) => {
                  let value = e.target.value;
                  // Remove all non-digits first
                  const digits = value.replace(/\D/g, '');
                  
                  if (digits.length === 0) {
                    setPhoneNumber('');
                    return;
                  }
                  
                  // Auto-format Philippine number
                  if (digits.startsWith('63')) {
                    // Format: +63 9XX XXX XXXX
                    const formatted = digits.slice(0, 13);
                    if (formatted.length <= 2) {
                      setPhoneNumber(`+${formatted}`);
                    } else if (formatted.length <= 5) {
                      setPhoneNumber(`+63 ${formatted.slice(2)}`);
                    } else if (formatted.length <= 8) {
                      setPhoneNumber(`+63 ${formatted.slice(2, 5)} ${formatted.slice(5)}`);
                    } else {
                      setPhoneNumber(`+63 ${formatted.slice(2, 5)} ${formatted.slice(5, 8)} ${formatted.slice(8)}`);
                    }
                  } else if (digits.startsWith('9') && digits.length >= 1) {
                    // Auto-prepend +63 for numbers starting with 9
                    const formatted = ('63' + digits).slice(0, 13);
                    if (formatted.length <= 5) {
                      setPhoneNumber(`+63 ${formatted.slice(2)}`);
                    } else if (formatted.length <= 8) {
                      setPhoneNumber(`+63 ${formatted.slice(2, 5)} ${formatted.slice(5)}`);
                    } else {
                      setPhoneNumber(`+63 ${formatted.slice(2, 5)} ${formatted.slice(5, 8)} ${formatted.slice(8)}`);
                    }
                  } else {
                    // For other inputs, just clean up
                    setPhoneNumber(value);
                  }
                }}
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
                onClick={() => onToggleMode(false)}
                className="hover:text-red-700 font-bold text-[#6d031e] transition-colors lg:text-[#6d031e] lg:hover:text-red-700"
                disabled={isLoading}
              >
                Sign in
              </button>
            </p>
          </div>
        </motion.form>

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
      </>
    );
  }

  return (
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
            onClick={() => onToggleMode(true)}
            className="hover:text-red-700 font-bold text-[#6d031e] transition-colors lg:text-[#6d031e] lg:hover:text-red-700"
            disabled={isLoading}
          >
            Sign up
          </button>
        </p>
      </div>
    </motion.form>
  );
}