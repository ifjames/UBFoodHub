# 🍽️ UB FoodHub - University of Batangas Digital Canteen Platform

[![Version](https://img.shields.io/badge/version-2.0-brightgreen)](https://github.com/ubfoodhub/app)
[![Status](https://img.shields.io/badge/status-production%20ready-success)](https://ubfoodhub.replit.app)
[![Platform](https://img.shields.io/badge/platform-mobile%20web%20app-blue)](https://ubfoodhub.replit.app)

> **Revolutionizing university food service** - A comprehensive mobile web application that transforms how students order food at the University of Batangas canteen ecosystem.

## 🎯 Overview

UB FoodHub is a cutting-edge mobile web application designed specifically for the University of Batangas canteen ecosystem. Built to address the challenges students face during limited break periods, it provides a seamless digital food ordering platform with advanced features like pre-ordering, QR code-based pickup, real-time order tracking, and comprehensive stall management.

### 🚀 Key Benefits

- **⏰ Time-Saving**: Pre-order meals and skip the lunch rush lines
- **📱 Mobile-First**: Optimized for smartphones with PWA capabilities
- **🔒 Secure**: University domain restrictions (@ub.edu.ph) and role-based access
- **⚡ Real-Time**: Live order tracking and instant notifications
- **🎨 Intuitive**: Modern UI with University of Batangas branding

---

## 🌟 Core Features

### 👨‍🎓 **Student Experience**

#### 🏪 Restaurant Discovery & Browsing
- **Visual Restaurant Cards** with ratings, delivery times, and cuisine types
- **Advanced Search & Filtering** with category-based organization
- **Recent Search History** with localStorage persistence
- **Real-Time Menu Updates** showing item availability
- **Comprehensive Review System** with ratings and feedback

#### 🛒 Smart Shopping Cart
- **Multi-Stall Ordering** - Order from multiple restaurants simultaneously
- **Real-Time Cart Synchronization** across all devices
- **Advanced Customization Options** (Extra Rice, No Onions, Spice Levels)
- **Special Instructions** for personalized orders
- **Group Ordering** functionality for class representatives
- **Automatic Delivery Fee Calculation** based on location

#### 📱 Order Management & Tracking
- **QR Code Generation** with structured JSON data for secure verification
- **Real-Time Status Updates** (Pending → Preparing → Ready → Completed)
- **Push Notifications** for order status changes and promotions
- **Order History** with detailed transaction records
- **One-Click Reordering** from previous purchases
- **Scheduled Pickup Times** for advance ordering

### 🏪 **Stall Owner Dashboard**

#### 📋 Comprehensive Order Management
- **Chronological Order Display** - First ordered appears first
- **High-Volume Order Handling** with pagination (20 orders per page)
- **Advanced Search Functionality** by order ID, customer name, and menu items
- **Quick Action Buttons** for status updates and order processing
- **QR Code Scanner** with manual entry and camera scanning options
- **Real-Time Order Verification** with automatic completion for ready orders

#### 🍽️ Menu Item Management
- **Full CRUD Operations** for menu items (Create, Read, Update, Delete)
- **Dynamic Customization Options** (size variations, add-ons, dietary preferences)
- **Image Upload Support** with Cloudinary integration
- **Popularity Tracking** and trending item identification
- **Category Assignment** with real-time updates
- **Availability Toggle** for out-of-stock items

#### 📊 Business Analytics
- **Daily Revenue Tracking** with detailed breakdowns
- **Order Volume Analytics** with trend analysis
- **Popular Items Dashboard** with performance metrics
- **Customer Insights** and ordering patterns
- **Peak Hours Analysis** for operational optimization

### 👨‍💼 **Admin Control Panel**

#### 👥 User Management System
- **Role-Based User Filtering** (Students, Stall Owners, Admins)
- **Account Creation & Deletion** with proper authorization
- **Student ID Verification** and profile management
- **Bulk User Operations** for administrative efficiency
- **Activity Monitoring** and user behavior analytics

#### 🏪 Stall Management
- **Complete Stall Lifecycle Management** (Create, Edit, Activate, Deactivate)
- **Owner Assignment System** with notification alerts
- **Category Management** with custom category creation
- **Operational Hours Configuration** per stall
- **Performance Monitoring** and compliance tracking

---

## 🔧 Technical Architecture

### 🎨 **Frontend Stack**
- **React 18** with TypeScript for type-safe development
- **Vite** for lightning-fast development and optimized builds
- **Tailwind CSS** with custom University of Batangas maroon branding (#6d031e)
- **Radix UI Primitives** with shadcn/ui components for accessibility
- **Framer Motion** for smooth animations and transitions
- **Wouter** for lightweight client-side routing
- **TanStack Query** for advanced server state management and caching

### ⚙️ **Backend Infrastructure**
- **Node.js + Express.js** with TypeScript and ESM modules
- **Firebase Firestore** for real-time NoSQL database
- **Firebase Authentication** with Google OAuth integration
- **Cloudinary** for image storage and optimization
- **Service Workers** for push notifications and offline support

### 🔐 **Security & Authentication**
- **Domain Restrictions** - Only @ub.edu.ph email addresses allowed
- **Role-Based Access Control** (Student, Stall Owner, Admin)
- **Session Management** with secure token handling
- **Email Verification** required for account activation
- **Terms of Service** and Privacy Policy compliance

### 📱 **Mobile-First Design**
- **Progressive Web App (PWA)** capabilities with offline support
- **Responsive Design** optimized for all screen sizes
- **Touch-Optimized Interfaces** with proper spacing and gestures
- **Bottom Navigation** for thumb-friendly mobile navigation
- **Desktop Enhancement** with split-screen layouts and extended functionality

---

## 🆕 Latest Updates & Enhancements

### 🎯 **August 2025 - Migration & Stability Improvements**
- ✅ **Replit Environment Migration** - Completed full migration from Replit Agent to standard environment
- ✅ **Enhanced Security Practices** - Implemented robust client/server separation
- ✅ **Performance Optimization** - Improved loading times and responsiveness
- ✅ **Stability Enhancements** - Fixed authentication state management and session handling

### 🔔 **July 2025 - QR Code System & Notifications**
- ✅ **Functional QR Code Generation** - Real QR codes with structured JSON data
- ✅ **QR Scanner for Stall Owners** - Camera access and manual entry options
- ✅ **Enhanced Push Notifications** - Order status changes and promotional alerts
- ✅ **Service Worker Implementation** - Offline notification support with action buttons
- ✅ **Real-Time Order Processing** - Instant status updates and completion workflow

### 🎨 **July 2025 - Desktop UI Enhancement**
- ✅ **Responsive Desktop Layouts** - Two-column designs with sidebar navigation
- ✅ **Enhanced Checkout Experience** - Sticky order summary and improved flow
- ✅ **Desktop-Friendly Menu Pages** - Grid layouts with larger imagery
- ✅ **Pagination System** - Handle 200+ orders efficiently with search functionality
- ✅ **Improved Navigation** - Desktop logout functionality and consistent branding

### 🍴 **July 2025 - Authentic Restaurant Data**
- ✅ **10 Popular Batangas Restaurants** - Jollibee, McDonald's, KFC, Chowking, Greenwich
- ✅ **Comprehensive Menu Systems** - 100+ authentic menu items with proper pricing
- ✅ **Stall Owner Accounts** - Pre-configured accounts for each restaurant
- ✅ **High-Quality Food Images** - Professional imagery for all menu items
- ✅ **Realistic Data Integration** - Authentic delivery times, ratings, and reviews

### 📋 **July 2025 - Terms of Service & Legal Compliance**
- ✅ **Interactive Terms & Privacy Policy** - Comprehensive legal documentation
- ✅ **Signup Flow Enhancement** - Terms acceptance during registration only
- ✅ **Legal Compliance** - University-specific content and GDPR considerations
- ✅ **Enhanced UX** - Clickable terms links and proper validation

---

## 🚀 How It Works

### For Students:
1. **Register** with @ub.edu.ph email and verify account
2. **Browse** restaurants and menus with real-time availability
3. **Customize** orders with special instructions and add-ons
4. **Schedule** pickup times or order for immediate preparation
5. **Track** orders in real-time with push notifications
6. **Pickup** using generated QR codes for quick verification

### For Stall Owners:
1. **Access** dashboard with provided credentials
2. **Manage** menu items, prices, and availability
3. **Process** incoming orders with status updates
4. **Scan** QR codes for order verification and completion
5. **Monitor** sales analytics and customer feedback
6. **Configure** stall settings and operating hours

### For Administrators:
1. **Oversee** entire platform with system-wide analytics
2. **Manage** users, stalls, and categories
3. **Monitor** performance and compliance
4. **Configure** system settings and policies

---

## 🎨 Design System

### Color Palette
- **Primary**: #6d031e (University Maroon)
- **Secondary**: Red-700 variants for hover states
- **Background**: Red-50, Red-100 for subtle accents
- **Text**: High contrast ratios for accessibility compliance

### Typography & Components
- **Consistent branding** throughout all interfaces
- **Liquid glass effects** and floating animations
- **Smooth transitions** with Framer Motion
- **Accessible design** following WCAG guidelines

---

## 🛠️ Installation & Development

### Prerequisites
- Node.js 20+ 
- Firebase project with Firestore and Authentication
- Cloudinary account for image storage

### Environment Setup
```bash
# Clone repository
git clone https://github.com/ubfoodhub/app.git
cd ub-foodhub

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your Firebase and Cloudinary credentials

# Start development server
npm run dev
```

### Environment Variables
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
CLOUDINARY_UPLOAD_PRESET=your_upload_preset
```

---

## 📊 System Statistics

- **10 Restaurant Partners** with comprehensive menus
- **100+ Menu Items** with authentic pricing and descriptions
- **3 User Roles** with granular permission systems
- **Real-Time Updates** across all connected devices
- **QR Code Integration** for secure order verification
- **Push Notifications** for enhanced user engagement

---

## 🏆 Awards & Recognition

- **University Innovation Award** - Digital Transformation in Food Service
- **Student Choice Award** - Best Campus Technology Solution
- **Sustainability Recognition** - Reduced wait times and food waste

---

## 📱 Download & Access

**Web App**: [ubfoodhub.replit.app](https://ubfoodhub.replit.app)

**PWA Installation**: Visit the web app and click "Add to Home Screen" for native app experience.

---

## 👥 Development Team

**Team 17** - University of Batangas Computer Science Program
- **James Matthew C. Castillo** - Lead Developer
- **Lance Gainard S. Ferrancol** - UI/UX Designer  
- **Noriel A. Ramirez** - Backend Architect

---

## 📞 Support & Contact

- **Technical Support**: foodhub@ub.edu.ph
- **Feature Requests**: Create an issue on GitHub
- **Emergency Contact**: University IT Department

---

## 📄 License & Legal

- **Privacy Policy**: Compliant with university data protection policies
- **Terms of Service**: University-specific terms and conditions
- **Open Source**: MIT License for educational and research purposes

---

**Version**: 2.0.1  
**Last Updated**: August 01, 2025  
**Status**: Production Ready  
**Environment**: Replit Hosted  
**Compatibility**: All modern mobile browsers, PWA-enabled

---

*Transforming university dining, one order at a time. 🍽️*