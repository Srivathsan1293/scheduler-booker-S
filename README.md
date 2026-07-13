# 🗓️ Digvijaya Yatra Booker

A modern, full-stack scheduling application built with Next.js 15, Supabase, and TypeScript. Perfect for businesses and individuals who need to manage appointments and availability with enterprise-grade reliability.

![CI](https://github.com/yourusername/scheduler-booker/workflows/CI/badge.svg)

## ✨ Features

### 🔐 Authentication & Security

- **Secure Login/Signup** with Supabase Auth
- **Email verification** for new accounts
- **Password validation** and comprehensive error handling
- **Route protection** for protected pages and redirects for public pages
- **Session management** with automatic logout functionality

### 🎯 Onboarding Flow

- **Multi-step setup** for new users
- **Business vs Individual** user types
- **Availability configuration** with timezone support
- **Work schedule setup** with customizable hours
- **Smart redirects** for onboarded users

### 📅 Appointment Management

- **Dashboard appointments view** with real-time status updates
- **Smart status management**: Pending → Confirmed → Completed/No-Show
- **Time-based guards**: Prevent premature status changes
- **Grace period handling**: 15-minute grace period for no-show marking
- **Quick actions**: Mark complete, no-show, delete, and rebook
- **Search and filtering**: Client search, status filters, and upcoming-only toggle
- **Appointment rebooking** with secure data handling

### 🗓️ Availability System

- **Public booking interface** for clients
- **Real-time availability checking** with slot validation
- **Calendar visualization** with status badges
- **Time slot management** with booking conflict prevention
- **Automatic slot freeing** when appointments are cancelled/deleted

### 🧪 Comprehensive Testing

- **API route testing** for booking CRUD operations
- **UI component testing** with guards and time-based logic
- **Status badge testing** for calendar components
- **Mock Supabase integration** for isolated testing
- **TypeScript-first** testing approach with proper type safety

### 🚀 CI/CD Pipeline

- **GitHub Actions** automation running on every push
- **Multi-Node testing** (Node.js 18.x and 20.x)
- **Required test gates** for critical booking functionality
- **Build verification** ensuring deployment readiness
- **Automatic Vercel integration** with test validation

## 🚀 Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS 4 with custom components
- **Authentication**: Supabase Auth
- **Database**: Supabase (PostgreSQL) with optimized queries
- **Forms**: React Hook Form + Zod validation
- **Testing**: Jest + React Testing Library with TypeScript
- **CI/CD**: GitHub Actions with multi-environment testing
- **Development**: Turbopack for lightning-fast builds
- **Icons**: Heroicons for consistent UI elements

## 📦 Installation

### Prerequisites

- Node.js 18+ (tested on 18.x and 20.x)
- npm or yarn
- Supabase account

### Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/scheduler-booker.git
   cd scheduler-booker
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Variables**
   Create a `.env.local` file:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```

4. **Database Setup**

   ```bash
   # Run the SQL migrations in Supabase dashboard
   # File: supabase-migrations.sql
   ```

5. **Run the development server**

   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🧪 Testing

### Core Test Suites (Required for CI)

```bash
# Run critical booking functionality tests
npm test -- --testPathPatterns="AppointmentsList.guards.test.tsx|SharedAvailabilityCalendar.status.test.tsx|bookings.route.test.ts|booking-persistence.test.ts"
```

### Run All Tests

```bash
npm test                    # All tests
npm run test:watch         # Watch mode (all tests)
npm run test:watch:critical # Watch mode (critical tests only)
npm run test:coverage      # With coverage report
npm run type-check         # TypeScript validation
```

### Test Categories

#### 🎯 **API Route Tests**

```bash
# Booking CRUD operations
npm test -- --testPathPatterns=bookings.route.test.ts

# Data persistence and integrity
npm test -- --testPathPatterns=booking-persistence.test.ts
```

#### 🎨 **UI Component Tests**

```bash
# Appointment management guards
npm test -- --testPathPatterns=AppointmentsList.guards.test.tsx

# Calendar status badges
npm test -- --testPathPatterns=SharedAvailabilityCalendar.status.test.tsx

# Authentication components
npm test -- --testPathPatterns="LoginForm|SignupForm|RequireAuth"
```

## 📁 Project Structure

```
scheduler-booker/
├── .github/
│   └── workflows/
│       └── ci.yml              # GitHub Actions CI pipeline
├── src/
│   ├── app/                    # Next.js app router
│   │   ├── api/
│   │   │   ├── auth/          # Authentication endpoints
│   │   │   ├── availability/   # Availability management
│   │   │   └── bookings/      # Booking CRUD operations
│   │   ├── dashboard/
│   │   │   ├── appointments/   # Appointment management
│   │   │   ├── availability/   # Availability settings
│   │   │   └── bookings/      # Internal booking form
│   │   └── book/[userId]/     # Public booking interface
│   ├── components/
│   │   ├── auth/              # Authentication components
│   │   ├── appointments/      # Appointment management UI
│   │   ├── availability/      # Calendar and availability
│   │   ├── bookings/          # Booking forms and components
│   │   └── common/            # Shared UI components
│   └── lib/
│       ├── hooks/             # Custom React hooks
│       ├── services/          # API service layers
│       ├── managers/          # Business logic managers
│       └── types/             # TypeScript definitions
├── jest.config.js             # Jest configuration
├── jest.setup.js              # Test setup and global mocks
└── package.json               # Scripts and dependencies
```

## 🎯 Key Features Deep Dive

### 📋 Appointment Management

- **Time-based Status Guards**: Prevent marking appointments complete before start time
- **Grace Period Logic**: 15-minute window before allowing no-show status
- **Smart Rebooking**: Secure parameter passing without PII exposure
- **Bulk Operations**: Search, filter, and manage multiple appointments
- **Real-time Updates**: Automatic UI updates on status changes

### 🗓️ Availability System

- **Slot Conflict Prevention**: Automatic validation of booking conflicts
- **Dynamic Status Badges**: Visual indicators for pending/confirmed/cancelled states
- **Public vs Private Views**: Different interfaces for clients vs internal users
- **Time Zone Handling**: Proper date/time management across time zones

### 🧪 Testing Architecture

- **Mock Supabase Client**: Fully typed mock implementation for testing
- **Time-based Test Logic**: Validation of time-sensitive business rules
- **Component Integration**: End-to-end UI behavior testing
- **API Contract Testing**: Ensuring API responses match expectations

## 🔧 Development

### Available Scripts

```bash
npm run dev             # Start development server (with Turbopack)
npm run build           # Build for production
npm run start           # Start production server
npm run lint            # Run ESLint
npm run type-check      # TypeScript validation
npm test                # Run all tests
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Run tests with coverage
```

### Environment Variables

| Variable                        | Description                    | Required |
| ------------------------------- | ------------------------------ | -------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Your Supabase project URL      | Yes      |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous key    | Yes      |
| `SUPABASE_SERVICE_ROLE_KEY`     | Your Supabase service role key | Yes      |

## 🧪 Test Results

### Latest CI Results

```
✅ Booking API Tests: 4/4 passing
✅ Booking Persistence Tests: 6/6 passing
✅ Appointment Guards: 2/2 passing
✅ Calendar Status Tests: 2/2 passing
✅ Multi-Node Testing: Node 18.x & 20.x ✓
```

### Coverage Highlights

- **API Routes**: Full CRUD operation coverage
- **Business Logic**: Time-based guards and validation
- **UI Components**: User interaction and state management
- **TypeScript**: Zero `any` types in test files

## 🚀 Deployment & CI/CD

### Automatic Testing

Every push triggers:

1. **Linting** and **Type Checking** (warnings allowed)
2. **Core Functionality Tests** (must pass)
3. **Multi-Node Validation** (18.x and 20.x)

### Vercel Integration

- **Automatic deployments** on every push
- **Preview environments** for feature branches
- **Production deployment** on main branch
- **Environment variables** managed in Vercel dashboard

### Branch Protection (Recommended)

1. Go to Repository Settings → Branches
2. Add protection rule for `main` branch
3. Require status checks: `test (18.x)`, `test (20.x)`
4. Require pull request reviews

## 📊 Performance & Optimization

- **Next.js 15**: Latest performance improvements
- **Turbopack**: Fast development builds
- **TypeScript**: Compile-time error catching
- **Optimized Queries**: Efficient Supabase data fetching
- **Component Lazy Loading**: Improved page load times

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Write tests for new functionality
4. Ensure all tests pass (`npm test`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Contribution Guidelines

- **Write tests** for new features
- **Maintain TypeScript** strict mode compliance
- **Follow existing** code patterns and structure
- **Update documentation** for significant changes

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Next.js** for the cutting-edge React framework
- **Supabase** for the powerful backend-as-a-service
- **Tailwind CSS** for the utility-first CSS framework
- **React Testing Library** for excellent testing utilities
- **GitHub Actions** for seamless CI/CD automation

---

**Built with ❤️ using Next.js 15, Supabase, and TypeScript**

_Enterprise-ready scheduling solution with comprehensive testing and CI/CD pipeline_
