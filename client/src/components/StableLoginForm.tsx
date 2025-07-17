import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, User, Phone, CheckCircle } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

interface LoginFormData {
  email: string;
  password: string;
}

interface SignUpFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phoneNumber: string;
  studentId: string;
}

interface StableLoginFormProps {
  isSignUp: boolean;
  setIsSignUp: (value: boolean) => void;
  loginData: LoginFormData;
  setLoginData: (data: LoginFormData) => void;
  signUpData: SignUpFormData;
  setSignUpData: (data: SignUpFormData) => void;
  showPassword: boolean;
  setShowPassword: (value: boolean) => void;
  showConfirmPassword: boolean;
  setShowConfirmPassword: (value: boolean) => void;
  isLoading: boolean;
  onEmailLogin: (e: React.FormEvent) => void;
  onSignUp: (e: React.FormEvent) => void;
  agreedToTerms: boolean;
  setAgreedToTerms: (value: boolean) => void;
  setShowTermsDialog: (value: boolean) => void;
  setShowPrivacyDialog: (value: boolean) => void;
}

const StableLoginForm: React.FC<StableLoginFormProps> = ({
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
  onSignUp,
  agreedToTerms,
  setAgreedToTerms,
  setShowTermsDialog,
  setShowPrivacyDialog,
}) => {
  const handleLoginChange = (field: keyof LoginFormData, value: string) => {
    setLoginData({ ...loginData, [field]: value });
  };

  const handleSignUpChange = (field: keyof SignUpFormData, value: string) => {
    setSignUpData({ ...signUpData, [field]: value });
  };

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
                    onChange={(e) => handleLoginChange("email", e.target.value)}
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
                    onChange={(e) => handleLoginChange("password", e.target.value)}
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
                    onChange={(e) => handleSignUpChange("name", e.target.value)}
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
                    onChange={(e) => handleSignUpChange("email", e.target.value)}
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
                    onChange={(e) => handleSignUpChange("studentId", e.target.value)}
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
                    onChange={(e) => handleSignUpChange("phoneNumber", e.target.value)}
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
                    onChange={(e) => handleSignUpChange("password", e.target.value)}
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
                    onChange={(e) => handleSignUpChange("confirmPassword", e.target.value)}
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
            
            {/* Terms of Service Checkbox - Only shown during signup */}
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
};

export default StableLoginForm;