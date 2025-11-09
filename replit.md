# UB FoodHub - Mobile Web Application

## Overview
UB FoodHub is a mobile web application for the University of Batangas canteen ecosystem, designed to streamline food ordering. It enables students to pre-order, use QR code-based pickup, and improves canteen operations during limited break periods. The project aims to digitize the university's food service, enhancing convenience for students and efficiency for canteen staff.

## User Preferences
Preferred communication style: Simple, everyday language.

## Recent Changes (November 2025)
- **Role-Based Access Control** (November 8, 2025):
  - Fixed critical security vulnerability where users could access dashboards for other roles by typing URLs directly
  - Enhanced AuthGuard component with `allowedRoles` prop to enforce role-based route protection
  - Admin routes (/admin, /admin/vouchers) now only accessible by admin users
  - Stall dashboard (/stall-dashboard) now only accessible by stall_owner users
  - Unauthorized access attempts automatically redirect users to their appropriate dashboard
  - Security logging added for unauthorized access attempts
- **404 Page Redesign** (November 8, 2025):
  - Completely redesigned 404 page to match UB FoodHub maroon branding and design system
  - Features animated liquid glass background effects with floating particles
  - Displays large "404" text with gradient maroon colors and user-friendly messaging
  - Includes UB FoodHub logo with smooth animations
  - Smart navigation buttons that redirect users to their role-appropriate dashboard
  - "Go Home" and "Go Back" buttons for easy navigation recovery
  - Removed developer-focused messages in favor of user-friendly content
- **Email Verification Enforcement**: Implemented complete blocking of unverified student accounts at authentication level. Students cannot access any part of the application until email is verified.
- **UI Enhancement**: Fixed logout button hover styling in profile page to maintain red text color instead of turning white.
- **Sign-up Flow Fix**: Fixed account creation getting stuck by using session storage flag to bypass email verification during account creation process.
- **Automatic Account Creation**: Google sign-in with UB email (@ub.edu.ph) now automatically creates student accounts, eliminating manual registration requirement.
- **Email Verification Sync**: Fixed email verification status syncing from Firebase Auth to Firestore when students verify their email.
- **Enhanced User Deletion**: Admin user deletion now removes all related user data (orders, notifications, favorites) for complete cleanup. Backend API endpoint handles Firebase Authentication deletion with graceful fallback when Firebase Admin SDK is unavailable.
- **Account Syncing**: Google sign-in now automatically syncs account data (name, profile picture) when students login with existing email accounts, merging manual and Google accounts seamlessly.
- **Email Verification Sync Fix**: Fixed critical issue where admin-verified users couldn't log in. Authentication now checks both Firebase Auth verification AND admin verification status in Firestore database, allowing admin-verified accounts to access the application.
- **Enhanced Signup Validation**: Implemented strict input validation and formatting for Student ID (exactly 7 numbers only) and Philippine phone number format (+63 9XX XXX XXXX). Added real-time input formatting, abuse prevention measures including password strength checks, and improved user guidance with clear placeholders and error messages.
- **Admin Dashboard Optimizations** (November 2025):
  - Added sorting functionality for users and stalls lists (alphabetical by name and by date created)
  - Fixed auto-login bug when admin creates accounts by adding logout call after account creation
  - Created backend API endpoint (`/api/admin/delete-user/:userId`) with Firebase Admin SDK integration for proper user deletion from both Firestore and Firebase Authentication
  - Implemented graceful fallback handling with accurate status reporting when Firebase Admin SDK is unavailable
  - Completely removed categories management feature (tab, UI, state, and all related functions)
  - Streamlined stall owner account creation form by removing student number, phone number fields, and stall information section (stalls are now created separately)
- **Menu Item Ordering System** (November 2025):
  - Implemented HTML5 native drag-and-drop functionality for menu items in stall dashboard after React 18 compatibility issues with popular drag-and-drop libraries (@hello-pangea/dnd, react-beautiful-dnd)
  - Added `displayOrder` field to menu items in Firestore for persistent ordering
  - Stall owners can now easily rearrange menu items by dragging and dropping with visual feedback
  - Student-facing restaurant view displays menu items in stall owner's preferred order
  - Fixed Edit button hover styling in menu items to maintain proper text visibility
- **System Updates Management** (November 9, 2025):
  - Added comprehensive Updates tab in admin dashboard for tracking system versions and changes
  - Real-time subscription to Firestore `system_updates` collection with reverse-chronological ordering
  - Create Update dialog with version, title, description, and changes list management
  - Announce functionality that sends notifications to all users about system updates
  - Pre-defined 19 initial updates (v1.0-2.9) covering ALL documented features and changes
  - One-click "Populate Initial Updates" button for easy system update history initialization
  - Mobile-responsive 4-column card layout displaying version, release date, and announcement status
  - Complete version history from initial launch through all security fixes, UX improvements, and feature additions

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with custom university branding, Radix UI primitives, shadcn/ui components
- **State Management**: Context API with `useReducer`
- **Routing**: Wouter
- **Data Fetching**: TanStack Query (React Query)
- **Design Principles**: Mobile-first, responsive design with PWA capabilities. UI/UX features include a bottom navigation bar, visual restaurant cards, interactive menu item selection, real-time cart management, order tracking with QR code generation, and robust search/filter functionalities. Splash screens and loading indicators utilize liquid glass effects and animations.

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ESM modules
- **Database**: PostgreSQL with Drizzle ORM (using Neon serverless PostgreSQL)
- **Authentication**: Credential-based session management with role-based access (Student, Stall Owner, Admin). Supports Google sign-in with domain restrictions (`@ub.edu.ph`) and email verification.
- **API Design**: RESTful endpoints with error handling.
- **Storage**: In-memory storage with an interface for future database integration.

### Core Features
- **Authentication System**: Login/Register, Student ID integration, Role-Based Access, Session Management. Includes password change and profile picture upload functionality.
- **Order Management**: Pre-ordering with scheduled pickup times, QR code system for order verification, real-time status tracking, and group ordering.
- **Stall Dashboard**: Comprehensive order management (view, cancel), customer info display, smart filtering, and analytics (revenue, popular items, order status breakdown).
- **Notifications**: Push notification system for order status changes, penalties, email verification reminders, and announcements.
- **Security**: Email domain restriction, email verification enforcement (blocks unverified student logins), mandatory fields (Student ID, phone number), Philippine phone validation, and Terms of Service agreement.
- **Loyalty Points System**: Complete functional system with point earning (1 point per ₱10), redemption (100 points = ₱10 discount), tier system (Bronze/Silver/Gold), transaction history, and checkout integration. Includes bonus rewards for trying new stalls.

### Deployment
- **Development**: Vite dev server, Neon PostgreSQL, Node.js environment.
- **Production**: Vite build for client, `esbuild` for server, Express.js serving static files and API, PostgreSQL with connection pooling. Deployed via Replit hosting.
- **Database Management**: Drizzle Kit for schema migrations, TypeScript-first schema with Zod validation, in-memory seeding for development.

## External Dependencies

### Core Framework Dependencies
- `@tanstack/react-query`
- `wouter`
- `drizzle-orm`
- `@neondatabase/serverless`

### UI/UX Dependencies
- `@radix-ui/react-*`
- `tailwindcss`
- `class-variance-authority`
- `lucide-react`
- `qrcode`

### Development Dependencies
- `vite`
- `typescript`
- `@replit/vite-plugin-*`
- `tsx`