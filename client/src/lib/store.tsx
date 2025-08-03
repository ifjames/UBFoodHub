import { createContext, useContext, useReducer, ReactNode } from "react";
import { signIn as firebaseSignIn, signUp as firebaseSignUp, logOut } from "./firebase";
import { auth, db } from "./firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { sendEmailVerification } from "firebase/auth";

interface User {
  id: string;
  uid: string;
  email: string;
  fullName: string;
  studentId?: string | null;
  phoneNumber?: string | null;
  role: string;
  loyaltyPoints?: number;
  photoURL?: string | null;
  emailVerified?: boolean;
  createdAt?: any;
}

interface StoreState {
  user: User | null;
  cartCount: number;
}

type StoreAction = 
  | { type: "SET_USER"; payload: User | null }
  | { type: "SET_CART_COUNT"; payload: number };

const initialState: StoreState = {
  user: null,
  cartCount: 0,
};

function storeReducer(state: StoreState, action: StoreAction): StoreState {
  switch (action.type) {
    case "SET_USER":
      return { ...state, user: action.payload };
    case "SET_CART_COUNT":
      return { ...state, cartCount: action.payload };
    default:
      return state;
  }
}

const StoreContext = createContext<{
  state: StoreState;
  dispatch: React.Dispatch<StoreAction>;
} | null>(null);

export function StoreProvider({ children }: { children: ReactNode }): JSX.Element {
  const [state, dispatch] = useReducer(storeReducer, initialState);

  return (
    <StoreContext.Provider value={{ state, dispatch }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
}

export function useAuth() {
  const signIn = async (email: string, password: string) => {
    try {
      const userCredential = await firebaseSignIn(email, password);
      
      // Get user data from Firestore to determine role
      const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
      let userData = null;
      let userRole = "student"; // Default role
      
      if (userDoc.exists()) {
        userData = userDoc.data();
        userRole = userData.role;
      }
      
      // Check email verification for students only - prevent login completely
      if (userRole === "student" && !userCredential.user.emailVerified) {
        // Sign out the user immediately before any state changes
        await logOut();
        throw new Error("Please verify your email address before signing in. Check your inbox for a verification email.");
      }
      
      return { userCredential, role: userRole };
    } catch (error) {
      // If this is our verification error, make sure user is signed out
      if (error instanceof Error && error.message.includes("verify your email")) {
        await logOut();
      }
      throw error;
    }
  };

  const signUp = async (email: string, password: string, userData: {
    name: string;
    phoneNumber: string;
    studentId: string;
  }) => {
    try {
      const userCredential = await firebaseSignUp(email, password);
      const user = userCredential.user;
      
      // Send email verification
      await sendEmailVerification(user);
      
      // Create user document in Firestore
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        fullName: userData.name,
        phoneNumber: userData.phoneNumber,
        studentId: userData.studentId,
        role: "student",
        emailVerified: false,
        createdAt: new Date(),
        loyaltyPoints: 0,
      });
      
      // Sign out immediately after account creation to prevent auto-login
      // This prevents the email verification enforcement from causing issues
      await logOut();
      
      return userCredential;
    } catch (error) {
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await logOut();
    } catch (error) {
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { signInWithGoogle: firebaseGoogleSignIn } = await import("./firebase");
      const userCredential = await firebaseGoogleSignIn();
      
      // Get user data from Firestore to determine role
      const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
      let userRole = "student"; // Default role
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        userRole = userData.role;
      } else {
        // Create new user document for Google sign-in
        const userData = {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          fullName: userCredential.user.displayName || "",
          phoneNumber: "",
          studentId: "",
          role: "student",
          emailVerified: userCredential.user.emailVerified,
          createdAt: new Date(),
          loyaltyPoints: 0,
          photoURL: userCredential.user.photoURL,
        };
        
        await setDoc(doc(db, "users", userCredential.user.uid), userData);
      }
      
      // Check email verification for students only - prevent login completely
      if (userRole === "student" && !userCredential.user.emailVerified) {
        // Sign out the user immediately before any state changes
        await logOut();
        throw new Error("Please verify your email address before signing in. Check your inbox for a verification email.");
      }
      
      return { userCredential, role: userRole };
    } catch (error) {
      // If this is our verification error, make sure user is signed out
      if (error instanceof Error && error.message.includes("verify your email")) {
        await logOut();
      }
      throw error;
    }
  };

  const resendVerificationEmail = async () => {
    try {
      const { sendVerificationEmail } = await import("./firebase");
      const { auth } = await import("./firebase");
      
      if (auth.currentUser) {
        await sendVerificationEmail(auth.currentUser);
        return true;
      }
      throw new Error("No user is currently signed in");
    } catch (error) {
      throw error;
    }
  };

  return {
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    resendVerificationEmail,
  };
}
