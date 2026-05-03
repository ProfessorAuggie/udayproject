# Vercel Deployment Guide

## Environment Variables Required

To deploy this application on Vercel, you must set the following environment variables in your Vercel project settings:

### Required Variables

**DATABASE_URL** (Required)
- A PostgreSQL connection string
- Format: `postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public`
- Examples:
  - Neon: `postgresql://user:password@ep-xxx.neon.tech/dbname?schema=public`
  - Railway: `postgresql://user:password@host:5432/dbname?schema=public`
  - Supabase: `postgresql://postgres:password@host.supabase.co:5432/postgres?schema=public`

**JWT_SECRET** (Required)
- A long random string used for JWT token signing
- Generate with: `openssl rand -hex 32`
- Example: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1`

### Optional Variables

**CLIENT_ORIGIN** (Optional)
- Comma-separated list of allowed client origins for CORS
- Example for production: `https://your-domain.vercel.app`
- Example for multiple: `https://your-domain.vercel.app,https://preview-xxx.vercel.app`

## Setup Steps

### 1. Create Database

Choose one of the following:

**Option A: Using Neon (Recommended)**
1. Go to https://neon.tech/
2. Sign up and create a new project
3. Copy the connection string (PostgreSQL)
4. It will look like: `postgresql://user:password@ep-xxx.neon.tech/dbname?schema=public`

**Option B: Using Railway**
1. Go to https://railway.app/
2. Create a new PostgreSQL plugin
3. Copy the connection string from the $DATABASE_URL variable

**Option C: Using Supabase**
1. Go to https://supabase.com/
2. Create a new project
3. Go to Settings > Database > Connection Pooling
4. Copy the PostgreSQL connection string

### 2. Configure Vercel Project

1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Add the following variables:

```
DATABASE_URL = postgresql://... (your connection string)
JWT_SECRET = (your random 32-character hex string)
```

4. Save the variables

### 3. Deploy

The deployment will automatically:
1. Install dependencies
2. Generate Prisma client
3. Build the server (Express API)
4. Build the client (React SPA)
5. Set up the serverless functions
6. Run migrations (if database exists)

### 4. Verify Deployment

After deployment:

1. Visit your Vercel project URL
2. Test the login at `/login`
3. Use demo credentials:
   - Email: `alice@example.com`
   - Password: `password123`

### 5. Seed Database (Optional)

To add sample data to your database:

1. After first deployment, the database is created with the schema
2. Run: `npx prisma db seed`
3. This adds demo users and projects

## Troubleshooting

### Database Connection Failed
- Verify DATABASE_URL is correctly set in Vercel environment variables
- Check that your database is accessible from Vercel's IPs (may need to allow all IPs)
- Verify the database exists and schema is correct

### JWT_SECRET Error
- Ensure JWT_SECRET is set in environment variables
- It should be a long random string (recommend 32+ hex characters)

### Migration Failed
- The database schema will be created on first successful migration
- If migrations fail, check the database connection
- You may need to manually create the schema using Prisma Studio

### Client Routes Not Working
- Ensure the rewrite rules in vercel.json are correct
- SPA fallback should redirect non-API routes to /index.html
- Clear your browser cache

## Database Reset (Development)

If you need to reset the database during development:

```bash
npx prisma migrate reset
npm run db:seed
```

This will:
1. Drop all tables
2. Run all migrations
3. Seed with demo data

## Performance Optimization

The application uses:
- Client-side routing (React Router) to minimize server requests
- JWT tokens stored in localStorage for authentication
- Vercel serverless functions for API endpoints
- Static HTML/CSS/JS assets served from Vercel CDN

## Security Notes

- All passwords are hashed with bcrypt
- JWT tokens expire after 7 days (configurable in auth routes)
- CORS is configured to allow your domain
- API endpoints validate all requests
- Never commit .env files - always use Vercel environment variables

## Support

For issues with:
- **Neon**: https://neon.tech/docs
- **Railway**: https://docs.railway.app/
- **Supabase**: https://supabase.com/docs
- **Vercel**: https://vercel.com/docs
