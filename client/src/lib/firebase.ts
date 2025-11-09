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
  increment,
  runTransaction,
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

// Export increment and runTransaction for atomic operations
export { increment, runTransaction };

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

// Admin function to delete user from Firebase Auth (requires admin SDK in backend)
export const deleteUserAccount = async (userId: string) => {
  try {
    // First, delete from Firestore
    await deleteDocument("users", userId);
    console.log("User deleted from Firestore:", userId);
    
    // Then, call the backend API to delete from Firebase Auth
    const response = await fetch(`/api/admin/delete-user/${userId}`, { method: 'DELETE' });
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to delete user from Firebase Auth');
    }
    
    if (result.authDeleted) {
      return { success: true, message: "User deleted from both Firestore and Firebase Authentication successfully" };
    } else {
      return { success: true, message: result.message || "User deleted from Firestore, but Firebase Auth deletion was skipped" };
    }
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
        
        // Create a discount voucher with unified structure
        const voucherCode = `LOYALTY${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        await addDocument("vouchers", {
          userId,
          code: voucherCode,
          title: `Loyalty Discount ₱${discountAmount.toFixed(2)}`,
          description: `Redeemed from ${pointsToRedeem} loyalty points`,
          discountType: 'fixed',
          discountValue: discountAmount,
          discountAmount, // Keep for backward compatibility
          minOrderAmount: 0,
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Keep for backward compatibility
          isActive: true,
          isUsed: false,
          userTargeting: 'specific',
          targetUserEmails: [auth.currentUser?.email],
          stallTargeting: 'all',
          maxUsage: 1,
          usageCount: 0, // Use consistent field name
          type: "loyalty_redemption",
          createdAt: new Date().toISOString(),
          createdBy: userId
        });
        
        return { success: true, discountAmount, newTotal, voucherCode };
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

// Voucher Management Functions
export const getUserVouchers = async (userId: string) => {
  try {
    const now = new Date();
    
    // Get user's loyalty point redeemed vouchers (all of them, not just unused)
    const loyaltyVouchersQuery = query(
      collection(db, "vouchers"),
      where("userId", "==", userId)
    );
    const loyaltySnapshot = await getDocs(loyaltyVouchersQuery);
    const loyaltyVouchers = loyaltySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log("Loyalty vouchers found:", loyaltyVouchers.length, loyaltyVouchers);
    
    // Get admin-created vouchers that this user can access
    const adminVouchersQuery = query(
      collection(db, "vouchers"),
      where("isActive", "==", true)
    );
    const adminSnapshot = await getDocs(adminVouchersQuery);
    const allAdminVouchers = adminSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Filter admin vouchers based on user targeting
    const availableAdminVouchers = allAdminVouchers.filter((voucher: any) => {
      // Skip loyalty redemption vouchers that don't belong to this user (they're already included above)
      if (voucher.type === 'loyalty_redemption' && voucher.userId !== userId) return false;
      
      // Check user targeting
      if (voucher.userTargeting === 'all') {
        return true;
      } else if (voucher.userTargeting === 'selected' || voucher.userTargeting === 'specific') {
        // Get user email and check if it's in the target list
        const user = auth.currentUser;
        return user && voucher.targetUserEmails?.includes(user.email);
      }
      return false;
    });
    
    // Combine loyalty vouchers and available admin vouchers
    const combinedVouchers = [...loyaltyVouchers, ...availableAdminVouchers];
    
    // Filter out expired vouchers and remove duplicates
    const validVouchers = combinedVouchers.filter((voucher: any) => {
      // Check if expired
      if (voucher.expiresAt && new Date(voucher.expiresAt) <= now) return false;
      if (voucher.validUntil && new Date(voucher.validUntil) <= now) return false;
      return true;
    });
    
    // Remove duplicates based on voucher code and normalize field names
    const uniqueVouchers = validVouchers.reduce((acc: any[], voucher: any) => {
      const exists = acc.find(v => v.code === voucher.code);
      if (!exists) {
        // Normalize field names for backward compatibility
        const normalizedVoucher = {
          ...voucher,
          usageCount: voucher.usageCount ?? voucher.currentUsage ?? 0,
          maxUsage: voucher.maxUsage ?? 1,
          discountValue: voucher.discountValue ?? voucher.discountAmount ?? 0
        };
        acc.push(normalizedVoucher);
      }
      return acc;
    }, []);
    
    console.log("Final vouchers being returned:", uniqueVouchers.length, uniqueVouchers);
    return uniqueVouchers;
  } catch (error) {
    console.error("Error getting user vouchers:", error);
    return [];
  }
};

// Validate voucher without marking as used (for cart application)
export const validateVoucher = async (userId: string, voucherId: string) => {
  try {
    const voucherDoc = await getDocument("vouchers", voucherId);
    if (voucherDoc.exists()) {
      const voucherData = voucherDoc.data();
      
      // Check if voucher belongs to user or is available to them
      let hasAccess = false;
      
      // Check if it's a user-specific voucher (loyalty redemption or assigned)
      if (voucherData.userId === userId) {
        hasAccess = true;
      }
      // Check if it's an admin voucher available to all users
      else if (voucherData.userTargeting === 'all') {
        hasAccess = true;
      }
      // Check if it's an admin voucher for selected users
      else if (voucherData.userTargeting === 'selected' || voucherData.userTargeting === 'specific') {
        const user = auth.currentUser;
        hasAccess = user && voucherData.targetUserEmails?.includes(user.email);
      }
      
      if (!hasAccess) {
        return { success: false, error: "Voucher does not belong to this user" };
      }
      
      if (voucherData.isUsed) {
        return { success: false, error: "Voucher has already been used" };
      }
      
      if (voucherData.expiresAt && new Date(voucherData.expiresAt) < new Date()) {
        return { success: false, error: "Voucher has expired" };
      }
      
      if (voucherData.validUntil && new Date(voucherData.validUntil) < new Date()) {
        return { success: false, error: "Voucher has expired" };
      }
      
      // Return voucher data without marking as used
      return { 
        success: true, 
        discountAmount: voucherData.discountAmount || voucherData.discountValue || 0,
        code: voucherData.code,
        id: voucherId,
        voucherData
      };
    }
    
    return { success: false, error: "Voucher not found" };
  } catch (error) {
    console.error("Error validating voucher:", error);
    throw error;
  }
};

// Mark voucher as used (for order placement)
export const useVoucher = async (voucherId: string, userId?: string, orderId?: string) => {
  try {
    // Get current voucher data
    const voucherDoc = await getDocument("vouchers", voucherId);
    
    if (!voucherDoc.exists()) {
      throw new Error("Voucher not found");
    }
    
    const voucherData = voucherDoc.data();
    const currentUsage = (voucherData.currentUsage || 0) + 1;
    const maxUsage = voucherData.maxUsage || 1;
    
    // Prepare update data
    const updateData: any = {
      currentUsage: currentUsage,
      lastUsedAt: new Date().toISOString()
    };
    
    // Mark as used if it's reached max usage
    if (currentUsage >= maxUsage) {
      updateData.isUsed = true;
      updateData.usedAt = new Date().toISOString();
    }
    
    await updateDocument("vouchers", voucherId, updateData);
    
    // Create userVouchers entry to track this redemption
    if (userId) {
      const currentUser = auth.currentUser;
      await addDocument("userVouchers", {
        userId: userId,
        voucherId: voucherId,
        voucherCode: voucherData.code,
        isUsed: true,
        usedAt: new Date().toISOString(),
        orderId: orderId || null,
        redeemedAt: new Date().toISOString(),
        discountAmount: voucherData.discountValue || voucherData.discountAmount || 0,
        userEmail: currentUser?.email || null,
      });
    }
    
    return { success: true, currentUsage, maxUsage };
  } catch (error) {
    console.error("Error using voucher:", error);
    throw error;
  }
};

// Legacy function for backward compatibility
export const applyVoucher = async (userId: string, voucherId: string) => {
  return validateVoucher(userId, voucherId);
};

// Additional Voucher Management Functions
export const createVoucher = async (voucherData: any) => {
  try {
    const vouchersRef = collection(db, 'vouchers');
    const docRef = await addDoc(vouchersRef, {
      ...voucherData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating voucher:', error);
    throw error;
  }
};

export const getAllVouchers = async () => {
  try {
    const vouchersRef = collection(db, 'vouchers');
    const q = query(vouchersRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting vouchers:', error);
    return [];
  }
};

export const deleteVoucher = async (voucherId: string) => {
  try {
    const voucherRef = doc(db, 'vouchers', voucherId);
    await deleteDoc(voucherRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting voucher:', error);
    throw error;
  }
};

// Get voucher redemption details for admins
export const getVoucherRedemptions = async (voucherId: string) => {
  try {
    // Get all user vouchers for this voucher first (simpler query to avoid index issues)
    const redemptionsQuery = query(
      collection(db, "userVouchers"),
      where("voucherId", "==", voucherId)
    );
    
    const redemptionsSnapshot = await getDocs(redemptionsQuery);
    const redemptions = [];
    
    for (const docRef of redemptionsSnapshot.docs) {
      const redemptionData = docRef.data();
      
      // Only include used vouchers and filter client-side
      if (!redemptionData.isUsed) continue;
      
      // Get user details
      const userDoc = await getDoc(doc(db, "users", redemptionData.userId));
      const userData = userDoc.exists() ? userDoc.data() : null;
      
      // Get order details if available
      let orderData = null;
      if (redemptionData.orderId) {
        const orderDoc = await getDoc(doc(db, "orders", redemptionData.orderId));
        orderData = orderDoc.exists() ? orderDoc.data() : null;
      }
      
      redemptions.push({
        id: docRef.id,
        ...redemptionData,
        user: userData,
        order: orderData
      });
    }
    
    // Sort by usedAt date descending on client side
    return redemptions.sort((a: any, b: any) => {
      const dateA = new Date(a.usedAt || 0).getTime();
      const dateB = new Date(b.usedAt || 0).getTime();
      return dateB - dateA;
    });
  } catch (error) {
    console.error("Error getting voucher redemptions:", error);
    return [];
  }
};

// Get voucher usage statistics for admins
export const getVoucherStats = async (voucherId: string) => {
  try {
    const [redemptionsQuery, voucherDoc] = await Promise.all([
      getDocs(query(
        collection(db, "userVouchers"),
        where("voucherId", "==", voucherId)
      )),
      getDoc(doc(db, "vouchers", voucherId))
    ]);
    
    const voucherData = voucherDoc.exists() ? voucherDoc.data() : null;
    const totalRedemptions = redemptionsQuery.docs.length;
    const usedRedemptions = redemptionsQuery.docs.filter(doc => doc.data().isUsed).length;
    
    return {
      totalRedeemed: totalRedemptions,
      totalUsed: usedRedemptions,
      maxUsage: voucherData?.maxUsage || 0,
      remainingUses: Math.max(0, (voucherData?.maxUsage || 0) - totalRedemptions)
    };
  } catch (error) {
    console.error("Error getting voucher stats:", error);
    return {
      totalRedeemed: 0,
      totalUsed: 0,
      maxUsage: 0,
      remainingUses: 0
    };
  }
};

// Get orders with voucher usage for stall owners
export const getOrdersWithVouchers = async (stallId: string) => {
  try {
    // Use simpler query to avoid compound index requirements
    const ordersQuery = query(
      collection(db, "orders"),
      where("stallId", "==", stallId)
    );
    
    const ordersSnapshot = await getDocs(ordersQuery);
    const ordersWithVouchers = [];
    
    for (const docRef of ordersSnapshot.docs) {
      const orderData = docRef.data();
      
      // Filter client-side for orders with vouchers
      if (!orderData.voucherId) continue;
      
      // Get voucher details
      let voucherData = null;
      if (orderData.voucherId) {
        const voucherDoc = await getDoc(doc(db, "vouchers", orderData.voucherId));
        voucherData = voucherDoc.exists() ? voucherDoc.data() : null;
      }
      
      // Get customer details
      let customerData = null;
      if (orderData.userId) {
        const customerDoc = await getDoc(doc(db, "users", orderData.userId));
        customerData = customerDoc.exists() ? customerDoc.data() : null;
      }
      
      ordersWithVouchers.push({
        id: docRef.id,
        ...orderData,
        voucher: voucherData,
        customer: customerData
      });
    }
    
    // Sort by creation date descending on client side
    return ordersWithVouchers.sort((a: any, b: any) => {
      const dateA = new Date(a.createdAt?.toDate ? a.createdAt.toDate() : a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt?.toDate ? b.createdAt.toDate() : b.createdAt || 0).getTime();
      return dateB - dateA;
    });
  } catch (error) {
    console.error("Error getting orders with vouchers:", error);
    return [];
  }
};

export const getAllUsers = async () => {
  try {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting users:', error);
    return [];
  }
};

export const getAllStalls = async () => {
  try {
    const stallsRef = collection(db, 'stalls');
    const snapshot = await getDocs(stallsRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting stalls:', error);
    return [];
  }
};
