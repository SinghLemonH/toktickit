import { Router, type Response } from "express";
import type { TicketStatus } from "@prisma/client";
import { getPrisma } from "../prisma.js";
import {
  requireAuth,
  requirePasswordChangeCompleted,
  requireRole,
  type AuthenticatedRequest,
} from "../middleware/auth.js";

export const dashboardRouter = Router();

export const ACTIVE_STATUSES: TicketStatus[] = [
  "NEW",
  "OPEN",
  "IN_PROGRESS",
  "WAITING_FOR_REQUESTER",
  "REOPENED",
  "PENDING",
];

// GET /api/dashboard/requester
// Scoped strictly to the authenticated Requester
dashboardRouter.get(
  "/api/dashboard/requester",
  requireAuth,
  requirePasswordChangeCompleted,
  requireRole("REQUESTER"),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const prisma = getPrisma();
      const requesterId = req.user!.id;
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const [
        myOpenTickets,
        waitingForRequester,
        inProgress,
        resolved,
        closed,
        attentionTicketsRows,
        recentTicketsRows,
      ] = await prisma.$transaction([
        prisma.ticket.count({
          where: { requesterId, currentStatus: { in: ACTIVE_STATUSES } },
        }),
        prisma.ticket.count({
          where: { requesterId, currentStatus: "WAITING_FOR_REQUESTER" },
        }),
        prisma.ticket.count({
          where: { requesterId, currentStatus: "IN_PROGRESS" },
        }),
        prisma.ticket.count({
          where: { requesterId, currentStatus: "RESOLVED" },
        }),
        prisma.ticket.count({
          where: { requesterId, currentStatus: "CLOSED" },
        }),
        prisma.ticket.findMany({
          where: { requesterId, currentStatus: "WAITING_FOR_REQUESTER" },
          orderBy: { updatedAt: "desc" },
          take: 5,
          select: {
            id: true,
            ticketNumber: true,
            summary: true,
            currentStatus: true,
            updatedAt: true,
          },
        }),
        prisma.ticket.findMany({
          where: {
            requesterId,
            updatedAt: { gte: sevenDaysAgo },
          },
          orderBy: { updatedAt: "desc" },
          take: 5,
          select: {
            id: true,
            ticketNumber: true,
            summary: true,
            currentStatus: true,
            updatedAt: true,
          },
        }),
      ]);

      const attentionTickets = attentionTicketsRows.map((t) => ({
        id: t.id,
        ticketNumber: t.ticketNumber,
        title: t.summary,
        currentStatus: t.currentStatus,
        updatedAt: t.updatedAt.toISOString(),
      }));

      const recentTickets = recentTicketsRows.map((t) => ({
        id: t.id,
        ticketNumber: t.ticketNumber,
        title: t.summary,
        currentStatus: t.currentStatus,
        updatedAt: t.updatedAt.toISOString(),
      }));

      res.status(200).json({
        metrics: {
          myOpenTickets,
          waitingForRequester,
          inProgress,
          resolved,
          closed,
        },
        links: {
          myOpenTickets: "/tickets?statusGroup=active",
          waitingForRequester: "/tickets?currentStatus=WAITING_FOR_REQUESTER",
          inProgress: "/tickets?currentStatus=IN_PROGRESS",
          resolved: "/tickets?currentStatus=RESOLVED",
          closed: "/tickets?currentStatus=CLOSED",
        },
        attentionTickets,
        recentTickets,
        timeZone: "Asia/Bangkok",
        generatedAt: now.toISOString(),
      });
    } catch (error) {
      console.error("Requester dashboard error:", error);
      res.status(500).json({
        error: {
          code: "INTERNAL_ERROR",
          message: "Unable to retrieve requester dashboard data",
        },
      });
    }
  }
);

// GET /api/dashboard/staff
// Operational queue statistics for IT Staff and Administrators
dashboardRouter.get(
  "/api/dashboard/staff",
  requireAuth,
  requirePasswordChangeCompleted,
  requireRole("IT_STAFF", "ADMINISTRATOR"),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const prisma = getPrisma();
      const staffUserId = req.user!.id;
      const isAdmin = req.user!.role === "ADMINISTRATOR";
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const result = await prisma.$transaction(async (tx) => {
        const [
          newTickets,
          openTickets,
          inProgress,
          waitingForRequester,
          myAssigned,
          unassigned,
          recentTicketsRows,
        ] = await Promise.all([
          tx.ticket.count({ where: { currentStatus: "NEW" } }),
          tx.ticket.count({ where: { currentStatus: "OPEN" } }),
          tx.ticket.count({ where: { currentStatus: "IN_PROGRESS" } }),
          tx.ticket.count({ where: { currentStatus: "WAITING_FOR_REQUESTER" } }),
          tx.ticket.count({
            where: {
              assignedToId: staffUserId,
              currentStatus: { in: ACTIVE_STATUSES },
            },
          }),
          tx.ticket.count({
            where: {
              assignedToId: null,
              currentStatus: { in: ACTIVE_STATUSES },
            },
          }),
          tx.ticket.findMany({
            where: {
              updatedAt: { gte: sevenDaysAgo },
            },
            orderBy: { updatedAt: "desc" },
            take: 5,
            select: {
              id: true,
              ticketNumber: true,
              summary: true,
              currentStatus: true,
              updatedAt: true,
            },
          }),
        ]);

        let userCounts: { totalUsers: number; activeUsers: number; inactiveUsers: number } | undefined;
        if (isAdmin) {
          const [totalUsers, activeUsers, inactiveUsers] = await Promise.all([
            tx.user.count(),
            tx.user.count({ where: { isActive: true } }),
            tx.user.count({ where: { isActive: false } }),
          ]);
          userCounts = { totalUsers, activeUsers, inactiveUsers };
        }

        return {
          newTickets,
          openTickets,
          inProgress,
          waitingForRequester,
          myAssigned,
          unassigned,
          recentTicketsRows,
          userCounts,
        };
      });

      const recentTickets = result.recentTicketsRows.map((t) => ({
        id: t.id,
        ticketNumber: t.ticketNumber,
        title: t.summary,
        currentStatus: t.currentStatus,
        updatedAt: t.updatedAt.toISOString(),
      }));

      const responsePayload: Record<string, unknown> = {
        metrics: {
          newTickets: result.newTickets,
          openTickets: result.openTickets,
          inProgress: result.inProgress,
          waitingForRequester: result.waitingForRequester,
          myAssigned: result.myAssigned,
          unassigned: result.unassigned,
        },
        links: {
          newTickets: "/staff/queue?status=NEW",
          openTickets: "/staff/queue?status=OPEN",
          inProgress: "/staff/queue?status=IN_PROGRESS",
          waitingForRequester: "/staff/queue?status=WAITING_FOR_REQUESTER",
          myAssigned: "/staff/queue?assignedTo=me&statusGroup=active",
          unassigned: "/staff/queue?assignedTo=unassigned&statusGroup=active",
        },
        recentTickets,
      };

      if (isAdmin && result.userCounts) {
        responsePayload.userCounts = result.userCounts;
      }

      responsePayload.timeZone = "Asia/Bangkok";
      responsePayload.generatedAt = now.toISOString();

      res.status(200).json(responsePayload);
    } catch (error) {
      console.error("Staff dashboard error:", error);
      res.status(500).json({
        error: {
          code: "INTERNAL_ERROR",
          message: "Unable to retrieve staff dashboard data",
        },
      });
    }
  }
);
