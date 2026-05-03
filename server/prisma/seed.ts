import { PrismaClient, ProjectRole, TaskStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const PROJECT_NAME = "TaskFlow HQ";

function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  d.setHours(12, 0, 0, 0);
  return d;
}

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

async function main(): Promise<void> {
  const admin = await prisma.user.upsert({
    where: { email: "admin@taskflow.com" },
    update: {
      name: "Admin",
      passwordHash: await hashPassword("admin@123"),
    },
    create: {
      email: "admin@taskflow.com",
      name: "Admin",
      passwordHash: await hashPassword("admin@123"),
    },
  });

  const john = await prisma.user.upsert({
    where: { email: "john@taskflow.com" },
    update: { name: "John Doe", passwordHash: await hashPassword("john@123") },
    create: {
      email: "john@taskflow.com",
      name: "John Doe",
      passwordHash: await hashPassword("john@123"),
    },
  });

  const jane = await prisma.user.upsert({
    where: { email: "jane@taskflow.com" },
    update: { name: "Jane Smith", passwordHash: await hashPassword("jane@123") },
    create: {
      email: "jane@taskflow.com",
      name: "Jane Smith",
      passwordHash: await hashPassword("jane@123"),
    },
  });

  const mike = await prisma.user.upsert({
    where: { email: "mike@taskflow.com" },
    update: { name: "Mike Wilson", passwordHash: await hashPassword("mike@123") },
    create: {
      email: "mike@taskflow.com",
      name: "Mike Wilson",
      passwordHash: await hashPassword("mike@123"),
    },
  });

  let project = await prisma.project.findFirst({
    where: { ownerId: admin.id, name: PROJECT_NAME },
  });

  if (!project) {
    project = await prisma.project.create({
      data: {
        name: PROJECT_NAME,
        description:
          "Main TaskFlow workspace — team tasks, roles, and the dashboard. Invite colleagues or try the seeded member accounts.",
        ownerId: admin.id,
      },
    });
  }

  for (const user of [john, jane, mike]) {
    await prisma.projectMember.upsert({
      where: { projectId_userId: { projectId: project.id, userId: user.id } },
      update: { role: ProjectRole.MEMBER },
      create: {
        projectId: project.id,
        userId: user.id,
        role: ProjectRole.MEMBER,
      },
    });
  }

  const existingTasks = await prisma.task.count({ where: { projectId: project.id } });
  if (existingTasks === 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await prisma.task.createMany({
      data: [
        {
          projectId: project.id,
          title: "Review sprint backlog",
          description: "Prioritize stories for next iteration.",
          status: TaskStatus.IN_PROGRESS,
          dueDate: addDays(today, 1),
          assigneeId: john.id,
          createdById: admin.id,
        },
        {
          projectId: project.id,
          title: "Design dashboard refinements",
          description: "Polish stat cards and task table for the portal.",
          status: TaskStatus.TODO,
          dueDate: addDays(today, 3),
          assigneeId: jane.id,
          createdById: admin.id,
        },
        {
          projectId: project.id,
          title: "Wire up API error handling",
          status: TaskStatus.TODO,
          dueDate: addDays(today, 5),
          assigneeId: mike.id,
          createdById: jane.id,
        },
        {
          projectId: project.id,
          title: "Document RBAC rules",
          status: TaskStatus.DONE,
          dueDate: addDays(today, -2),
          assigneeId: admin.id,
          createdById: admin.id,
        },
        {
          projectId: project.id,
          title: "Weekly team sync notes",
          status: TaskStatus.TODO,
          dueDate: today,
          assigneeId: jane.id,
          createdById: john.id,
        },
        {
          projectId: project.id,
          title: "Fix overdue notification copy",
          status: TaskStatus.IN_PROGRESS,
          dueDate: addDays(today, -1),
          assigneeId: mike.id,
          createdById: admin.id,
        },
      ],
    });
  }

  console.log("Seed complete: TaskFlow demo users and project ready.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
