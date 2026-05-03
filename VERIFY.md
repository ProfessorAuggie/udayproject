# Application Verification Checklist

## Pre-Flight Checks

### 1. Dependencies
- [ ] Run `cd server && npm install` to install server dependencies
- [ ] Run `cd client && npm install` to install client dependencies
- [ ] Verify no npm ERR messages

### 2. Environment Setup
- [ ] Create `.env` in server directory with DATABASE_URL and JWT_SECRET
- [ ] Create `.env` in client directory with VITE_API_URL
- [ ] Verify PostgreSQL service is running
- [ ] Test database connection: `psql $DATABASE_URL`

### 3. Database
- [ ] Run `npx prisma migrate dev --name init` in server directory
- [ ] Verify no migration errors
- [ ] Run `npx prisma db seed` to populate demo data
- [ ] Verify seed completed successfully
- [ ] Check database: `npx prisma studio`

## Application Startup

### Server
1. Open terminal in `server/` directory
2. Run `npm run dev`
3. Verify output shows:
   ```
   Database connected
   Server running on port 4000
   ```
4. Test: `curl http://localhost:4000/api/health`
5. Expected response: `{"status":"ok"}`

### Client
1. Open new terminal in `client/` directory
2. Run `npm run dev`
3. Verify output shows:
   ```
   VITE v5.x.x  ready in 1234 ms
   ➜  Local:   http://localhost:5173/
   ```
4. Open browser to http://localhost:5173

## Feature Testing

### Authentication
- [ ] Navigate to http://localhost:5173
- [ ] Should see login page
- [ ] Try demo account: admin@example.com / password
- [ ] Successfully logs in and redirects to dashboard
- [ ] Click logout button - returns to login page
- [ ] Try register - create new account with unique email
- [ ] New account can log in

### Dashboard
After logging in:
- [ ] Dashboard displays welcome message with user name
- [ ] Stats cards show: Total tasks, Overdue, Due today, Your open tasks
- [ ] Status progress bars display task breakdown
- [ ] Recent tasks list shows up to 8 tasks
- [ ] Each task shows: status pill, title, project, assignee, due date

### Projects
- [ ] Navigate to Projects page via top navigation
- [ ] See list of projects user is member of
- [ ] Each project card shows: name, description (if any), task count, member count
- [ ] Cards are hoverable with subtle animation
- [ ] Click project card navigates to project detail page

### Project Detail
- [ ] See project name and description
- [ ] Tasks section shows all project tasks
- [ ] Can create new task with "Add task" form
- [ ] "Details" button expands form to show description and due date fields
- [ ] Task list shows: status, title, assignee, due date
- [ ] Can click on task to edit (if implemented)
- [ ] Team members section shows all project members
- [ ] Each member shows: name, email, role
- [ ] As admin, can change member role and remove members
- [ ] Can invite new team members with invite form

### Task Management
- [ ] Create task with title only
- [ ] Create task with title, description, and due date
- [ ] Task appears in project task list
- [ ] Task status defaults to "TODO"
- [ ] Can change task status
- [ ] Can assign task to team member
- [ ] Can update task information
- [ ] Can delete task (if implemented)

### Responsive Design (Mobile)
Using browser DevTools, set to iPhone dimensions (375px width):
- [ ] Layout switches to single column
- [ ] Buttons and inputs are full width
- [ ] Navigation remains accessible
- [ ] Form fields stack vertically
- [ ] All text remains readable
- [ ] No horizontal scrolling needed

### Accessibility
- [ ] Tab through all interactive elements
- [ ] Focus indicators are visible (blue outline)
- [ ] Can submit forms with keyboard (Enter)
- [ ] All buttons have visible labels
- [ ] All form inputs are properly labeled
- [ ] Color is not the only indicator (labels present)

### Error Handling
- [ ] Try login with invalid credentials
- [ ] Error message displays clearly
- [ ] Register with existing email shows error
- [ ] Network error gracefully handled
- [ ] Can retry after error

## Performance Checks

### Load Times
- [ ] Application loads initial page in < 2 seconds
- [ ] Navigation between pages is smooth (< 500ms)
- [ ] Dashboard statistics load quickly
- [ ] Project list loads without lag

### Visual Feedback
- [ ] Loading spinner shows during API calls
- [ ] Buttons show disabled state when submitting
- [ ] Form inputs show focus styles
- [ ] Hover effects are smooth and immediate
- [ ] No layout shift when content loads

## Browser Compatibility

Test in multiple browsers:
- [ ] Chrome/Chromium (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

Verify in each:
- [ ] Layout renders correctly
- [ ] Colors display properly
- [ ] Animations are smooth
- [ ] No console errors

## Database Integrity

### Verify Seed Data
```bash
psql $DATABASE_URL

# Check users
SELECT count(*) FROM "User";  # Should be 3 (admin, manager, user)

# Check projects
SELECT count(*) FROM "Project";  # Should have demo projects

# Check tasks
SELECT count(*) FROM "Task";  # Should have demo tasks

# Check members
SELECT count(*) FROM "ProjectMember";  # Should have team assignments
```

### Data Relationships
- [ ] All foreign keys are properly set
- [ ] Cascade deletes work (if deleting user, related records handled)
- [ ] No orphaned records exist

## API Testing

Using curl or Postman:

### Authentication
```bash
# Register
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","password":"pass"}'

# Login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'
# Should return token

# Profile (with token)
curl http://localhost:4000/api/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Projects
```bash
# List projects (requires auth token)
curl http://localhost:4000/api/projects \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create project
curl -X POST http://localhost:4000/api/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"name":"Test Project","description":"Test"}'
```

## Security Verification

- [ ] JWT tokens are properly signed
- [ ] Tokens expire after set time
- [ ] API requires authentication (test without token - should get 401)
- [ ] RBAC enforced (non-admin cannot change roles)
- [ ] Password is hashed in database (check with `psql`)
- [ ] Sensitive data not exposed in API responses
- [ ] CORS is properly configured

## Final Checks

- [ ] No console errors in browser DevTools
- [ ] No network errors in DevTools Network tab
- [ ] All API responses are valid JSON
- [ ] No sensitive data in logs
- [ ] Application state is consistent
- [ ] Can perform complete user flow: login → create project → add task → assign → view dashboard
- [ ] No memory leaks (DevTools Performance/Memory)

## Sign-Off

Once all checks pass:
- [ ] Document any issues found
- [ ] Note any browser-specific issues
- [ ] Record load times for baseline
- [ ] Ready for user testing/deployment

---

**Test Date**: _____________
**Tested By**: _____________
**Status**: PASS / FAIL
**Notes**: ________________
