import { createContext, useContext, useReducer, ReactNode } from "react";
import { signIn as firebaseSignIn, signUp as firebaseSignUp, logOut } from "./firebase";
import { auth, db } from "./firebase";
import { doc, setDoc, getDoc, collection, query, where, getDocs, deleteDoc } from "firebase/firestore";
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
      // Set a flag to indicate we're creating a new account
      sessionStorage.setItem('creatingAccount', 'true');
      
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
      
      // Clear the flag after successful account creation
      sessionStorage.removeItem('creatingAccount');
      
      return userCredential;
    } catch (error) {
      // Clear the flag if there's an error
      sessionStorage.removeItem('creatingAccount');
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
        
        // Sync Google account data with existing account (name, photo, email verification)
        const shouldUpdate = 
          userData.emailVerified !== userCredential.user.emailVerified ||
          userData.fullName !== userCredential.user.displayName ||
          userData.photoURL !== userCredential.user.photoURL;
          
        if (shouldUpdate) {
          console.log("Syncing Google account data for existing user:", userCredential.user.email);
          await setDoc(doc(db, "users", userCredential.user.uid), {
            ...userData,
            fullName: userCredential.user.displayName || userData.fullName, // Use Google name if available
            photoURL: userCredential.user.photoURL || userData.photoURL, // Use Google photo if available
            emailVerified: userCredential.user.emailVerified,
            // Keep existing data: password, studentId, phoneNumber, loyaltyPoints, etc.
          }, { merge: true });
          console.log("Account data synced from Google for:", userCredential.user.email);
        }
      } else {
        // Check if there's an existing account with the same email but different UID
        // This can happen if user created account manually then logged in with Google
        const existingUserQuery = query(
          collection(db, "users"),
          where("email", "==", userCredential.user.email)
        );
        const existingUserSnapshot = await getDocs(existingUserQuery);
        
        if (!existingUserSnapshot.empty) {
          // Found existing account with same email - merge the accounts
          const existingUserDoc = existingUserSnapshot.docs[0];
          const existingUserData = existingUserDoc.data();
          
          console.log("Found existing account with same email, merging accounts:", userCredential.user.email);
          
          // Create new document with Google UID but keep existing data
          const mergedUserData = {
            ...existingUserData,
            uid: userCredential.user.uid, // Use new Google UID
            fullName: userCredential.user.displayName || existingUserData.fullName, // Prefer Google name
            photoURL: userCredential.user.photoURL || existingUserData.photoURL, // Prefer Google photo
            emailVerified: userCredential.user.emailVerified, // Use Google verification status
            // Keep existing: password, studentId, phoneNumber, loyaltyPoints, role, etc.
          };
          
          await setDoc(doc(db, "users", userCredential.user.uid), mergedUserData);
          
          // Delete the old document
          await deleteDoc(doc(db, "users", existingUserDoc.id));
          
          console.log("Account merged successfully for:", userCredential.user.email);
          userRole = existingUserData.role || "student";
        } else {
          // Create new user document for Google sign-in with UB email
          console.log("Creating new user document for Google sign-in:", userCredential.user.email);
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
          console.log("New student account created automatically for:", userCredential.user.email);
        }
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
