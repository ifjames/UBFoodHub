import { ReactNode } from "react";
import { useStore } from "@/lib/store";
import { useLocation } from "wouter";
import { useEffect } from "react";

interface AuthGuardProps {
  children: ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { state } = useStore();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!state.user) {
      setLocation("/login");
    }
  }, [state.user, setLocation]);

  if (!state.user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-maroon-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="text-maroon-600 text-xl font-bold">UB</div>
          </div>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
