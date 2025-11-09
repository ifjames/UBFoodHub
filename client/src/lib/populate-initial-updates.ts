// Script to populate initial system updates
// This file can be imported and called from the admin dashboard to initialize the system updates

import { addDocument } from "./firebase";

export const initialSystemUpdates = [
  {
    version: "1.0",
    title: "Initial System Launch",
    description: "Welcome to UB FoodHub! The platform is now live with core features including user authentication, stall browsing, and order management.",
    changes: [
      "User authentication with @ub.edu.ph domain restriction",
      "Role-based access control (Students, Stall Owners, Admins)",
      "Email verification system",
      "Student ID validation",
      "Session management with secure authentication"
    ],
    releaseDate: new Date("2024-11-01"),
    announced: false,
  },
  {
    version: "1.1",
    title: "Core Ordering Features",
    description: "Enhanced ordering experience with comprehensive menu browsing and cart management capabilities.",
    changes: [
      "Restaurant/Stall browsing with visual cards",
      "Menu item management with images and descriptions",
      "Shopping cart system with real-time synchronization",
      "Order placement with special instructions",
      "QR code generation for secure pickup",
      "Order status tracking (Pending → Preparing → Ready → Completed)"
    ],
    releaseDate: new Date("2024-11-02"),
    announced: false,
  },
  {
    version: "1.2",
    title: "Loyalty Rewards Program",
    description: "Introducing the loyalty points system to reward our valued customers with every purchase.",
    changes: [
      "Earn 1 point per ₱10 spent",
      "Double points for trying new stalls",
      "Redeem 100 points for ₱10 discount",
      "Three-tier system: Bronze, Silver, Gold",
      "Automatic tier upgrades with increasing benefits",
      "Complete transaction history tracking"
    ],
    releaseDate: new Date("2024-11-03"),
    announced: false,
  },
  {
    version: "1.3",
    title: "Stall Owner Dashboard",
    description: "Comprehensive tools for stall owners to manage their business efficiently.",
    changes: [
      "Menu item CRUD operations with image upload",
      "Order management with chronological display",
      "Advanced search by order ID and customer name",
      "QR code scanner for order verification",
      "Business analytics with daily revenue tracking",
      "Popular items dashboard",
      "Peak hours analysis"
    ],
    releaseDate: new Date("2024-11-04"),
    announced: false,
  },
  {
    version: "1.4",
    title: "Admin Management Suite",
    description: "Powerful administrative tools for complete platform oversight and management.",
    changes: [
      "User management with create, edit, verify, and deactivate capabilities",
      "Stall management with full lifecycle control",
      "Owner assignment and reassignment",
      "Bulk operations support",
      "Activity monitoring and analytics",
      "Broadcast notification system"
    ],
    releaseDate: new Date("2024-11-05"),
    announced: false,
  },
  {
    version: "1.5",
    title: "Advanced Order Management",
    description: "Enhanced features for better order handling and customer service.",
    changes: [
      "Order cancellation request system",
      "Penalty management for violations",
      "Voucher system with flexible targeting",
      "Review and rating system",
      "Multi-stall ordering support",
      "Scheduled pickup times",
      "One-click reordering from history"
    ],
    releaseDate: new Date("2024-11-06"),
    announced: false,
  },
  {
    version: "1.6",
    title: "Real-time Notifications",
    description: "Stay updated with instant notifications for all important events.",
    changes: [
      "Push notifications for order status changes",
      "In-app notification bell with unread indicators",
      "Announcement system for platform-wide updates",
      "Promotion and offer notifications",
      "Security alerts and account notifications",
      "Real-time synchronization across all devices"
    ],
    releaseDate: new Date("2024-11-07"),
    announced: false,
  },
  {
    version: "1.7",
    title: "Mobile Experience Enhancements",
    description: "Optimized mobile-first design with Progressive Web App capabilities.",
    changes: [
      "Progressive Web App (PWA) with offline support",
      "Touch-optimized interfaces",
      "Bottom navigation for thumb-friendly access",
      "Responsive design for all screen sizes",
      "Liquid glass effects and smooth animations",
      "Desktop enhancement with split-screen layouts"
    ],
    releaseDate: new Date("2024-11-08"),
    announced: false,
  },
  {
    version: "1.8",
    title: "Email Verification Enforcement",
    description: "Strengthened security by enforcing email verification for all student accounts.",
    changes: [
      "Complete blocking of unverified student accounts at authentication level",
      "Students cannot access any part of the application until email is verified",
      "Email verification reminders in notifications",
      "Fixed email verification status syncing from Firebase Auth to Firestore"
    ],
    releaseDate: new Date("2024-11-09"),
    announced: false,
  },
  {
    version: "1.9",
    title: "Google Sign-In Integration",
    description: "Seamless authentication with Google accounts for UB email addresses.",
    changes: [
      "Automatic account creation for @ub.edu.ph Google sign-ins",
      "Eliminated manual registration requirement for Google users",
      "Automatic account syncing (name, profile picture) when logging in",
      "Merging of manual and Google accounts with same email"
    ],
    releaseDate: new Date("2024-11-10"),
    announced: false,
  },
  {
    version: "2.0",
    title: "Enhanced User Deletion & Data Cleanup",
    description: "Complete data removal system for comprehensive user account management.",
    changes: [
      "Admin user deletion removes all related user data (orders, notifications, favorites)",
      "Complete cleanup on account deletion",
      "Backend API endpoint for Firebase Authentication deletion",
      "Graceful fallback when Firebase Admin SDK is unavailable",
      "Accurate status reporting for deletion operations"
    ],
    releaseDate: new Date("2024-11-11"),
    announced: false,
  },
  {
    version: "2.1",
    title: "Email Verification Dual-Check System",
    description: "Fixed critical authentication issue for admin-verified users.",
    changes: [
      "Authentication now checks both Firebase Auth AND admin verification status",
      "Admin-verified accounts can access application without email verification",
      "Fixed issue where admin-verified users couldn't log in",
      "Dual verification system for enhanced flexibility"
    ],
    releaseDate: new Date("2024-11-12"),
    announced: false,
  },
  {
    version: "2.2",
    title: "Enhanced Signup Validation & Formatting",
    description: "Improved data quality with strict input validation and real-time formatting.",
    changes: [
      "Student ID validation (exactly 7 numbers only)",
      "Philippine phone number format (+63 9XX XXX XXXX)",
      "Real-time input formatting for phone numbers",
      "Password strength checks",
      "Abuse prevention measures",
      "Clear placeholders and error messages for better user guidance"
    ],
    releaseDate: new Date("2024-11-13"),
    announced: false,
  },
  {
    version: "2.3",
    title: "Admin Dashboard Optimizations",
    description: "Streamlined admin interface with improved sorting and account creation workflows.",
    changes: [
      "Sorting functionality for users and stalls (alphabetical by name and by date)",
      "Fixed auto-login bug when admin creates accounts",
      "Added logout call after account creation",
      "Backend API endpoint for user deletion with Firebase Admin SDK",
      "Streamlined stall owner account creation form (removed unnecessary fields)",
      "Stalls now created separately from owner accounts"
    ],
    releaseDate: new Date("2024-11-14"),
    announced: false,
  },
  {
    version: "2.4",
    title: "Categories Management Removal",
    description: "Simplified admin dashboard by removing unused categories feature.",
    changes: [
      "Completely removed categories management tab",
      "Removed all categories-related UI components",
      "Cleaned up categories state management",
      "Removed all categories-related functions",
      "Streamlined admin dashboard interface"
    ],
    releaseDate: new Date("2024-11-15"),
    announced: false,
  },
  {
    version: "2.5",
    title: "Menu Item Drag-and-Drop Ordering",
    description: "Native HTML5 drag-and-drop for easy menu item reordering in stall dashboard.",
    changes: [
      "HTML5 native drag-and-drop for menu items",
      "Added displayOrder field to Firestore for persistent ordering",
      "Visual feedback during drag operations",
      "Student-facing view displays items in stall owner's preferred order",
      "Fixed Edit button hover styling for better visibility",
      "React 18 compatible implementation"
    ],
    releaseDate: new Date("2024-11-16"),
    announced: false,
  },
  {
    version: "2.6",
    title: "Role-Based Access Control Security",
    description: "Critical security enhancement preventing unauthorized dashboard access.",
    changes: [
      "Fixed vulnerability where users could access other role dashboards via direct URLs",
      "Enhanced AuthGuard with allowedRoles prop for route protection",
      "Admin routes only accessible by admin users",
      "Stall dashboard only accessible by stall owners",
      "Automatic redirection to appropriate dashboard on unauthorized access",
      "Security logging for unauthorized access attempts"
    ],
    releaseDate: new Date("2024-11-17"),
    announced: false,
  },
  {
    version: "2.7",
    title: "404 Page Complete Redesign",
    description: "Brand-new 404 page matching UB FoodHub's maroon branding and design system.",
    changes: [
      "Animated liquid glass background with floating particles",
      "Large 404 text with gradient maroon colors",
      "UB FoodHub logo with smooth animations",
      "User-friendly error messaging",
      "Smart navigation buttons (role-appropriate dashboard redirects)",
      "Go Home and Go Back buttons for easy recovery",
      "Removed developer-focused messages"
    ],
    releaseDate: new Date("2024-11-18"),
    announced: false,
  },
  {
    version: "2.8",
    title: "UI Refinements & Polish",
    description: "Various user interface improvements for better visual consistency.",
    changes: [
      "Fixed logout button hover styling to maintain red text color",
      "Improved button hover states across the application",
      "Fixed sign-up flow getting stuck issue",
      "Session storage flag to bypass verification during account creation",
      "Enhanced profile page interactions"
    ],
    releaseDate: new Date("2024-11-19"),
    announced: false,
  },
  {
    version: "2.9",
    title: "System Updates & Changelog Management",
    description: "Complete update tracking system for administrators to manage version history.",
    changes: [
      "Updates tab in admin dashboard",
      "Real-time Firestore subscription for system_updates collection",
      "Create Update dialog with version, title, description, changes",
      "Announce functionality sending notifications to all users",
      "Pre-populated initial updates covering all features (v1.0-2.9)",
      "One-click populate button for system update history",
      "Mobile-responsive 4-column card layout",
      "Version number, release date, and announcement status display"
    ],
    releaseDate: new Date("2024-11-20"),
    announced: false,
  },
];

export async function populateInitialUpdates() {
  try {
    for (const update of initialSystemUpdates) {
      await addDocument("system_updates", {
        ...update,
        createdBy: "system",
      });
    }
    console.log("Successfully populated initial system updates");
    return { success: true, count: initialSystemUpdates.length };
  } catch (error) {
    console.error("Error populating initial updates:", error);
    throw error;
  }
}
