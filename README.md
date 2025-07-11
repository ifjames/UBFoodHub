# UB FoodHub - Mobile Web Application

## Overview

UB FoodHub is a comprehensive mobile web application designed for the University of Batangas canteen ecosystem. The system addresses challenges students face during limited break periods by providing a digital food ordering platform with pre-ordering, QR code-based pickup, and streamlined canteen operations.

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and optimized builds
- **Tailwind CSS** with custom maroon university branding (#6d031e)
- **Radix UI** primitives with shadcn/ui components
- **Framer Motion** for animations
- **Wouter** for lightweight client-side routing
- **TanStack Query** for server state management
- **Firebase** for authentication and real-time database

### Backend
- **Node.js** with Express.js
- **TypeScript** with ESM modules
- **Firebase Firestore** for real-time database
- **Firebase Authentication** for user management

## Features Overview

### 🔐 Authentication System
- **Firebase Authentication** with email/password
- **Role-based access control**: Student, Stall Owner, Admin
- **Real-time user state management**
- **Secure logout functionality** across all dashboards

### 👨‍💼 Admin Dashboard
- **User Management**
  - Filter users by role (All, Students Only, Admins Only, Stall Owners Only)
  - View user details including student IDs
  - Delete non-admin user accounts
  - Role-based badges and identification
- **Stall Management**
  - Create new food stalls
  - Assign stall owners
  - Activate/deactivate stalls
  - Dynamic category assignment
- **Category Management**
  - Create custom food categories
  - Remove custom categories (default categories protected)
  - Real-time category updates across the system
- **Analytics Dashboard**
  - Total users count
  - Total stalls count
  - Active stalls monitoring
  - System overview statistics
- **Mobile-responsive design** with proper logout functionality

### 🏪 Stall Owner Dashboard
- **Menu Item Management**
  - Add new menu items
  - Edit existing items
  - Remove menu items
  - Toggle item availability
  - Mark items as popular
  - **Customizable Options** (Extra Rice, No Onions, Spice Level, etc.)
  - Image upload support
  - Category assignment
- **Order Management**
  - Real-time order tracking
  - Order status updates (Pending → Preparing → Ready → Completed)
  - Order cancellation handling
- **Analytics**
  - Today's revenue tracking
  - Daily order counts
  - Pending orders monitoring
  - Menu item statistics
- **Settings Management**
  - Stall information updates
  - Operating hours configuration
- **QR Code Integration** for order verification

### 🎓 Student Features
- **Restaurant Discovery**
  - Browse available food stalls
  - Category-based filtering
  - Search functionality with real-time results
  - Recent searches with localStorage persistence
  - Rating and review system
- **Menu Browsing**
  - Category-filtered menu display
  - Item availability status
  - Popular item highlighting
  - Price display with customization options
- **Shopping Cart**
  - Add items with quantity selection
  - Customization options per item
  - Real-time cart updates
  - Special instructions support
  - Delivery fee calculation
- **Order Management**
  - Order placement with QR code generation
  - Real-time order tracking
  - Order history with detailed view
  - QR code display for pickup
  - Order cancellation (when allowed)
  - Reorder functionality
- **Profile Management**
  - Personal information display
  - Student ID integration
  - Logout functionality
  - Order history access

### 📱 Mobile-First Design
- **Bottom Navigation** for primary app navigation
- **Responsive layouts** for all screen sizes
- **Touch-optimized interfaces** with proper spacing
- **Progressive Web App** capabilities
- **Floating cart indicator** with item count
- **Dark red/maroon theme** (#6d031e) throughout the application

### 🔄 Real-Time Features
- **Live order status updates**
- **Real-time menu availability**
- **Dynamic cart synchronization**
- **Instant notification system**
- **Firebase Firestore subscriptions** for live data

### 🏷️ QR Code System
- **Unique order codes** for each transaction
- **Pickup verification** system
- **Order tracking** integration
- **Mobile-optimized QR display**

## User Roles & Permissions

### Student
- Browse restaurants and menus
- Add items to cart with customizations
- Place orders and track status
- View order history
- Manage profile settings
- Generate QR codes for pickup

### Stall Owner
- Manage menu items and customizations
- Process incoming orders
- Update order status
- View sales analytics
- Configure stall settings
- Generate and verify QR codes

### Admin
- Manage all users and their roles
- Create and manage food stalls
- Assign stall owners
- Create custom categories
- View system-wide analytics
- Monitor all activities

## Database Schema

### Collections
- **users**: User accounts with role-based access
- **stalls**: Food stall information and settings
- **menuItems**: Menu items with customizations
- **orders**: Order tracking and management
- **cartItems**: Shopping cart functionality
- **categories**: Dynamic category management

## Installation & Setup

### Prerequisites
- Node.js 18+
- Firebase account
- Replit account (for deployment)

### Environment Variables
```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Development Setup
1. Clone the repository
2. Install dependencies: `npm install`
3. Configure Firebase environment variables
4. Start development server: `npm run dev`
5. Access application at `http://localhost:5000`

## Recent Updates (July 06, 2025)

### ✅ Admin Dashboard Enhancements
- Fixed logout functionality with proper Firebase integration
- Added mobile-responsive design with flexible layouts
- Implemented user filtering system (All, Students, Admins, Stall Owners)
- Created dynamic category management system
- Updated color theme to use consistent #6d031e maroon color
- Removed orders overview (reserved for stall owners only)

### ✅ Stall Dashboard Improvements  
- Added logout functionality with user state clearing
- Implemented comprehensive menu item management
- **Added customizable options system** for menu items (Extra Rice, No Onions, etc.)
- Updated color scheme to match brand guidelines
- Enhanced mobile compatibility
- Real-time order processing capabilities

### ✅ Student Experience Enhancements
- Fixed profile page with proper order history navigation
- Updated orders page with full functionality
- Implemented working cart system with checkout process
- Real-time order tracking with QR code generation
- Consistent color theming throughout student interfaces
- All navigation and functionality fully operational

### ✅ Technical Improvements
- Firebase authentication integration with proper logout
- Real-time data synchronization across all components
- Consistent #6d031e color theme application
- Mobile-first responsive design implementation
- Error handling and user feedback systems
- Performance optimizations for real-time updates

## Color Theme
The application uses a consistent maroon color scheme:
- **Primary Color**: #6d031e (Dark Red/Maroon)
- **Hover States**: Red-700 variants
- **Backgrounds**: Red-50, Red-100 for subtle accents
- **Text**: Proper contrast ratios for accessibility

## Navigation Structure
- **Students**: Home → Search → Cart → Orders → Profile
- **Stall Owners**: Overview → Menu → Orders → Settings
- **Admins**: Users → Stalls → Categories

## Deployment
The application is configured for Replit deployment with:
- Automatic build process
- Environment variable configuration
- Production optimization
- Static file serving

## Support & Documentation
For technical support or feature requests, contact the development team or submit issues through the project repository.

---

**Version**: 1.0.0  
**Last Updated**: July 06, 2025  
**Environment**: Production Ready  
**Status**: All functionality operational across all user roles