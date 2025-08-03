import { initializeApp, getApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  sendEmailVerification,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyC401hRK08DgE9mWLCBBdWt67XpLLP-6eE",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "ubianfoodhub.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "ubianfoodhub",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "ubianfoodhub.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "727047776929",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:727047776929:web:2befc0088170ce5e445ee0",
};

// Initialize Firebase app with a check for existing app
let app;
try {
  app = initializeApp(firebaseConfig);
} catch (error: any) {
  if (error.code === 'app/duplicate-app') {
    // Use the existing app
    app = getApp();
  } else {
    throw error;
  }
}

export const auth = getAuth(app);
export const db = getFirestore(app);

// Storage
import { getStorage } from "firebase/storage";
export const storage = getStorage(app);

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');
googleProvider.setCustomParameters({
  hd: 'ub.edu.ph' // Restrict to UB domain
});

// Auth functions
export const signIn = (email: string, password: string) =>
  signInWithEmailAndPassword(auth, email, password);

export const signUp = (email: string, password: string) =>
  createUserWithEmailAndPassword(auth, email, password);

export const logOut = async () => {
  try {
    await signOut(auth);
    return true;
  } catch (error) {
    console.error("Logout error:", error);
    throw error;
  }
};

// Google Sign-In functions with email domain validation
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const email = result.user.email || "";
    
    // Validate email domain - only @ub.edu.ph allowed
    if (!email.endsWith("@ub.edu.ph")) {
      // Sign out the user immediately
      await signOut(auth);
      throw new Error("Only @ub.edu.ph email addresses are allowed to sign in with Google.");
    }
    
    return result;
  } catch (error: any) {
    console.error("Google sign-in error:", error);
    throw error;
  }
};

export const signInWithGoogleRedirect = () => {
  return signInWithRedirect(auth, googleProvider);
};

export const handleGoogleRedirectResult = async () => {
  try {
    const result = await getRedirectResult(auth);
    
    // If there's a result, validate email domain
    if (result && result.user) {
      const email = result.user.email || "";
      
      // Validate email domain - only @ub.edu.ph allowed
      if (!email.endsWith("@ub.edu.ph")) {
        // Sign out the user immediately
        await signOut(auth);
        throw new Error("Only @ub.edu.ph email addresses are allowed to sign in with Google.");
      }
    }
    
    return result;
  } catch (error: any) {
    console.error("Google redirect result error:", error);
    throw error;
  }
};

// Email verification function
export const sendVerificationEmail = async (user: FirebaseUser) => {
  try {
    await sendEmailVerification(user);
    return true;
  } catch (error: any) {
    console.error("Email verification error:", error);
    throw error;
  }
};

export const onAuthStateChange = (
  callback: (user: FirebaseUser | null) => void,
) => onAuthStateChanged(auth, callback);

// Firestore functions
export const createDocument = (
  collectionName: string,
  docId: string,
  data: any,
) =>
  setDoc(doc(db, collectionName, docId), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

export const addDocument = (collectionName: string, data: any) =>
  addDoc(collection(db, collectionName), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

export const getDocument = (collectionName: string, docId: string) =>
  getDoc(doc(db, collectionName, docId));

export const getDocuments = async (
  collectionName: string,
  whereField: string,
  operator: any,
  value: any,
) => {
  const q = query(collection(db, collectionName), where(whereField, operator, value));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

export const updateDocument = (
  collectionName: string,
  docId: string,
  data: any,
) =>
  updateDoc(doc(db, collectionName, docId), {
    ...data,
    updatedAt: serverTimestamp(),
  });

export const deleteDocument = (collectionName: string, docId: string) =>
  deleteDoc(doc(db, collectionName, docId));

// Admin function to delete user from Firebase Auth (requires admin SDK in real implementation)
export const deleteUserAccount = async (userId: string) => {
  // Note: In a real implementation, this would require Firebase Admin SDK on the backend
  // For now, we'll just delete from Firestore and let the client know
  try {
    await deleteDocument("users", userId);
    console.log("User deleted from Firestore:", userId);
    
    // In a real implementation, you would call your backend API:
    // const response = await fetch(`/api/admin/delete-user/${userId}`, { method: 'DELETE' });
    // if (!response.ok) throw new Error('Failed to delete user from Firebase Auth');
    
    return { success: true, message: "User deleted from Firestore. Note: Firebase Auth deletion requires backend implementation." };
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
};

export const getCollection = (collectionName: string) =>
  getDocs(collection(db, collectionName));

export const queryCollection = (
  collectionName: string,
  whereField: string,
  operator: any,
  value: any,
) =>
  getDocs(
    query(collection(db, collectionName), where(whereField, operator, value)),
  );

export const subscribeToCollection = (
  collectionName: string,
  callback: (docs: any[]) => void,
) =>
  onSnapshot(collection(db, collectionName), (snapshot) => {
    const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    callback(docs);
  });

export const subscribeToQuery = (
  collectionName: string,
  whereField: string,
  operator: any,
  value: any,
  callback: (docs: any[]) => void,
) =>
  onSnapshot(
    query(collection(db, collectionName), where(whereField, operator, value)),
    (snapshot) => {
      const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      callback(docs);
    },
  );

// Favorites operations
export const toggleFavorite = async (userId: string, stallId: string) => {
  try {
    // Check if favorite already exists
    const favoritesQuery = query(
      collection(db, "favorites"),
      where("userId", "==", userId),
      where("stallId", "==", stallId)
    );
    
    const querySnapshot = await getDocs(favoritesQuery);
    
    if (querySnapshot.empty) {
      // Add to favorites
      await addDocument("favorites", {
        userId,
        stallId,
      });
      return true; // Now favorited
    } else {
      // Remove from favorites
      const favoriteDoc = querySnapshot.docs[0];
      await deleteDocument("favorites", favoriteDoc.id);
      return false; // No longer favorited
    }
  } catch (error) {
    console.error("Error toggling favorite:", error);
    throw error;
  }
};

export const getUserFavorites = async (userId: string) => {
  try {
    const favoritesQuery = query(
      collection(db, "favorites"),
      where("userId", "==", userId)
    );
    
    const querySnapshot = await getDocs(favoritesQuery);
    const favoriteStallIds = querySnapshot.docs.map(doc => doc.data().stallId);
    return favoriteStallIds;
  } catch (error) {
    console.error("Error getting user favorites:", error);
    throw error;
  }
};

// Loyalty Points System Functions
export const awardLoyaltyPoints = async (userId: string, orderAmount: number, isNewStall: boolean = false) => {
  try {
    // Base rate: 1 point per ₱10 spent
    const basePoints = Math.floor(orderAmount / 10);
    
    // Bonus: Double points for trying new stalls
    const bonusMultiplier = isNewStall ? 2 : 1;
    const pointsToAward = basePoints * bonusMultiplier;
    
    if (pointsToAward > 0) {
      // Get current user data
      const userDoc = await getDocument("users", userId);
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const currentPoints = userData.loyaltyPoints || 0;
        const newTotal = currentPoints + pointsToAward;
        
        // Update user's loyalty points
        await updateDocument("users", userId, {
          loyaltyPoints: newTotal
        });
        
        // Log the points transaction
        await addDocument("loyalty_transactions", {
          userId,
          type: "earned",
          points: pointsToAward,
          orderAmount,
          isNewStall,
          description: isNewStall ? `Double points for trying a new stall` : `Points earned from order`,
          timestamp: new Date().toISOString()
        });
        
        return { pointsAwarded: pointsToAward, newTotal };
      }
    }
    return { pointsAwarded: 0, newTotal: 0 };
  } catch (error) {
    console.error("Error awarding loyalty points:", error);
    throw error;
  }
};

export const redeemLoyaltyPoints = async (userId: string, pointsToRedeem: number) => {
  try {
    // Conversion rate: 100 points = ₱10 discount
    const discountAmount = (pointsToRedeem / 100) * 10;
    
    // Get current user data
    const userDoc = await getDocument("users", userId);
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const currentPoints = userData.loyaltyPoints || 0;
      
      if (currentPoints >= pointsToRedeem) {
        const newTotal = currentPoints - pointsToRedeem;
        
        // Update user's loyalty points
        await updateDocument("users", userId, {
          loyaltyPoints: newTotal
        });
        
        // Log the redemption transaction
        await addDocument("loyalty_transactions", {
          userId,
          type: "redeemed",
          points: -pointsToRedeem,
          discountAmount,
          description: `Redeemed ${pointsToRedeem} points for ₱${discountAmount.toFixed(2)} discount`,
          timestamp: new Date().toISOString()
        });
        
        return { success: true, discountAmount, newTotal };
      } else {
        return { success: false, error: "Insufficient points" };
      }
    }
    return { success: false, error: "User not found" };
  } catch (error) {
    console.error("Error redeeming loyalty points:", error);
    throw error;
  }
};

export const getUserLoyaltyTier = (points: number) => {
  if (points >= 1000) return { tier: "Gold", color: "text-yellow-600", benefits: "15% bonus points, priority support" };
  if (points >= 500) return { tier: "Silver", color: "text-gray-500", benefits: "10% bonus points, early access" };
  return { tier: "Bronze", color: "text-amber-600", benefits: "5% bonus points" };
};

export const getLoyaltyTransactions = async (userId: string) => {
  try {
    // Try the optimized query first
    const transactionsQuery = query(
      collection(db, "loyalty_transactions"),
      where("userId", "==", userId),
      orderBy("timestamp", "desc")
    );
    
    const querySnapshot = await getDocs(transactionsQuery);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error: any) {
    // If it's a failed-precondition error (missing index), try without orderBy
    if (error.code === "failed-precondition") {
      try {
        const simpleQuery = query(
          collection(db, "loyalty_transactions"),
          where("userId", "==", userId)
        );
        
        const fallbackSnapshot = await getDocs(simpleQuery);
        const transactions = fallbackSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Sort in memory as fallback
        return transactions.sort((a: any, b: any) => {
          const aTime = new Date(a.timestamp || 0).getTime();
          const bTime = new Date(b.timestamp || 0).getTime();
          return bTime - aTime; // desc order
        });
      } catch (fallbackError) {
        console.error("Fallback query also failed:", fallbackError);
        return []; // Return empty array instead of throwing
      }
    }
    
    // For other errors, return empty array to prevent app crashes
    return [];
  }
};

export const checkIfFavorite = async (userId: string, stallId: string) => {
  try {
    const favoritesQuery = query(
      collection(db, "favorites"),
      where("userId", "==", userId),
      where("stallId", "==", stallId)
    );
    
    const querySnapshot = await getDocs(favoritesQuery);
    return !querySnapshot.empty;
  } catch (error) {
    console.error("Error checking favorite:", error);
    return false;
  }
};
