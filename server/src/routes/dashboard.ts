import { Router } from "express";
import { TaskStatus } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

export const dashboardRouter = Router();
dashboardRouter.use(requireAuth);

dashboardRouter.get("/", async (req, res) => {
  const userId = req.user!.id;
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const ownedIds = await prisma.project.findMany({
    where: { ownerId: userId },
    select: { id: true },
  });
  const memberIds = await prisma.projectMember.findMany({
    where: { userId },
    select: { projectId: true },
  });
  const projectIds = [...new Set([...ownedIds.map((p) => p.id), ...memberIds.map((m) => m.projectId)])];

  if (projectIds.length === 0) {
    res.json({
      summary: {
        totalTasks: 0,
        byStatus: { TODO: 0, IN_PROGRESS: 0, DONE: 0 },
        overdue: 0,
        dueToday: 0,
        myAssignedOpen: 0,
      },
      recentTasks: [],
    });
    return;
  }

  const [totalTasks, byStatus, overdue, dueToday, myAssignedOpen, recentTasks] = await Promise.all([
    prisma.task.count({ where: { projectId: { in: projectIds } } }),
    prisma.task.groupBy({
      by: ["status"],
      where: { projectId: { in: projectIds } },
      _count: { id: true },
    }),
    prisma.task.count({
      where: {
        projectId: { in: projectIds },
        dueDate: { lt: startOfToday },
        status: { not: TaskStatus.DONE },
      },
    }),
    prisma.task.count({
      where: {
        projectId: { in: projectIds },
        dueDate: {
          gte: startOfToday,
          lt: new Date(startOfToday.getTime() + 86400000),
        },
        status: { not: TaskStatus.DONE },
      },
    }),
    prisma.task.count({
      where: {
        projectId: { in: projectIds },
        assigneeId: userId,
        status: { not: TaskStatus.DONE },
      },
    }),
    prisma.task.findMany({
      where: { projectId: { in: projectIds } },
      take: 12,
      orderBy: { updatedAt: "desc" },
      include: {
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
      },
    }),
  ]);

  const statusMap = {
    TODO: 0,
    IN_PROGRESS: 0,
    DONE: 0,
  } as Record<TaskStatus, number>;
  for (const row of byStatus) {
    statusMap[row.status] = row._count.id;
  }

  res.json({
    summary: {
      totalTasks,
      byStatus: statusMap,
      overdue,
      dueToday,
      myAssignedOpen,
    },
    recentTasks,
  });
});
