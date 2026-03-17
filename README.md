# Campus Sync

A comprehensive campus management system built with Next.js 16, Prisma 5, NextAuth v5, and PostgreSQL. Streamline timetable management, coordinate schedules, and manage academic resources all in one place.

## Features

### 🎯 Core Functionality

- **User Authentication**
  - Secure signup/login with password hashing (bcryptjs)
  - Email verification support
  - Session management with NextAuth v5
  - **OTP-based password reset** via email (Nodemailer)
  - Institution-specific email domain (`@apsit.edu.in`)

- **Role-Based Access Control**
  - **HOD (Head of Department)**: Full administrative access
  - **Faculty**: Can manage timetables, view schedules, update availability
  - **Student**: View schedules, join groups, manage preferences
  - Configurable signup restrictions via environment variables

### 📅 Timetable Management

- **Create & Manage Timetables**
  - Create multiple timetables with custom names and descriptions
  - Assign timetables to groups
  - **Active/Inactive Status**: Toggle timetable visibility for students
  - Full CRUD operations for timetables

- **Time Slot Management**
  - Add time slots with day, start/end time
  - Assign subjects, rooms, faculty, batches, and slot types
  - Optional fields for flexible scheduling
  - Visual schedule carousel on dashboard

- **Weekly Schedule View**
  - Interactive carousel showing weekly schedule
  - Today's date highlighting
  - Responsive design for all devices

### 👥 Group Management

- **Create & Join Groups**
  - Create groups with unique join codes
  - Join groups using codes
  - Role-based permissions (Editor/Viewer)
  - Manage group members
  - Assign timetables to groups

### 📚 Resource Management

- **Subjects**
  - Create and manage subjects
  - Short names for quick reference
  - Full CRUD operations

- **Rooms**
  - Manage room inventory
  - Track room assignments
  - Unique room numbers

- **Slot Types**
  - Define custom slot types (Lecture, Lab, Tutorial, etc.)
  - Filter schedules by slot types

- **Batches**
  - Manage student batches
  - Assign batches to time slots
  - Filter schedules by batches

### � Calendar Management

- **Create & Manage Calendars**
  - Create calendars for academic events
  - Assign calendars to groups
  - **Active/Inactive Status**: Toggle calendar visibility
  - Full CRUD operations for HOD

- **Event Management**
  - Add events with start/end dates
  - Categorize events by type (Exam, Holiday, Deadline, etc.)
  - Multi-day event support
  - Color-coded event types

- **Event Types**
  - Create custom event types
  - Consistent color coding using hash-based assignment

- **Role-Based Permissions**
  - HOD: Full access to all calendars
  - Faculty Editors: Can add/edit events in assigned calendars
  - Students: View-only access (no editing)

### �👤 User Features

- **Availability Tracking**
  - Set availability status (Active, Away, Busy)
  - Custom status messages
  - Real-time availability updates

- **Profile Management**
  - View and edit profile information

### 🎨 UI & UX Enhancements

- **Modern Landing Page**
  - **Hyperspace Background**: Dynamic animated background for key sections
  - **Discrete Tabs**: Interactive team showcase with GitHub avatars
  - **Particles Integration**: (available for custom backgrounds)
- **Optimistic Updates**: Instant UI feedback for state changes (e.g., toggles)
- **Responsive Design**: Mobile-first approach for all dashboards
  - Update name and status
  - Change availability status

- **Student Preferences**
  - Filter dashboard schedule by slot types
  - Filter dashboard schedule by batches
  - Customize what appears in your schedule view

### 🎨 User Interface

- **Responsive Design**
  - Mobile-first approach
  - Collapsible sidebar for desktop
  - Bottom navigation for mobile
  - Optimized for all screen sizes

- **Theme Support**
  - Light/dark mode toggle (dashboard)
  - Forced dark mode on landing page
  - Smooth theme transitions

- **Modern UI Components**
  - Built with Shadcn UI
  - Tailwind CSS styling
  - Loading states and skeletons
  - Interactive dialogs and forms

### 🌐 Landing Page

- **Hero Section**
  - Animated gradient background with framer-motion
  - Call-to-action buttons
  - Responsive typography

- **Features Section**
  - Hover effects and animations
  - Grid layout showcasing capabilities
  - Interactive cards

- **Testimonials**
  - Infinite marquee animation
  - Real testimonials from faculty
  - Smooth scrolling effects

- **Shader Animation CTA**
  - WebGL shader animation background
  - Three.js powered effects
  - Engaging visual experience

## Tech Stack

- **Framework**: Next.js 16.1.1 (App Router)
- **Database**: PostgreSQL 17 (Alpine) / Neon (cloud)
- **ORM**: Prisma 5
- **Authentication**: NextAuth v5 (Auth.js)
- **UI Components**: Shadcn UI
- **Styling**: Tailwind CSS 4
- **Theme**: next-themes
- **Animations**: framer-motion, Three.js
- **Icons**: lucide-react
- **Email**: Nodemailer
- **Runtime**: Bun / Node.js

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- Docker and Docker Compose

### Quick Start with Docker (recommended)

The fastest way to run the entire app — no local Node.js or database setup required.

1. **Clone the repository**

```bash
git clone https://github.com/0xaadesh/campus-sync
cd campus-sync
```

2. **Create a `.env` file** from the template

```bash
cp .env.example .env
```

Fill in the required values (at minimum `NEXTAUTH_SECRET` and email settings):

```env
NEXTAUTH_SECRET="your-secret-key"   # generate with: openssl rand -base64 32
EMAIL_SERVER_USER="your-email@gmail.com"
EMAIL_SERVER_PASSWORD="your-app-password"
```

> The `DATABASE_URL` is handled automatically by Docker Compose — you do not need to set it in `.env`.

3. **Build and start**

```bash
docker compose up --build
```

The app will be available at [http://localhost:3000](http://localhost:3000). Prisma migrations run automatically on startup.

To run in the background:

```bash
docker compose up --build -d
```

To stop:

```bash
docker compose down       # keeps database data
docker compose down -v    # removes database data
```

### Manual Setup (without Docker for the app)

If you prefer to run the Next.js app directly on your machine:

1. **Clone the repository**

```bash
git clone https://github.com/0xaadesh/campus-sync
cd campus-sync
```

2. **Install dependencies**

```bash
bun install
# or
npm install
```

3. **Set up environment variables**

Create a `.env` file in the root directory:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/campus_sync"
# Or use Neon:
# DATABASE_URL="postgresql://user:password@ep-xxx.neon.tech/dbname?sslmode=require"

NEXTAUTH_SECRET="your-secret-key-here-generate-a-random-string"
NEXTAUTH_URL="http://localhost:3000"

# Email Configuration (for password reset)
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER="your-email@gmail.com"
EMAIL_SERVER_PASSWORD="your-app-password"
EMAIL_FROM="Campus Sync <your-email@gmail.com>"

# Optional: Signup Restrictions
# DISABLE_SIGNUP=true           # Completely disable signup
# DISABLE_HOD_SIGNUP=true       # Remove HOD from role dropdown
# DISABLE_FACULTY_SIGNUP=true   # Remove Faculty from role dropdown
```

Generate a secure `NEXTAUTH_SECRET`:
```bash
openssl rand -base64 32
```

4. **Start PostgreSQL with Docker** (if using local database)

```bash
docker compose up postgres -d
```

5. **Run Prisma migrations**

```bash
bunx prisma migrate dev
# or
npx prisma migrate dev
```

6. **Generate Prisma Client**

```bash
bunx prisma generate
# or
npx prisma generate
```

7. **Start the development server**

```bash
bun dev
# or
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Database Migration

### Migrating from Local to Neon

If you need to migrate your local PostgreSQL data to Neon:

1. Add `NEON_DATABASE_URL` to your `.env` file
2. Apply schema to Neon: See `scripts/migrate-to-neon.ts` for details
3. Run the migration script: `bun run migrate:to-neon`

## Project Structure

```
├── app/
│   ├── actions/              # Server actions
│   │   ├── auth.ts          # Authentication actions
│   │   ├── availability.ts  # Availability management
│   │   ├── batches.ts       # Batch CRUD
│   │   ├── groups.ts        # Group management
│   │   ├── preferences.ts   # User preferences
│   │   ├── rooms.ts         # Room CRUD
│   │   ├── schedule.ts      # Schedule queries
│   │   ├── slot-types.ts    # Slot type CRUD
│   │   ├── subjects.ts      # Subject CRUD
│   │   └── timetables.ts    # Timetable management
│   ├── api/                 # API routes
│   │   └── auth/           # NextAuth routes
│   ├── dashboard/           # Dashboard pages
│   │   ├── availability/   # Availability page
│   │   ├── batches/        # Batches management
│   │   ├── groups/         # Groups management
│   │   ├── profile/        # User profile
│   │   ├── rooms/          # Rooms management
│   │   ├── settings/       # Settings page
│   │   ├── slot-types/     # Slot types management
│   │   ├── subjects/       # Subjects management
│   │   └── timetables/     # Timetables management
│   ├── login/              # Login page
│   ├── signup/             # Signup page
│   └── page.tsx            # Landing page
├── components/              # React components
│   ├── ui/                 # Shadcn UI components
│   │   ├── hero.tsx        # Hero component
│   │   ├── feature-section-with-hover-effects.tsx
│   │   ├── testimonials-with-marquee.tsx
│   │   ├── shader-animation.tsx
│   │   └── ...            # Other UI components
│   ├── dashboard-layout-client.tsx
│   ├── schedule-carousel.tsx
│   ├── sidebar.tsx
│   └── ...                # Other custom components
├── lib/                    # Utility functions
│   ├── prisma.ts          # Prisma client
│   └── utils.ts           # Helper functions
├── prisma/                # Prisma configuration
│   ├── schema.prisma      # Database schema
│   └── migrations/        # Migration files
├── scripts/               # Utility scripts
│   └── migrate-to-neon.ts # Database migration script
├── types/                 # TypeScript types
├── Dockerfile             # Multi-stage production build
├── docker-compose.yml     # App + PostgreSQL orchestration
├── .dockerignore          # Docker build context exclusions
└── .env.example           # Environment variable template
```

## Configuration

### Signup Restrictions

Control who can sign up using environment variables:

| Variable | Effect |
|----------|--------|
| `DISABLE_SIGNUP=true` | Completely disables signup |
| `DISABLE_HOD_SIGNUP=true` | Removes HOD from role dropdown |
| `DISABLE_FACULTY_SIGNUP=true` | Removes Faculty from role dropdown |

### Email Configuration

For OTP-based password reset, configure your email provider:

```env
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-email@gmail.com
EMAIL_SERVER_PASSWORD=your-app-password
EMAIL_FROM="Campus Sync <your-email@gmail.com>"
```

> **Note:** For Gmail, create an [App Password](https://myaccount.google.com/apppasswords) instead of using your regular password.

## Database Schema

The application uses Prisma with the following main models:

- **User**: Authentication, roles, availability, preferences
- **Timetable**: Schedule containers with metadata
- **TimeSlot**: Individual time slots with day, time, and assignments
- **Subject**: Course subjects
- **Room**: Physical rooms
- **SlotType**: Types of time slots (Lecture, Lab, etc.)
- **Batch**: Student batches
- **Group**: User groups with join codes
- **GroupMembership**: User-group relationships with roles
- **TimetableGroup**: Timetable-group assignments
- **SlotTypePreference**: User slot type filters
- **BatchPreference**: User batch filters
- **Calendar**: Academic calendars
- **CalendarEvent**: Calendar events with dates
- **EventType**: Event categorization
- **PasswordResetToken**: OTP tokens for password reset

### Enums

- **Role**: HOD, Faculty, Student
- **Availability**: Active, Away, Busy
- **DayOfWeek**: Monday through Sunday
- **GroupRole**: Editor, Viewer

## Authentication

The app uses NextAuth v5 (Auth.js) with credentials provider:
- Passwords are hashed using bcryptjs before storage
- Sessions are managed server-side
- Protected routes require authentication
- Role-based access control enforced

## Development

### Available Scripts

```bash
bun dev          # Start development server
bun build        # Build for production
bun start        # Start production server
bun lint         # Run ESLint
bun run migrate:to-neon  # Migrate data to Neon
```

### Database Commands

```bash
bunx prisma migrate dev    # Create and apply migrations
bunx prisma generate       # Generate Prisma Client
bunx prisma studio         # Open Prisma Studio
bunx prisma migrate reset  # Reset database (dev only)
```

## Deployment

### Deploying with Docker

The app ships with a production-ready `Dockerfile` (multi-stage build) and `docker-compose.yml`.

**Architecture:**

| Container | Image | Purpose |
|-----------|-------|---------|
| `campus_sync_app` | Built from `Dockerfile` | Next.js standalone server |
| `campus_sync_postgres` | `postgres:17-alpine` | PostgreSQL database |

**Production deployment:**

1. Copy `.env.example` to `.env` and fill in your secrets
2. Build and run:
   ```bash
   docker compose up --build -d
   ```
3. Prisma migrations are applied automatically on container startup
4. The app listens on port `3000`

**Rebuilding after code changes:**

```bash
docker compose up --build -d
```

**Applying `.env` changes** (no rebuild needed):

```bash
docker compose up -d
```

> **Note:** `docker compose restart` does **not** pick up `.env` or `docker-compose.yml` changes. Always use `docker compose up -d` instead.

**Viewing logs:**

```bash
docker compose logs -f app       # app logs
docker compose logs -f postgres  # database logs
```

### Deploying to Vercel

1. **Push your code to GitHub**

2. **Import project to Vercel**
   - Connect your GitHub repository
   - Vercel will auto-detect Next.js

3. **Set Environment Variables in Vercel**
   
   Go to **Settings → Environment Variables** and add:
   
   ```env
   DATABASE_URL="postgresql://user:password@ep-xxx.neon.tech/dbname?sslmode=require"
   NEXTAUTH_URL="https://your-project.vercel.app"
   NEXTAUTH_SECRET="your-secret-key-here"
   ```
   
   **Important:**
   - Replace `your-project.vercel.app` with your actual Vercel deployment URL
   - Use your Neon database URL (or other PostgreSQL connection string)
   - Use the same `NEXTAUTH_SECRET` as your local development

4. **Deploy**
   - Vercel will automatically deploy on push
   - Or trigger a manual deployment

5. **Post-Deployment**
   - Run Prisma migrations on your production database:
     ```bash
     DATABASE_URL="your-production-db-url" npx prisma migrate deploy
     ```
   - Or use Vercel's build command to run migrations automatically

### Environment Variables

**Local Development (.env):**
```env
DATABASE_URL="postgresql://user:password@localhost:5432/campus_sync"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"
```

**Docker (.env — DATABASE_URL is set automatically by Compose):**
```env
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
EMAIL_SERVER_USER="your-email@gmail.com"
EMAIL_SERVER_PASSWORD="your-app-password"
```

**Production (Vercel Environment Variables):**
```env
DATABASE_URL="postgresql://user:password@ep-xxx.neon.tech/dbname?sslmode=require"
NEXTAUTH_URL="https://your-project.vercel.app"
NEXTAUTH_SECRET="your-secret-key"
```

**Note:** Never commit `.env` files to git. Always use Vercel's environment variables for production.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth Documentation](https://next-auth.js.org)
- [Shadcn UI](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com)
- [Framer Motion](https://www.framer.com/motion/)
- [Three.js](https://threejs.org)
- [Vercel Deployment](https://vercel.com/docs)

## License

Private project - All rights reserved
