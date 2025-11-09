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
      "Student ID validation"
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
