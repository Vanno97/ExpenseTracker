# ExpenseTracker Pro - Personal Finance Management Application

## Overview

ExpenseTracker Pro is a full-stack personal finance management application built with a modern React frontend and Express.js backend. The application enables users to track expenses, manage budgets, and visualize financial data through interactive charts and analytics.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Library**: Radix UI components with shadcn/ui design system
- **Styling**: Tailwind CSS with CSS variables for theming
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts for data visualization

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Pattern**: RESTful API design
- **Development**: tsx for TypeScript execution in development
- **Build**: esbuild for production bundling

### Data Storage Solutions
- **Database**: PostgreSQL with Drizzle ORM
- **Connection**: Neon Database serverless PostgreSQL
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Fallback Storage**: In-memory storage for development and localStorage for client-side persistence

## Key Components

### Database Schema
- **Expenses Table**: Core expense tracking with fields for description, category, amount, date, and timestamps
- **Budgets Table**: Budget management by category and month with spending limits
- **Validation**: Zod schemas for runtime type checking and validation

### UI Components
- **Dashboard**: Main interface with expense overview, charts, and quick actions
- **Forms**: Add/edit expense forms with category selection and validation
- **Charts**: Pie charts for category breakdown and line charts for trend analysis
- **Budget Tracking**: Progress bars and budget vs. actual spending comparisons
- **Expense List**: Paginated list with filtering capabilities

### Expense Categories
Predefined categories include:
- Alimentari (Food/Groceries)
- Trasporti (Transportation)
- Bollette (Bills/Utilities)
- Intrattenimento (Entertainment)
- Salute (Health)
- Shopping
- Altro (Other)

## Data Flow

1. **Client State Management**: TanStack Query handles server state with automatic caching and synchronization
2. **Form Validation**: React Hook Form with Zod resolvers ensure data integrity before submission
3. **API Communication**: RESTful endpoints for CRUD operations on expenses and budgets
4. **Data Persistence**: PostgreSQL for production with in-memory fallback for development
5. **Client-side Caching**: localStorage backup for offline functionality

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL connection
- **drizzle-orm**: Type-safe database ORM
- **@tanstack/react-query**: Server state management
- **react-hook-form**: Form handling and validation
- **recharts**: Chart library for data visualization
- **date-fns**: Date manipulation and formatting

### UI Dependencies
- **@radix-ui/***: Accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **lucide-react**: Icon library

## Deployment Strategy

### Development Environment
- **Frontend**: Vite dev server with HMR (Hot Module Replacement)
- **Backend**: tsx for TypeScript execution with auto-restart
- **Database**: Connection to Neon serverless PostgreSQL
- **Replit Integration**: Cartographer plugin for development environment integration

### Production Build
- **Frontend**: Vite builds static assets to `dist/public`
- **Backend**: esbuild bundles server code to `dist/index.js`
- **Database**: Drizzle migrations applied via `db:push` script
- **Serving**: Express serves both API routes and static frontend assets

### Environment Configuration
- **DATABASE_URL**: Required environment variable for PostgreSQL connection
- **NODE_ENV**: Controls development vs production behavior
- **Build Scripts**: Separate build processes for frontend and backend with single production start command

The application follows a monorepo structure with shared TypeScript types and schemas, enabling type safety across the full stack while maintaining clean separation between client and server concerns.

## Recent Changes

### January 21, 2025
- ✓ Fixed budget remaining color visibility using proper CSS variables for theme compatibility
- ✓ Made "Set Budget" button functional with modal interface for category-specific budget creation
- ✓ Added time navigation for charts allowing users to navigate between months (limited to current month maximum)
- ✓ Implemented comprehensive recurring payments system with:
  - Weekly/monthly/yearly frequency options
  - Automatic processing of due payments with duplicate prevention
  - Pause/resume functionality for individual payments
  - Due date notifications and batch processing
  - Automatic backlog processing for payments starting before current month
  - Smart duplicate prevention to avoid multiple processing on same day
- ✓ Created modal components: recurring-payments-modal.tsx, budget-modal.tsx
- ✓ Added RecurringPaymentsSection component with full CRUD operations
- ✓ Fixed accessibility warnings by adding proper aria-describedby attributes to dialogs
- ✓ Reduced API polling interval to 5 minutes to optimize server load