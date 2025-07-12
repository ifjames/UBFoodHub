import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { StoreProvider } from "./lib/store.tsx";
import AuthGuard from "@/components/auth-guard";
import SplashScreen from "@/components/splash-screen";
import DesktopNav from "@/components/layout/desktop-nav";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Home from "@/pages/home";
import Restaurant from "@/pages/restaurant";
import Cart from "@/pages/cart";
import Checkout from "@/pages/checkout";
import Orders from "@/pages/orders";
import Profile from "@/pages/profile";
import Search from "@/pages/search";
import AdminDashboard from "@/pages/admin-dashboard";
import StallDashboard from "@/pages/stall-dashboard";
import Settings from "@/pages/settings";
import HelpCenter from "@/pages/help-center";
import TermsPolicies from "@/pages/terms-policies";
import { onAuthStateChange, getDocument } from "@/lib/firebase";
import { useStore } from "@/lib/store";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
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
      <Route path="/search">
        <AuthGuard>
          <DesktopNav />
          <Search />
        </AuthGuard>
      </Route>
      <Route path="/admin">
        <AuthGuard>
          <AdminDashboard />
        </AuthGuard>
      </Route>
      <Route path="/stall-dashboard">
        <AuthGuard>
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

function AuthProvider({ children }) {
  const { dispatch } = useStore();
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // Get user document from Firestore
          const userDoc = await getDocument("users", firebaseUser.uid);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            dispatch({
              type: "SET_USER",
              payload: {
                id: firebaseUser.uid,
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                fullName: userData.fullName,
                studentId: userData.studentId,
                phoneNumber: userData.phoneNumber,
                role: userData.role,
                loyaltyPoints: userData.loyaltyPoints || 0,
                photoURL: userData.photoURL || firebaseUser.photoURL,
                emailVerified: userData.emailVerified || firebaseUser.emailVerified,
                createdAt: userData.createdAt,
              }
            });
          } else {
            console.warn("User document not found in Firestore");
          }
        } else {
          dispatch({ type: "SET_USER", payload: null });
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setIsAuthLoading(false);
      }
    });

    return unsubscribe;
  }, [dispatch]);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-maroon-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="text-maroon-600 text-xl font-bold">UB</div>
          </div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return children;
}

function App() {
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <StoreProvider>
        <AuthProvider>
          <TooltipProvider>
            <div className="w-full bg-white min-h-screen relative md:max-w-none max-w-md mx-auto md:shadow-none shadow-xl">
              <Toaster />
              <Router />
            </div>
          </TooltipProvider>
        </AuthProvider>
      </StoreProvider>
    </QueryClientProvider>
  );
}

export default App;
