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
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```