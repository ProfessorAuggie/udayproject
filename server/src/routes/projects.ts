import { Router } from "express";
import { ProjectRole } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { loadProjectAccess, requireProjectAdmin } from "../middleware/projectAccess.js";

const createProjectSchema = z.object({
  name: z.string().min(1).max(200).trim(),
  description: z.string().max(2000).optional().nullable(),
});

const updateProjectSchema = z.object({
  name: z.string().min(1).max(200).trim().optional(),
  description: z.string().max(2000).optional().nullable(),
});

const addMemberSchema = z.object({
  email: z.string().email(),
  role: z.nativeEnum(ProjectRole),
});

const updateMemberSchema = z.object({
  role: z.nativeEnum(ProjectRole),
});

export const projectsRouter = Router();
projectsRouter.use(requireAuth);

projectsRouter.get("/", async (req, res) => {
  const userId = req.user!.id;
  const owned = await prisma.project.findMany({
    where: { ownerId: userId },
    include: {
      _count: { select: { tasks: true, members: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
  const memberOf = await prisma.projectMember.findMany({
    where: { userId },
    include: {
      project: {
        include: { _count: { select: { tasks: true, members: true } } },
      },
    },
    orderBy: { joinedAt: "desc" },
  });

  const list = [
    ...owned.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      role: "ADMIN" as const,
      isOwner: true,
      taskCount: p._count.tasks,
      memberCount: p._count.members + 1,
      updatedAt: p.updatedAt,
    })),
    ...memberOf.map((m) => ({
      id: m.project.id,
      name: m.project.name,
      description: m.project.description,
      role: m.role,
      isOwner: false,
      taskCount: m.project._count.tasks,
      memberCount: m.project._count.members + 1,
      updatedAt: m.project.updatedAt,
    })),
  ];
  res.json({ projects: list });
});

projectsRouter.post("/", async (req, res) => {
  const parsed = createProjectSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
    return;
  }
  const { name, description } = parsed.data;
  const project = await prisma.project.create({
    data: {
      name,
      description: description ?? null,
      ownerId: req.user!.id,
    },
  });
  res.status(201).json({ project });
});

/** Member routes must be registered before `/:projectId` so `members` is not captured as an id. */
projectsRouter.get("/:projectId/members", loadProjectAccess, async (req, res) => {
  const projectId = req.params.projectId as string;
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      members: { include: { user: { select: { id: true, name: true, email: true } } } },
    },
  });
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  const rows = [
    {
      userId: project.owner.id,
      role: ProjectRole.ADMIN,
      user: project.owner,
      isOwner: true,
    },
    ...project.members.map((m) => ({
      userId: m.userId,
      role: m.role,
      user: m.user,
      isOwner: false,
    })),
  ];
  res.json({ members: rows });
});

projectsRouter.post("/:projectId/members", loadProjectAccess, requireProjectAdmin, async (req, res) => {
  const parsed = addMemberSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
    return;
  }
  const projectId = req.params.projectId as string;
  const { email, role } = parsed.data;
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  if (email.toLowerCase() === (await prisma.user.findUnique({ where: { id: project.ownerId } }))?.email) {
    res.status(400).json({ error: "Owner is already a member" });
    return;
  }
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) {
    res.status(404).json({ error: "No user with that email" });
    return;
  }
  if (user.id === project.ownerId) {
    res.status(400).json({ error: "Owner is already on the project" });
    return;
  }
  try {
    const member = await prisma.projectMember.create({
      data: { projectId, userId: user.id, role },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    res.status(201).json({ member: { ...member, isOwner: false } });
  } catch {
    res.status(409).json({ error: "User is already a member" });
  }
});

projectsRouter.patch(
  "/:projectId/members/:userId",
  loadProjectAccess,
  requireProjectAdmin,
  async (req, res) => {
    const parsed = updateMemberSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
      return;
    }
    const projectId = req.params.projectId as string;
    const userId = req.params.userId as string;
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }
    if (userId === project.ownerId) {
      res.status(400).json({ error: "Cannot change owner role via members API" });
      return;
    }
    const updated = await prisma.projectMember.update({
      where: { projectId_userId: { projectId, userId } },
      data: { role: parsed.data.role },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    res.json({ member: { ...updated, isOwner: false } });
  },
);

projectsRouter.delete(
  "/:projectId/members/:userId",
  loadProjectAccess,
  requireProjectAdmin,
  async (req, res) => {
    const projectId = req.params.projectId as string;
    const userId = req.params.userId as string;
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }
    if (userId === project.ownerId) {
      res.status(400).json({ error: "Cannot remove the project owner" });
      return;
    }
    await prisma.projectMember.delete({
      where: { projectId_userId: { projectId, userId } },
    });
    res.status(204).send();
  },
);

projectsRouter.get("/:projectId", loadProjectAccess, async (req, res) => {
  const projectId = req.params.projectId as string;
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { joinedAt: "asc" },
      },
      _count: { select: { tasks: true } },
    },
  });
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  const access = req.projectAccess!;
  res.json({
    project: {
      id: project.id,
      name: project.name,
      description: project.description,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      owner: project.owner,
      members: project.members.map((m) => ({
        userId: m.userId,
        role: m.role,
        user: m.user,
        joinedAt: m.joinedAt,
      })),
      taskCount: project._count.tasks,
      yourRole: access.role,
      isOwner: access.isOwner,
    },
  });
});

projectsRouter.patch("/:projectId", loadProjectAccess, requireProjectAdmin, async (req, res) => {
  const parsed = updateProjectSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
    return;
  }
  const projectId = req.params.projectId as string;
  const data = parsed.data;
  if (Object.keys(data).length === 0) {
    res.status(400).json({ error: "No fields to update" });
    return;
  }
  const project = await prisma.project.update({
    where: { id: projectId },
    data,
  });
  res.json({ project });
});

projectsRouter.delete("/:projectId", loadProjectAccess, requireProjectAdmin, async (req, res) => {
  if (!req.projectAccess!.isOwner) {
    res.status(403).json({ error: "Only the project owner can delete the project" });
    return;
  }
  await prisma.project.delete({ where: { id: req.params.projectId as string } });
  res.status(204).send();
});
