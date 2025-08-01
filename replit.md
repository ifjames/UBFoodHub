# UB FoodHub - Mobile Web Application

## Overview
UB FoodHub is a mobile web application for the University of Batangas canteen ecosystem, designed to streamline food ordering. It enables students to pre-order, use QR code-based pickup, and improves canteen operations during limited break periods. The project aims to digitize the university's food service, enhancing convenience for students and efficiency for canteen staff.

## User Preferences
Preferred communication style: Simple, everyday language.

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
- **Security**: Email domain restriction, email verification, mandatory fields (Student ID, phone number), Philippine phone validation, and Terms of Service agreement.

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