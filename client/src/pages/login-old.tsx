import { useState } from "react";
import { IsolatedLoginForm } from "@/components/IsolatedLoginForm";

export default function LoginPage() {
  const [authMode, setAuthMode] = useState<"social" | "email">("social");
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleAuth = () => {
    // Google auth logic here
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
                className="w-32 h-32 mx-auto mb-4 animate-pulse-slow"
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
              className="w-32 h-32 mx-auto mb-4 animate-pulse-slow"
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

            <IsolatedLoginForm
              isSignUp={isSignUp}
              onToggleMode={setIsSignUp}
              onGoogleAuth={handleGoogleAuth}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}