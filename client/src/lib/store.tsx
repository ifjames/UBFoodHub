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
      return userCredential;
    } catch (error) {
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

  return {
    signIn,
    signUp,
    signOut,
  };
}
