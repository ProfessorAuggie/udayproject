import type { NextFunction, Request, Response } from "express";
import { ProjectRole } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

export type ProjectAccess = {
  projectId: string;
  role: ProjectRole;
  isOwner: boolean;
};

declare global {
  namespace Express {
    interface Request {
      projectAccess?: ProjectAccess;
    }
  }
}

function paramStr(p: string | string[] | undefined): string | undefined {
  if (p === undefined) return undefined;
  return Array.isArray(p) ? p[0] : p;
}

/** Loads membership (or owner) for :projectId. Sets req.projectAccess. */
export async function loadProjectAccess(req: Request, res: Response, next: NextFunction) {
  const projectId = paramStr(req.params.projectId);
  if (!projectId) {
    res.status(400).json({ error: "projectId required" });
    return;
  }
  const userId = req.user!.id;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, ownerId: true },
  });
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  if (project.ownerId === userId) {
    req.projectAccess = { projectId: project.id, role: ProjectRole.ADMIN, isOwner: true };
    next();
    return;
  }

  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });
  if (!member) {
    res.status(403).json({ error: "Not a member of this project" });
    return;
  }

  req.projectAccess = { projectId, role: member.role, isOwner: false };
  next();
}

export function requireProjectAdmin(req: Request, res: Response, next: NextFunction) {
  const access = req.projectAccess;
  if (!access || access.role !== ProjectRole.ADMIN) {
    res.status(403).json({ error: "Admin role required" });
    return;
  }
  next();
}
