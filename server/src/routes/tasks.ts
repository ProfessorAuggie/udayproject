import { Router } from "express";
import { ProjectRole, TaskStatus } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { loadProjectAccess } from "../middleware/projectAccess.js";

const optionalDate = z.union([z.coerce.date(), z.null()]).optional();

const createTaskSchema = z.object({
  title: z.string().min(1).max(300).trim(),
  description: z.string().max(5000).optional().nullable(),
  status: z.nativeEnum(TaskStatus).optional(),
  assigneeId: z.string().cuid().optional().nullable(),
  dueDate: optionalDate,
});

const updateTaskSchema = z.object({
  title: z.string().min(1).max(300).trim().optional(),
  description: z.string().max(5000).optional().nullable(),
  status: z.nativeEnum(TaskStatus).optional(),
  assigneeId: z.string().cuid().optional().nullable(),
  dueDate: optionalDate,
});

export const tasksRouter = Router();
tasksRouter.use(requireAuth);

tasksRouter.get("/projects/:projectId/tasks", loadProjectAccess, async (req, res) => {
  const projectId = req.params.projectId as string;
  const tasks = await prisma.task.findMany({
    where: { projectId },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true, email: true } },
    },
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
  });
  res.json({ tasks });
});

tasksRouter.post("/projects/:projectId/tasks", loadProjectAccess, async (req, res) => {
  const parsed = createTaskSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
    return;
  }
  const projectId = req.params.projectId as string;
  const body = parsed.data;
  if (body.assigneeId) {
    const allowed = await canAssignUser(projectId, body.assigneeId);
    if (!allowed) {
      res.status(400).json({ error: "Assignee must be owner or a project member" });
      return;
    }
  }
  const task = await prisma.task.create({
    data: {
      projectId,
      title: body.title,
      description: body.description ?? null,
      status: body.status ?? TaskStatus.TODO,
      assigneeId: body.assigneeId ?? null,
      dueDate: body.dueDate ?? null,
      createdById: req.user!.id,
    },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });
  res.status(201).json({ task });
});

async function canAssignUser(projectId: string, userId: string): Promise<boolean> {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return false;
  if (project.ownerId === userId) return true;
  const m = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });
  return !!m;
}

tasksRouter.patch("/tasks/:taskId", requireAuth, async (req, res) => {
  const parsed = updateTaskSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
    return;
  }
  const taskId = req.params.taskId as string;
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { project: true },
  });
  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  const userId = req.user!.id;
  const projectId = task.projectId;
  const project = task.project;

  const isOwner = project.ownerId === userId;
  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });
  if (!isOwner && !membership) {
    res.status(403).json({ error: "Not a member of this project" });
    return;
  }
  const isAdmin = isOwner || membership?.role === ProjectRole.ADMIN;
  const isAssignee = task.assigneeId === userId;
  const isCreator = task.createdById === userId;

  const body = parsed.data;
  if (body.assigneeId !== undefined && body.assigneeId !== null) {
    const ok = await canAssignUser(projectId, body.assigneeId);
    if (!ok) {
      res.status(400).json({ error: "Assignee must be owner or a project member" });
      return;
    }
  }

  if (!isAdmin) {
    if (!isAssignee && !isCreator) {
      res.status(403).json({ error: "Only admins, assignees, or the task creator can update this task" });
      return;
    }
    if (body.title !== undefined && !isCreator) {
      res.status(403).json({ error: "Only the creator or an admin can change the title" });
      return;
    }
    if (body.description !== undefined && !isCreator) {
      res.status(403).json({ error: "Only the creator or an admin can change the description" });
      return;
    }
    if (body.dueDate !== undefined && !isCreator) {
      res.status(403).json({ error: "Only the creator or an admin can change the due date" });
      return;
    }
    if (body.assigneeId !== undefined && !isCreator) {
      res.status(403).json({ error: "Only the creator or an admin can change the assignee" });
      return;
    }
    if (body.status !== undefined && !isAssignee && !isCreator) {
      res.status(403).json({ error: "You can only update status when you are assigned or you created the task" });
      return;
    }
  }

  const data = { ...body };
  const updated = await prisma.task.update({
    where: { id: taskId },
    data,
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });
  res.json({ task: updated });
});

tasksRouter.delete("/tasks/:taskId", requireAuth, async (req, res) => {
  const taskId = req.params.taskId as string;
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { project: true },
  });
  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }
  const userId = req.user!.id;
  const projectId = task.projectId;
  const isOwner = task.project.ownerId === userId;
  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });
  const isAdmin = isOwner || membership?.role === ProjectRole.ADMIN;
  if (!isAdmin) {
    res.status(403).json({ error: "Only project admins can delete tasks" });
    return;
  }
  await prisma.task.delete({ where: { id: taskId } });
  res.status(204).send();
});
