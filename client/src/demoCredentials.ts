/** Demo logins — shown on the sign-in page; run `npm run db:seed` in `server/` to create these users. */
export const DEMO_ACCOUNTS = [
  {
    role: "Admin",
    subtitle: "Owner · full project control",
    email: "admin@taskflow.com",
    password: "admin@123",
  },
  {
    role: "Member",
    subtitle: "John Doe",
    email: "john@taskflow.com",
    password: "john@123",
  },
  {
    role: "Member",
    subtitle: "Jane Smith",
    email: "jane@taskflow.com",
    password: "jane@123",
  },
  {
    role: "Member",
    subtitle: "Mike Wilson",
    email: "mike@taskflow.com",
    password: "mike@123",
  },
] as const;
