# TaskFlow - Quick Start Guide

Get up and running with TaskFlow in 5 minutes!

## 30-Second Setup

```bash
# 1. Install dependencies
cd server && npm install
cd ../client && npm install

# 2. Setup database (make sure PostgreSQL is running)
cd ../server
npx prisma migrate dev --name init
npx prisma db seed

# 3. Start servers (use two terminals)
# Terminal 1:
cd server && npm run dev

# Terminal 2:
cd client && npm run dev

# 4. Open browser
# Go to http://localhost:5173
```

## Demo Accounts

Login with these demo accounts (password is `password` for all):

| Email | Role | Best For |
|-------|------|----------|
| admin@example.com | Admin | Managing projects, team |
| manager@example.com | Admin | Project leadership |
| user@example.com | Member | Team member testing |

## First Steps

### As Admin (admin@example.com)

1. **Login** to the dashboard
2. **Create a Project** from the Projects page
3. **Invite Team Members** to the project
4. **Add Tasks** to the project
5. **Assign Tasks** to team members
6. **View Dashboard** to see all activity

### As Team Member (user@example.com)

1. **Login** to see assigned tasks
2. **View Dashboard** to see your workload
3. **Update Task Status** as you work
4. **Check Project Details** for team information
5. **View Due Dates** to stay on track

## Key Features

### Dashboard
- See all your tasks at a glance
- Check due dates and priority
- Track overall progress
- Quick task creation

### Projects
- Manage multiple projects
- Control team access
- Track project progress
- Organize tasks by project

### Tasks
- Create with title, description, due date
- Assign to team members
- Track status (TODO, IN PROGRESS, DONE)
- See who's working on what

### Team
- Invite members to projects
- Assign roles (Admin, Member)
- Remove members as needed
- Control permissions

## Common Actions

### Create a Task

1. Go to project page
2. Click "Add task"
3. Enter title
4. Click "Details" for more options (description, due date)
5. Click "Create task"

### Invite a Team Member

1. Go to project page
2. Scroll to team section
3. Enter member email in invite field
4. Select member role
5. Click "Invite"

### Update Task Status

1. Go to project page
2. Find the task in the list
3. Click the status pill (TODO, IN PROGRESS, DONE)
4. Select new status

### Change Member Role

1. Go to project page
2. Find the member in the team list
3. Click the role dropdown
4. Select new role
5. Changes apply immediately

## Troubleshooting

### Can't connect to database?
```bash
# Make sure PostgreSQL is running
psql -c "SELECT 1"

# Check DATABASE_URL in .env
echo $DATABASE_URL
```

### Port already in use?
```bash
# Kill process on port 4000
lsof -i :4000
kill -9 <PID>

# Or change PORT in .env
PORT=5000 npm run dev
```

### Database migrations failed?
```bash
# Reset database (deletes all data)
npx prisma migrate reset

# Reseed demo data
npx prisma db seed
```

### Can't login?
1. Check you're using correct email (case-sensitive)
2. Verify password (demo accounts use "password")
3. Make sure server is running (http://localhost:4000/api/health should return `{"status":"ok"}`)
4. Check browser console for errors (F12)

## Next Steps

### Learn the App
- Explore the [UI_IMPROVEMENTS.md](UI_IMPROVEMENTS.md) for design details
- Read [SETUP_GUIDE.md](SETUP_GUIDE.md) for detailed configuration

### Set Up Production
- Follow [SETUP_GUIDE.md](SETUP_GUIDE.md) "Production Deployment" section
- Update environment variables
- Configure database backups
- Set up monitoring

### Test Everything
- Review [VERIFY.md](VERIFY.md) testing checklist
- Test on mobile devices
- Verify all features work
- Check browser compatibility

### Customize
- Update project name and description
- Change color scheme (edit `:root` in global.css)
- Add company logo
- Customize default roles

## API Quick Reference

### Authentication
```bash
# Login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'

# Returns: { "token": "eyJhbGc..." }
```

### Projects
```bash
# List your projects
curl http://localhost:4000/api/projects \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create new project
curl -X POST http://localhost:4000/api/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"name":"My Project","description":"My Description"}'
```

### Tasks
```bash
# List project tasks
curl http://localhost:4000/api/projects/PROJECT_ID/tasks \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create task
curl -X POST http://localhost:4000/api/projects/PROJECT_ID/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title":"My Task",
    "description":"Task details",
    "dueDate":"2026-05-10T00:00:00Z"
  }'
```

See [SETUP_GUIDE.md](SETUP_GUIDE.md) for complete API documentation.

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Focus search | Cmd/Ctrl + K |
| Submit form | Enter |
| Navigate | Tab |
| Cancel | Esc |

## Tips & Tricks

1. **Quick Task Creation**: Use the dashboard "Quick add" to create tasks in one click
2. **Bulk Operations**: You can manage multiple tasks from the project view
3. **Due Date Warnings**: Red dates indicate overdue tasks
4. **Role Permissions**: Only project admins can change member roles
5. **Project Access**: You can be a member of multiple projects

## Support

Need help?

1. Check [SETUP_GUIDE.md](SETUP_GUIDE.md) troubleshooting section
2. Review [VERIFY.md](VERIFY.md) for testing procedures
3. Check browser console (F12) for error messages
4. Verify all services are running (server, database, client)

## What's Next?

- Invite your team to TaskFlow
- Start creating projects and tasks
- Assign work to team members
- Track progress on the dashboard
- Build better workflows!

---

**Ready to get started?**

1. Follow the 30-second setup above
2. Login with admin@example.com / password
3. Create your first project
4. Start managing tasks!

Happy task managing! 🚀

---

**For detailed information**: See [SETUP_GUIDE.md](SETUP_GUIDE.md)
**For UI details**: See [UI_IMPROVEMENTS.md](UI_IMPROVEMENTS.md)
**For testing**: See [VERIFY.md](VERIFY.md)
