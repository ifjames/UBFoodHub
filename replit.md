# UB FoodHub - Mobile Web Application

## Overview

UB FoodHub is a comprehensive mobile web application designed for the University of Batangas canteen ecosystem. The system addresses the challenges students face during limited break periods by providing a digital food ordering platform that enables pre-ordering, QR code-based pickup, and streamlined canteen operations.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Styling**: Tailwind CSS with custom maroon university branding
- **Component Library**: Radix UI primitives with shadcn/ui components
- **State Management**: Context API with useReducer for user state and cart management
- **Routing**: Wouter for lightweight client-side routing
- **Data Fetching**: TanStack Query (React Query) for server state management
- **Mobile-First**: Responsive design with PWA capabilities

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ESM modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon serverless PostgreSQL
- **Authentication**: Simple credential-based auth (session management placeholder)
- **API Design**: RESTful endpoints with proper error handling
- **Storage**: In-memory storage implementation with interface for future database integration

### Database Schema
- **Users**: Student/staff authentication with role-based access
- **Restaurants**: Canteen stalls with owner management
- **Menu Items**: Food items with categories, availability, and pricing
- **Orders**: Order management with status tracking and QR codes
- **Cart Items**: Shopping cart functionality with user sessions
- **Reviews**: Rating and feedback system for restaurants

## Key Components

### Mobile Interface
- **Bottom Navigation**: Primary navigation with cart badge
- **Restaurant Cards**: Visual menu browsing with ratings and delivery info
- **Menu Items**: Interactive food selection with quantity controls
- **Cart Management**: Real-time cart updates with floating cart indicator
- **Order Tracking**: Status-based order monitoring with QR code generation
- **Search & Filter**: Category-based filtering and text search

### Authentication System
- **Login/Register**: Dual-tab interface for user onboarding
- **Student ID Integration**: University-specific student identification
- **Role-Based Access**: Student, stall owner, and admin roles
- **Session Management**: Context-based user state persistence

### Order Management
- **Pre-Ordering**: Advanced scheduling for pickup times
- **QR Code System**: Unique codes for order verification
- **Status Tracking**: Real-time order status updates
- **Representative System**: Bulk ordering for class sections

## Data Flow

1. **User Authentication**: Login/register → Context state → Protected routes
2. **Restaurant Discovery**: API fetch → Query cache → Restaurant cards
3. **Menu Browsing**: Restaurant selection → Menu API → Category filtering
4. **Cart Operations**: Add items → Local state → API persistence
5. **Order Placement**: Cart checkout → Order API → QR code generation
6. **Order Tracking**: Status updates → Real-time notifications → Pickup confirmation

## External Dependencies

### Core Framework Dependencies
- **@tanstack/react-query**: Server state management and caching
- **wouter**: Lightweight routing solution
- **drizzle-orm**: Type-safe database operations
- **@neondatabase/serverless**: PostgreSQL serverless driver

### UI/UX Dependencies
- **@radix-ui/react-***: Accessible component primitives
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Type-safe CSS class variants
- **lucide-react**: Icon library

### Development Dependencies
- **vite**: Build tool and development server
- **typescript**: Type safety and developer experience
- **@replit/vite-plugin-***: Replit-specific development tools

## Deployment Strategy

### Development
- **Local Development**: Vite dev server with hot module replacement
- **Database**: Neon PostgreSQL with Drizzle migrations
- **Environment**: Node.js with environment variable configuration

### Production
- **Build Process**: Vite build for client + esbuild for server
- **Server**: Express.js serving static files and API routes
- **Database**: PostgreSQL with connection pooling
- **Deployment**: Replit hosting with automatic deployment

### Database Management
- **Migrations**: Drizzle Kit for schema management
- **Schema**: TypeScript-first with Zod validation
- **Seeding**: In-memory storage with sample data for development

## Recent Changes

### Terms of Service Enhancement & Migration Completion (July 17, 2025)
- **Terms of Service Placement**: Moved Terms of Service checkbox to only appear during signup, not login, matching user requirements
- **Interactive Terms & Privacy Policy**: Created comprehensive Terms of Service and Privacy Policy dialogs with full legal content
- **Clickable Links**: Added clickable links in the terms checkbox that open dedicated dialogs for Terms of Service and Privacy Policy
- **Enhanced Validation**: Added proper validation to ensure users must agree to terms before creating an account
- **Improved UX**: Terms checkbox now properly disables the "Create Account" button until checked, improving user experience
- **Legal Compliance**: Added detailed Terms of Service and Privacy Policy content specific to UB FoodHub's university context
- **Migration Completion**: Successfully completed migration from Replit Agent to standard Replit environment with all security practices intact
- **Role-Based Routing**: Implemented proper role-based redirection after login (admin→/admin, stall_owner→/stall-dashboard, student→/)
- **Authentication Issues**: Fixed authentication guard and login routing, but form refresh issue persists during development due to hot module replacement

### Responsive Desktop Login Design Implementation (July 17, 2025)
- **Split-Screen Desktop Layout**: Successfully implemented responsive design with campus background on left and login form on right for desktop/PC screens
- **Preserved Mobile Design**: Maintained original mobile layout which works flawlessly on small screens
- **Enhanced Visual Effects**: Added liquid glass effects, floating particles, and animated UB FoodHub logo to desktop left panel
- **Proper Button Styling**: Restored "Continue with UB Mail" button with UB logo and site color theme, made email button white with outline
- **Terms & Conditions Checkbox**: Restored required checkbox for terms agreement before login/signup
- **Domain Restrictions**: Ensured Google authentication and email signup only allows @ub.edu.ph domain
- **Authentication Functions**: Fixed missing useAuth export and proper Firebase authentication integration
- **Responsive Navigation**: Fixed router navigation using wouter's useLocation hook properly

### Replit Agent Migration & Authentication Enhancement (July 12, 2025)
- **Successful Migration**: Completed migration from Replit Agent to standard Replit environment with enhanced stability
- **Authentication State Synchronization**: Added timeout protection and enhanced error handling for Firebase auth state management
- **Resolved Authentication Issues**: Fixed "authentication expired" errors in password changes and profile picture uploads
- **Enhanced Error Messaging**: Added specific error messages for authentication sync issues between Firebase and local store
- **Improved Firebase Auth Handling**: Added fallback mechanisms for when Firebase auth.currentUser is null but user data exists in store
- **Admin Food Stall Creation**: Admins can now create complete food stall accounts with email addresses like chowking@foodhub.com
- **Admin User Verification**: Admins can manually verify user accounts without requiring email verification
- **Fixed Push Notifications**: Resolved notification service worker issues and improved mobile compatibility 
- **Enhanced User Management**: Added verification badges and stall owner creation workflow
- **Improved Error Handling**: Better authentication state management and error messages
- **Complete Account Creation System**: Added "Create Account" button and modal in admin dashboard for creating student, stall owner, and admin accounts
- **Role-Based Profile Completion**: Profile completion modal now only appears for students, not admins or food stall owners
- **Enhanced Loading Screen**: Fixed authentication loading screen to display proper UB logo and maroon color theme
- **Settings Page Authentication Fix**: Resolved "not authenticated" errors in settings page with proper user state validation
- **Enhanced Firebase Authentication**: Added timeout handling for Firebase auth state synchronization to prevent authentication failures
- **Improved Push Notifications**: Enhanced notification service with better error handling and test notification functionality
- **Robust Authentication Handling**: Implemented fallback auth state listening for password changes and profile picture updates
- **Migration Completion**: Successfully completed migration with all authentication issues resolved and enhanced security practices

### Functional Password Change and Profile Picture Features (July 12, 2025)
- **Password Change Implementation**: Full Firebase authentication integration with current password verification
- **Profile Picture Upload**: Users can upload custom profile pictures with Firebase Storage integration
- **Google Account Sync**: Automatic synchronization of Google profile pictures for Google Auth users
- **Enhanced User Interface**: Profile pictures display throughout the app (profile page, settings)
- **File Validation**: Image type and size validation (max 5MB) with user-friendly error messages
- **Real-time Updates**: Profile changes update immediately across all app components
- **Security Features**: Password change requires current password verification and sends security notifications
- **Loading States**: Proper loading indicators for all profile update operations

### Enhanced Responsive Design for Profile Settings (July 12, 2025)
- Fixed settings button accessibility issue on desktop/tablet screens
- Added desktop-friendly settings button in profile header (hidden md:flex)
- Created additional settings card in desktop layout for better UX
- Improved responsive grid layout for profile sections (2-column on md+ screens)
- Enhanced profile header with better card styling and spacing
- Maintained mobile-first design while ensuring desktop compatibility

## Previous Changes

### Firebase Hosting Deployment (July 11, 2025)
- Successfully deployed UB FoodHub to Firebase hosting at https://ubianfoodhub.web.app
- Connected to user's existing Firebase project (ubianfoodhub) with proper authentication
- Configured Firebase hosting with optimized build and routing for single-page application
- Maintained all existing Firebase authentication and Firestore functionality
- Mobile-optimized deployment ready for University of Batangas students

### Comprehensive Push Notification System (July 12, 2025)
- **Fixed Notification Permission Detection**: Resolved browser permission status detection issues with real-time monitoring
- **Enhanced Notification Service**: Complete rewrite with service worker support for better mobile compatibility
- **Order Status Notifications**: Automatic push notifications when order status changes (preparing, ready, cancelled, completed)
- **Penalty Notifications**: Push alerts when students receive penalties with reason and amount details
- **Email Verification Reminders**: Automatic notifications for unverified email addresses
- **Admin Announcements**: Push notifications for important university announcements
- **Security Notifications**: Alerts for password changes and account security updates
- **Mobile App Compatibility**: Service worker integration ensures notifications work in Android app wrapper
- **Notification History**: Local storage of notification history for user reference
- **Desktop Responsive Design**: Enhanced profile page settings button visibility on larger screens
- **Test Notification Feature**: Users can send test notifications to verify functionality
- **Comprehensive Permission Guidance**: Clear instructions for enabling notifications in different browsers

### Replit Agent to Standard Replit Migration (July 11, 2025)
- Successfully migrated project from Replit Agent environment to standard Replit environment
- Fixed TypeScript execution with tsx dependency
- Resolved userStall undefined error in stall dashboard by using stallInfo instead
- Enhanced UI/UX by improving button layout in orders page:
  - Made "View Details" button full-width and more readable (h-12, text-base)
  - Reorganized button layout with primary action on top and secondary actions below
  - Fixed button sizing issues that made text hard to read
- All workflows now running properly on standard Replit infrastructure
- Maintained all Firebase authentication and Firestore functionality during migration
- Ensured security practices and client/server separation remain intact

### Firebase Integration & Migration (July 06, 2025)
- Migrated from Replit Agent to standard Replit environment
- Fixed Firebase duplicate app initialization errors
- Implemented proper logout functionality with Firebase signOut
- Added UB FoodHub logo to login page with maroon gradient background
- Created role-based authentication system (admin, stall_owner, student)

### Login Page Redesign (July 06, 2025)
- Redesigned login page to match user's reference design with maroon theme
- Implemented dual-mode login: social login page and email login forms
- Added beautiful animations with logo animations and loading states
- Google authentication button design (functionality coming soon)
- Email-based login and registration with proper validation
- Updated to dark red/maroon background that blends with logo
- Improved text contrast with white labels and red accent colors
- Enhanced form styling with semi-transparent backgrounds

### Real-Time Data & Search (July 06, 2025)
- Removed ALL hardcoded sample data from search page
- Implemented real-time search using Firestore data
- Added recent searches functionality with localStorage
- Dynamic category filtering based on actual restaurant data
- Live data synchronization using Firestore subscriptions throughout the app

### Enhanced UX (July 06, 2025)
- Fixed logout functionality to properly clear Firebase auth and redirect
- Added loading animations with logo and spinning circles
- Implemented maroon color theme throughout the application
- Enhanced animations for login, search, and navigation
- Dark theme login page with improved visual hierarchy and readability
- Hidden all scrollbars while maintaining scroll functionality
- Improved button contrast and hover states for better visibility
- Fixed stall dashboard form validation and menu item creation

### Comprehensive Stall Dashboard Enhancement (July 06, 2025)
- **Enhanced Order Management**: Added detailed customer information display with payment method and cash change calculations
- **Smart Filtering Systems**: Implemented filtering for both menu items (by category and search) and orders (by status)
- **Cancel Order Functionality**: Stall owners can now cancel pending and preparing orders with confirmation
- **Detailed Order Modal**: Added comprehensive order details view with customer info, items, payment details, and special instructions
- **Statistics & Analytics Page**: Complete statistics dashboard showing:
  - Revenue tracking (only from completed orders)
  - Popular items analysis with sales counts and revenue
  - Order status breakdown with visual badges
  - Menu performance metrics
  - Monthly revenue trends and key performance indicators
- **Revenue Accuracy**: Revenue calculations now only count completed orders, not pending/preparing ones
- **Professional Order Display**: Enhanced order cards with customer names, payment info, and organized item listings

### Modern UI/UX Enhancement (July 06, 2025)
- **Splash Screen**: Added beautiful animated splash screen with logo animation, glass morphism effects, and floating particles
- **Loading Indicators**: Implemented modern loading components with logo animations, spinning circles, and contextual messages
- **Liquid Glass Effects**: Added backdrop blur effects, glass morphism cards, and liquid animations throughout the app
- **Auto-Dismissing Notifications**: Toast notifications now automatically disappear after 3-4 seconds (4s normal, 6s errors)
- **Real-Time Updates**: All pages now update dynamically without requiring refresh or tab switching
- **Enhanced Animations**: Added smooth transitions, hover effects, floating animations, and liquid button effects
- **Dynamic Menu Items**: Menu items now include glass card effects, floating animations, and smooth add-to-cart interactions
- **Improved Loading States**: "Adding to Cart", "Updating Order", and other actions now show proper loading indicators

### Comprehensive Loading States Implementation (July 06, 2025)
- **Universal Loading Design**: Implemented splash screen-inspired loading overlays for all major user actions
- **Contextual Loading Messages**: Added specific loading messages like "Fetching stalls...", "Adding to cart...", "Preparing checkout...", etc.
- **Cart Action Loading**: All cart operations now show proper loading states with disabled buttons and visual feedback
- **Restaurant Browsing**: Added loading indicators when fetching restaurant data with UB logo animation
- **Full-Screen Loading Overlays**: Created beautiful loading overlays that match the splash screen design with floating particles
- **Button Loading States**: Quantity buttons, remove buttons, and checkout buttons show loading indicators during operations
- **Navigation Loading**: Added loading states for page transitions and major navigation actions

### UI Color Consistency Fixes (July 06, 2025)
- **Fixed Cart Back Button**: Changed from black to white with hover effects that don't hurt the eyes
- **Header Color Matching**: Made all page headers use consistent gradient from home, search, and cart pages
- **Maroon Theme Consistency**: Applied the university's maroon color scheme consistently across all components
- **Improved Button Contrast**: Enhanced visibility and accessibility of all interactive elements

### Enhanced Authentication & Security Implementation (July 06, 2025)
- **Google Authentication**: Fully implemented Google sign-in with Firebase popup authentication
- **Email Domain Restriction**: Only @ub.edu.ph email addresses are allowed for both registration and Google authentication
- **Email Verification**: Automatic email verification sent upon registration, users must verify before account activation
- **Required Fields Enhancement**: Student ID and phone number are now mandatory for all registrations
- **Philippine Phone Validation**: Added proper phone number validation for Philippine mobile numbers (+639xxx or 09xxx format)
- **Terms of Service Agreement**: Added required checkbox for Terms of Service and Privacy Policy acceptance
- **Role Management**: Removed role selection from registration - all new users default to student role, admin assigns roles manually
- **Enhanced Form Validation**: Comprehensive client-side validation with user-friendly error messages
- **Security Improvements**: Email domain validation prevents unauthorized registrations, proper error handling for authentication flows
- **Firebase Security**: Moved Firebase configuration to environment variables for enhanced security

### Advanced Cart & Ordering Features Implementation (July 06, 2025)
- **Group Ordering System**: Students can add @ub.edu.ph email addresses to include friends in their orders
- **Scheduled Pickup Times**: Order Later feature like FoodPanda - students can schedule pickup times
- **Multi-Stall Ordering**: Students can order from different stalls in one consolidated order
- **Enhanced Cash Validation**: Shows proper "amount is not enough" validation when cash amount is below total
- **Stall Dashboard Enhancements**: Food stall owners can now see:
  - Group order information with all member emails listed
  - Scheduled pickup times with clear deadline indicators
  - Multi-stall order coordination information
  - Enhanced order cards with badges for special order types
  - Detailed order modal with all group/scheduling information
- **Improved Order Display**: Visual badges for group orders, scheduled orders, and multi-stall orders
- **Order Coordination**: Multi-stall orders show main order ID for coordination between stalls

## Changelog

```
Changelog:
- July 06, 2025. Initial setup
- July 06, 2025. Firebase Authentication & Firestore integration
- July 06, 2025. Role-based dashboards (Admin, Stall Owner, Student)
- July 06, 2025. Real-time data synchronization and QR code system
- July 06, 2025. Login page redesign with maroon theme and animations
- July 06, 2025. Removed all hardcoded data, implemented real-time search
- July 06, 2025. Fixed logout functionality and enhanced UX
- July 06, 2025. Fixed stall dashboard form validation and improved color contrast
- July 06, 2025. Fixed customer name and student ID display in order details
- July 06, 2025. Added splash screen with beautiful animations and glass effects
- July 06, 2025. Implemented liquid glass effects and modern loading indicators
- July 06, 2025. Made all pages dynamically update without refresh
- July 06, 2025. Auto-dismissing notifications and enhanced animations
- July 06, 2025. Implemented comprehensive loading states using splash screen design
- July 06, 2025. Fixed cart back button color and matched header colors across all pages
- July 06, 2025. Added contextual loading messages for all user actions (add, checkout, remove, etc.)
- July 06, 2025. Enhanced authentication security with @ub.edu.ph domain restriction and Firebase environment variables
- July 06, 2025. Implemented advanced cart features: group ordering, scheduled pickup, multi-stall ordering
- July 06, 2025. Enhanced stall dashboard to display group order details and scheduled pickup times for food stall owners
- July 11, 2025. Successful Firebase hosting deployment at https://ubianfoodhub.web.app
- July 11, 2025. Migration from Replit Agent to standard Replit environment with enhanced stability
- July 12, 2025. Comprehensive push notification system with mobile app compatibility and desktop responsive fixes
- July 12, 2025. Functional password changing and profile picture features with Google account sync
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```