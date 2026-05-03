# TaskFlow - Setup & Deployment Guide

## Overview

TaskFlow is a full-stack team task management application built with React, Express, and PostgreSQL. It features role-based access control (RBAC), real-time task management, and team collaboration capabilities.

## Prerequisites

- Node.js 18+ and npm/pnpm
- PostgreSQL database
- Git

## Installation

### 1. Clone & Install Dependencies

```bash
git clone <repository-url>
cd udayproject

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Setup Environment Variables

Create `.env` files for both server and client:

**Server `.env`:**
```
DATABASE_URL=postgresql://user:password@localhost:5432/taskflow
JWT_SECRET=your-secure-jwt-secret-key-change-this-in-production
PORT=4000
NODE_ENV=development
```

**Client `.env`:**
```
VITE_API_URL=http://localhost:4000/api
```

### 3. Setup Database

```bash
cd server

# Run Prisma migrations
npx prisma migrate dev --name init

# Seed database with demo data
npx prisma db seed
```

## Running the Application

### Development

**Terminal 1 - Start Backend Server:**
```bash
cd server
npm run dev
# Server runs on http://localhost:4000
```

**Terminal 2 - Start Frontend Dev Server:**
```bash
cd client
npm run dev
# Client runs on http://localhost:5173
```

### Demo Accounts

After seeding, use these accounts to test:

- **Admin**: admin@example.com / password
- **Manager**: manager@example.com / password
- **Team Member**: user@example.com / password

## Key Features Implemented

### Authentication & Authorization
- User registration and login with JWT tokens
- Role-based access control (Owner, Admin, Member)
- Secure password hashing with bcrypt
- Protected API endpoints

### Project Management
- Create and manage projects
- Assign team members with role-based permissions
- Project ownership and admin controls
- Member role management (Admin/Member)

### Task Management
- Create tasks with titles, descriptions, and due dates
- Task status tracking (TODO, IN_PROGRESS, DONE)
- Assign tasks to team members
- Task filtering and sorting by status
- Due date management and overdue indicators

### Dashboard
- Overview statistics (total tasks, overdue, due today, assigned)
- Task status progress bars
- Recent tasks list with quick access
- Quick add task functionality

### UI/UX Enhancements
- Responsive design for mobile and desktop
- Dark theme with carefully chosen color palette
- Smooth animations and transitions
- Loading states and skeleton screens
- Error handling with user-friendly messages
- Accessible form inputs and buttons (44px minimum height)
- Improved visual hierarchy and spacing

## Project Structure

```
udayproject/
├── server/                 # Express backend
│   ├── src/
│   │   ├── index.ts       # Server entry point
│   │   ├── app.ts         # Express app setup
│   │   ├── routes/        # API routes
│   │   ├── middleware/    # Auth middleware
│   │   └── utils/         # Utilities
│   ├── prisma/
│   │   ├── schema.prisma  # Database schema
│   │   └── seed.ts        # Database seed
│   └── package.json
│
├── client/                 # React frontend
│   ├── src/
│   │   ├── App.tsx        # Main app component
│   │   ├── pages/         # Page components
│   │   ├── components/    # Reusable components
│   │   ├── auth/          # Auth context
│   │   ├── api.ts         # API client
│   │   └── styles/        # Global CSS
│   └── package.json
│
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get current user profile

### Projects
- `GET /api/projects` - List user's projects
- `POST /api/projects` - Create new project
- `GET /api/projects/:id` - Get project details
- `PATCH /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Team Members
- `GET /api/projects/:id/members` - List project members
- `POST /api/projects/:id/invite` - Invite team member
- `PATCH /api/projects/:id/members/:userId/role` - Change member role
- `DELETE /api/projects/:id/members/:userId` - Remove member

### Tasks
- `GET /api/projects/:id/tasks` - List project tasks
- `POST /api/projects/:id/tasks` - Create task
- `PATCH /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

## Production Deployment

### Build

```bash
# Build client
cd client
npm run build

# Build server (if applicable)
cd ../server
npm run build
```

### Environment Variables

Update `.env` files with production values:
- Use strong JWT_SECRET
- Use production database URL
- Set NODE_ENV=production
- Use HTTPS for API_URL

### Database

- Use managed PostgreSQL service (AWS RDS, Heroku, Railway, etc.)
- Run migrations: `npx prisma migrate deploy`
- Ensure proper backups are configured

### Hosting Options

- **Frontend**: Vercel, Netlify, GitHub Pages
- **Backend**: Heroku, Railway, AWS Lambda, Render

### Security Checklist

- [ ] Strong JWT_SECRET set (min 32 characters)
- [ ] HTTPS enabled in production
- [ ] Database connection strings secured
- [ ] CORS properly configured
- [ ] API rate limiting implemented
- [ ] Input validation enabled
- [ ] SQL injection prevention verified
- [ ] Authentication tokens in HTTP-only cookies
- [ ] Sensitive data not logged
- [ ] Regular security audits scheduled

## Troubleshooting

### Database Connection Issues
```bash
# Test connection
psql DATABASE_URL

# Reset database
npx prisma migrate reset
```

### Port Already in Use
```bash
# Change PORT in .env or kill existing process
lsof -i :4000
kill -9 <PID>
```

### Build Errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Prisma cache
rm -rf node_modules/.prisma
npx prisma generate
```

## Development Tools

- **Database UI**: `npx prisma studio`
- **Type Checking**: TypeScript
- **Linting**: ESLint (if configured)
- **Testing**: Jest (optional setup)

## Performance Optimization

- Frontend minification with Vite
- Database query optimization
- Lazy loading of routes
- Image optimization
- Caching strategies for API responses

## Support & Documentation

- See README.md for project overview
- Check demoCredentials.ts for test account information
- Review API structure in server/src/routes/

---

**Last Updated**: May 2026
**Version**: 1.0.0
