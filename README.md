# Campus Sync

A comprehensive campus management system built with Next.js 16, Prisma 5, NextAuth v5, and PostgreSQL. Streamline timetable management, coordinate schedules, and manage academic resources all in one place.

## Features

### 🎯 Core Functionality

- **User Authentication**
  - Secure signup/login with password hashing (bcryptjs)
  - Email verification support
  - Session management with NextAuth v5

- **Role-Based Access Control**
  - **HOD (Head of Department)**: Full administrative access
  - **Faculty**: Can manage timetables, view schedules, update availability
  - **Student**: View schedules, join groups, manage preferences

### 📅 Timetable Management

- **Create & Manage Timetables**
  - Create multiple timetables with custom names and descriptions
  - Assign timetables to groups
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

### 👤 User Features

- **Availability Tracking**
  - Set availability status (Active, Away, Busy)
  - Custom status messages
  - Real-time availability updates

- **Profile Management**
  - View and edit profile information
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
- **Runtime**: Bun / Node.js

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- Docker and Docker Compose (for local PostgreSQL)
- Or a Neon database account (for cloud PostgreSQL)

### Setup

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
```

Generate a secure `NEXTAUTH_SECRET`:
```bash
openssl rand -base64 32
```

4. **Start PostgreSQL with Docker** (if using local database)

```bash
docker-compose up -d
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
└── types/                 # TypeScript types
```

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
