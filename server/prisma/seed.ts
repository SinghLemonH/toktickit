import { getPrisma } from "../src/prisma.js";
import type { Role, Priority, TicketStatus, ActionStatus } from "@prisma/client";

const CATEGORY_NAMES = ["Account and Access", "Hardware", "Software", "Network"];

const RELATED_SYSTEM_NAMES = [
  "Email",
  "Campus Wi-Fi",
  "VPN",
  "LEB2 App",
  "Grade Submission App",
  "Printer",
  "Corporate Laptop",
];

// Compliant password hashes (bcrypt salt rounds >= 10, length >= 8 with upper, lower, digit, symbol)
// Hash for "Admin123!"
const ADMIN_PASSWORD_HASH = "$2b$10$i4Gl/wvUizDGwIEr4e0fsOM4XtJ5k5Hnsu3mSoMTuJqf6MBoZWOlW";
// Hash for "Password123!"
const USER_PASSWORD_HASH = "$2b$10$DuNLpS.JeLH2u73kWcxwY.E5JIyngJ40VSFrtVci5hmWACgY6wkPK";

interface SeedUser {
  email: string;
  name: string;
  role: Role;
  isActive: boolean;
  mustChangePassword: boolean;
  passwordHash: string;
}

const SEED_USERS: SeedUser[] = [
  // Administrator (at least 1 active)
  {
    email: "admin@toktickit.com",
    name: "John Smith",
    role: "ADMINISTRATOR",
    isActive: true,
    mustChangePassword: false,
    passwordHash: ADMIN_PASSWORD_HASH,
  },
  // IT Staff (at least 3 active, 1 inactive)
  {
    email: "michael.brown@example.com",
    name: "Michael Brown",
    role: "IT_STAFF",
    isActive: true,
    mustChangePassword: false,
    passwordHash: USER_PASSWORD_HASH,
  },
  {
    email: "sarah.johnson@example.com",
    name: "Sarah Johnson",
    role: "IT_STAFF",
    isActive: true,
    mustChangePassword: false,
    passwordHash: USER_PASSWORD_HASH,
  },
  {
    email: "robert.wilson@example.com",
    name: "Robert Wilson",
    role: "IT_STAFF",
    isActive: true,
    mustChangePassword: true,
    passwordHash: USER_PASSWORD_HASH,
  },
  {
    email: "lisa.martinez@example.com",
    name: "Lisa Martinez",
    role: "IT_STAFF",
    isActive: false,
    mustChangePassword: true,
    passwordHash: USER_PASSWORD_HASH,
  },
  // Requesters (at least 4 active, 1 inactive)
  {
    email: "jennifer.anderson@example.com",
    name: "Jennifer Anderson",
    role: "REQUESTER",
    isActive: true,
    mustChangePassword: false,
    passwordHash: USER_PASSWORD_HASH,
  },
  {
    email: "david.lee@example.com",
    name: "David Lee",
    role: "REQUESTER",
    isActive: true,
    mustChangePassword: true,
    passwordHash: USER_PASSWORD_HASH,
  },
  {
    email: "emily.davis@example.com",
    name: "Emily Davis",
    role: "REQUESTER",
    isActive: true,
    mustChangePassword: true,
    passwordHash: USER_PASSWORD_HASH,
  },
  {
    email: "alex.thompson@example.com",
    name: "Alex Thompson",
    role: "REQUESTER",
    isActive: true,
    mustChangePassword: true,
    passwordHash: USER_PASSWORD_HASH,
  },
  {
    email: "kevin.patel@example.com",
    name: "Kevin Patel",
    role: "REQUESTER",
    isActive: false,
    mustChangePassword: true,
    passwordHash: USER_PASSWORD_HASH,
  },
];

// Synced DevRequester records for Lab 2 backwards compatibility
const DEV_REQUESTERS = [
  { name: "Jennifer Anderson", email: "jennifer.anderson@example.com", isActive: true },
  { name: "Michael Brown", email: "michael.brown@example.com", isActive: true },
  { name: "Sarah Johnson", email: "sarah.johnson@example.com", isActive: true },
  { name: "David Lee", email: "david.lee@example.com", isActive: true },
  { name: "Emily Davis", email: "emily.davis@example.com", isActive: true },
  { name: "Alex Thompson", email: "alex.thompson@example.com", isActive: true },
  { name: "Inactive Test User", email: "inactive.user@example.com", isActive: false },
];

interface SeedAction {
  clientRequestId: string;
  description: string;
  result?: string;
  status: ActionStatus;
  performedByEmail: string;
  assigneeEmail?: string;
  completedByEmail?: string;
  followUpRequired?: boolean;
  followUpNote?: string;
  actionAtOffsetDays?: number;
}

interface SeedStatusHistory {
  fromStatus: TicketStatus;
  toStatus: TicketStatus;
  changedByEmail: string;
  reason?: string;
  offsetDays?: number;
}

interface SeedTicket {
  ticketNumber: string;
  requesterEmail: string;
  assignedToEmail?: string;
  categoryName: string;
  relatedSystemName: string;
  summary: string;
  description: string;
  requestedPriority: Priority;
  itPriority?: Priority;
  currentStatus: TicketStatus;
  isProblemResolvedIndicated?: boolean;
  createdAtOffsetDays?: number;
  comments?: Array<{ authorEmail: string; content: string }>;
  internalNotes?: Array<{ authorEmail: string; content: string }>;
  actions?: SeedAction[];
  statusHistory?: SeedStatusHistory[];
}

const SEED_TICKETS: SeedTicket[] = [
  {
    ticketNumber: "TKT-2026-000001",
    requesterEmail: "jennifer.anderson@example.com",
    assignedToEmail: "michael.brown@example.com",
    categoryName: "Hardware",
    relatedSystemName: "Corporate Laptop",
    summary: "Laptop battery drains unusually fast during normal office tasks",
    description: "The battery level drops from 100% to 20% in less than an hour of normal office use without running intensive tasks.",
    requestedPriority: "MEDIUM",
    itPriority: "HIGH",
    currentStatus: "IN_PROGRESS",
    isProblemResolvedIndicated: false,
    createdAtOffsetDays: 3,
    comments: [
      {
        authorEmail: "jennifer.anderson@example.com",
        content: "I ran battery calibration overnight as suggested, but the discharge rate remains unchanged.",
      },
      {
        authorEmail: "michael.brown@example.com",
        content: "Thank you for the update. Please bring the laptop to IT Room 402 for hardware diagnostic testing.",
      },
    ],
    internalNotes: [
      {
        authorEmail: "michael.brown@example.com",
        content: "Hardware diagnostic shows 68% maximum battery capacity with 720 cycle count. Ordered replacement battery pack.",
      },
    ],
    actions: [
      {
        clientRequestId: "seed-act-001-1",
        description: "Tested battery cell degradation using battery diagnostic utility.",
        result: "Battery health 68%, replacement needed.",
        status: "COMPLETED",
        performedByEmail: "michael.brown@example.com",
        assigneeEmail: "michael.brown@example.com",
        completedByEmail: "michael.brown@example.com",
        actionAtOffsetDays: 2,
      },
      {
        clientRequestId: "seed-act-001-2",
        description: "Install replacement OEM battery and perform 100% calibration cycle.",
        status: "PLANNED",
        performedByEmail: "michael.brown@example.com",
        assigneeEmail: "michael.brown@example.com",
        followUpRequired: true,
        followUpNote: "Notify requester once replacement pack arrives from supplier.",
        actionAtOffsetDays: 0,
      },
    ],
    statusHistory: [
      {
        fromStatus: "NEW",
        toStatus: "IN_PROGRESS",
        changedByEmail: "michael.brown@example.com",
        offsetDays: 3,
      },
    ],
  },
  {
    ticketNumber: "TKT-2026-000002",
    requesterEmail: "david.lee@example.com",
    assignedToEmail: "sarah.johnson@example.com",
    categoryName: "Network",
    relatedSystemName: "VPN",
    summary: "Cannot connect to Tokyo branch VPN gateway",
    description: "VPN client reports connection timed out whenever attempting to authenticate with the Tokyo data center gateway.",
    requestedPriority: "HIGH",
    itPriority: "HIGH",
    currentStatus: "OPEN",
    isProblemResolvedIndicated: false,
    createdAtOffsetDays: 4,
    comments: [
      {
        authorEmail: "sarah.johnson@example.com",
        content: "We are actively investigating routing between the local ISP and the Tokyo gateway.",
      },
    ],
    internalNotes: [
      {
        authorEmail: "sarah.johnson@example.com",
        content: "BGP route flap detected on transit provider link. Escalated to NOC level 2.",
      },
    ],
    actions: [
      {
        clientRequestId: "seed-act-002-1",
        description: "Coordinate with Tokyo NOC engineer to inspect transit routing table.",
        status: "PLANNED",
        performedByEmail: "sarah.johnson@example.com",
        assigneeEmail: "sarah.johnson@example.com",
      },
    ],
    statusHistory: [
      {
        fromStatus: "NEW",
        toStatus: "OPEN",
        changedByEmail: "sarah.johnson@example.com",
        offsetDays: 4,
      },
    ],
  },
  {
    ticketNumber: "TKT-2026-000003",
    requesterEmail: "emily.davis@example.com",
    assignedToEmail: "michael.brown@example.com",
    categoryName: "Software",
    relatedSystemName: "LEB2 App",
    summary: "Grade export CSV character encoding issue in LEB2",
    description: "Exporting semester grades generates a CSV where Thai language student names appear as garbled characters.",
    requestedPriority: "MEDIUM",
    itPriority: "MEDIUM",
    currentStatus: "WAITING_FOR_REQUESTER",
    isProblemResolvedIndicated: false,
    createdAtOffsetDays: 5,
    comments: [
      {
        authorEmail: "michael.brown@example.com",
        content: "Could you please confirm if opening the file via Excel with UTF-8 encoding displays the text properly?",
      },
    ],
    internalNotes: [
      {
        authorEmail: "michael.brown@example.com",
        content: "Confirmed backend export endpoint sends ISO-8859-1 header instead of UTF-8 BOM. Bug report filed for engineering.",
      },
    ],
    actions: [
      {
        clientRequestId: "seed-act-003-1",
        description: "Reproduced export character set encoding mismatch in test environment.",
        result: "Export lacks UTF-8 BOM header.",
        status: "COMPLETED",
        performedByEmail: "michael.brown@example.com",
        assigneeEmail: "michael.brown@example.com",
        completedByEmail: "michael.brown@example.com",
        actionAtOffsetDays: 4,
      },
    ],
    statusHistory: [
      {
        fromStatus: "NEW",
        toStatus: "IN_PROGRESS",
        changedByEmail: "michael.brown@example.com",
        offsetDays: 5,
      },
      {
        fromStatus: "IN_PROGRESS",
        toStatus: "WAITING_FOR_REQUESTER",
        changedByEmail: "michael.brown@example.com",
        reason: "Awaiting confirmation from requester regarding Excel UTF-8 import",
        offsetDays: 3,
      },
    ],
  },
  {
    ticketNumber: "TKT-2026-000004",
    requesterEmail: "alex.thompson@example.com",
    categoryName: "Account and Access",
    relatedSystemName: "Email",
    summary: "Password reset request for departmental outreach email account",
    description: "Our student club advisor changed and we need the shared departmental email credentials reset.",
    requestedPriority: "LOW",
    itPriority: "LOW",
    currentStatus: "NEW",
    isProblemResolvedIndicated: false,
    createdAtOffsetDays: 1,
  },
  {
    ticketNumber: "TKT-2026-000005",
    requesterEmail: "jennifer.anderson@example.com",
    categoryName: "Hardware",
    relatedSystemName: "Printer",
    summary: "Second floor printer jam cleared but still reporting error 50.1",
    description: "The physical paper jam was cleared from tray 2, but the printer display continues to report paper jam error 50.1.",
    requestedPriority: "LOW",
    itPriority: "LOW",
    currentStatus: "OPEN",
    isProblemResolvedIndicated: true,
    createdAtOffsetDays: 2,
    comments: [
      {
        authorEmail: "jennifer.anderson@example.com",
        content: "Problem appears resolved: The power cycle cleared the sensor flag and test pages print normally now.",
      },
    ],
    internalNotes: [
      {
        authorEmail: "admin@toktickit.com",
        content: "Requester indicated problem appears resolved. IT Staff will follow up and close ticket if no further issues.",
      },
    ],
    statusHistory: [
      {
        fromStatus: "NEW",
        toStatus: "OPEN",
        changedByEmail: "admin@toktickit.com",
        offsetDays: 2,
      },
    ],
  },
  {
    ticketNumber: "TKT-2026-000006",
    requesterEmail: "david.lee@example.com",
    assignedToEmail: "sarah.johnson@example.com",
    categoryName: "Account and Access",
    relatedSystemName: "Grade Submission App",
    summary: "Instructor access permission required for semester grade entry",
    description: "I have been assigned to lecture INT305 this semester but do not yet see the course in Grade Submission App.",
    requestedPriority: "HIGH",
    itPriority: "HIGH",
    currentStatus: "RESOLVED",
    isProblemResolvedIndicated: true,
    createdAtOffsetDays: 3,
    comments: [
      {
        authorEmail: "sarah.johnson@example.com",
        content: "Departmental dean approval confirmed. Instructor permissions have been provisioned for INT305.",
      },
      {
        authorEmail: "david.lee@example.com",
        content: "Access confirmed! All course sections are visible now. Thank you for the prompt assistance.",
      },
    ],
    internalNotes: [
      {
        authorEmail: "sarah.johnson@example.com",
        content: "Granted instructor role in portal; verified user can save drafts.",
      },
    ],
    actions: [
      {
        clientRequestId: "seed-act-006-1",
        description: "Provisioned INT305 instructor permissions in core portal.",
        result: "Instructor role granted and active.",
        status: "COMPLETED",
        performedByEmail: "sarah.johnson@example.com",
        assigneeEmail: "sarah.johnson@example.com",
        completedByEmail: "sarah.johnson@example.com",
        actionAtOffsetDays: 2,
      },
    ],
    statusHistory: [
      {
        fromStatus: "NEW",
        toStatus: "IN_PROGRESS",
        changedByEmail: "sarah.johnson@example.com",
        offsetDays: 3,
      },
      {
        fromStatus: "IN_PROGRESS",
        toStatus: "RESOLVED",
        changedByEmail: "sarah.johnson@example.com",
        reason: "Access provisioned and verified by requester",
        offsetDays: 1,
      },
    ],
  },
  {
    ticketNumber: "TKT-2026-000007",
    requesterEmail: "jennifer.anderson@example.com",
    assignedToEmail: "robert.wilson@example.com",
    categoryName: "Software",
    relatedSystemName: "LEB2 App",
    summary: "Assignment submission timeout error on large archive uploads",
    description: "Submitting assignment archives exceeding 50MB results in HTTP 504 gateway timeout.",
    requestedPriority: "MEDIUM",
    itPriority: "MEDIUM",
    currentStatus: "CLOSED",
    createdAtOffsetDays: 10,
    actions: [
      {
        clientRequestId: "seed-act-007-1",
        description: "Increased NGINX client_max_body_size and proxy timeout limit on LEB2 edge ingress.",
        result: "Max upload limit raised to 250MB with 120s timeout.",
        status: "COMPLETED",
        performedByEmail: "robert.wilson@example.com",
        assigneeEmail: "robert.wilson@example.com",
        completedByEmail: "robert.wilson@example.com",
        actionAtOffsetDays: 9,
      },
    ],
    statusHistory: [
      { fromStatus: "NEW", toStatus: "IN_PROGRESS", changedByEmail: "robert.wilson@example.com", offsetDays: 10 },
      { fromStatus: "IN_PROGRESS", toStatus: "RESOLVED", changedByEmail: "robert.wilson@example.com", offsetDays: 9 },
      { fromStatus: "RESOLVED", toStatus: "CLOSED", changedByEmail: "robert.wilson@example.com", reason: "Auto-closed after 7 days without requester response", offsetDays: 8 },
    ],
  },
  {
    ticketNumber: "TKT-2026-000008",
    requesterEmail: "emily.davis@example.com",
    assignedToEmail: "michael.brown@example.com",
    categoryName: "Network",
    relatedSystemName: "Campus Wi-Fi",
    summary: "Wi-Fi signal drops intermittently in Faculty of Science Room 204",
    description: "Students report frequent disconnection from Campus Wi-Fi every 10 to 15 minutes during lecture.",
    requestedPriority: "HIGH",
    itPriority: "HIGH",
    currentStatus: "REOPENED",
    createdAtOffsetDays: 8,
    actions: [
      {
        clientRequestId: "seed-act-008-1",
        description: "Replaced 5GHz wireless access point power injector in Room 204.",
        result: "Access point online with 200Mbps throughput.",
        status: "COMPLETED",
        performedByEmail: "michael.brown@example.com",
        assigneeEmail: "michael.brown@example.com",
        completedByEmail: "michael.brown@example.com",
        actionAtOffsetDays: 6,
      },
      {
        clientRequestId: "seed-act-008-2",
        description: "Conduct spectrum survey to identify 2.4GHz interference sources.",
        status: "PLANNED",
        performedByEmail: "michael.brown@example.com",
        assigneeEmail: "michael.brown@example.com",
        actionAtOffsetDays: 1,
      },
    ],
    statusHistory: [
      { fromStatus: "NEW", toStatus: "IN_PROGRESS", changedByEmail: "michael.brown@example.com", offsetDays: 8 },
      { fromStatus: "IN_PROGRESS", toStatus: "RESOLVED", changedByEmail: "michael.brown@example.com", offsetDays: 6 },
      { fromStatus: "RESOLVED", toStatus: "REOPENED", changedByEmail: "emily.davis@example.com", reason: "Wi-Fi connection drops intermittently again during afternoon lab session", offsetDays: 2 },
    ],
  },
  {
    ticketNumber: "TKT-2026-000009",
    requesterEmail: "alex.thompson@example.com",
    assignedToEmail: "sarah.johnson@example.com",
    categoryName: "Hardware",
    relatedSystemName: "Corporate Laptop",
    summary: "External monitor HDMI port adapter requested for presentation",
    description: "Requesting USB-C to HDMI adapter for weekly lab research symposium.",
    requestedPriority: "LOW",
    itPriority: "LOW",
    currentStatus: "CANCELLED",
    createdAtOffsetDays: 5,
    actions: [
      {
        clientRequestId: "seed-act-009-1",
        description: "Allocate USB-C dongle from department storage.",
        status: "CANCELLED",
        performedByEmail: "sarah.johnson@example.com",
        assigneeEmail: "sarah.johnson@example.com",
      },
    ],
    statusHistory: [
      { fromStatus: "NEW", toStatus: "CANCELLED", changedByEmail: "sarah.johnson@example.com", reason: "Requester found personal adapter and withdrew request", offsetDays: 4 },
    ],
  },
  {
    ticketNumber: "TKT-2026-000010",
    requesterEmail: "david.lee@example.com",
    assignedToEmail: "michael.brown@example.com",
    categoryName: "Software",
    relatedSystemName: "LEB2 App",
    summary: "Database connection pool exhausted during midterm exam submission window",
    description: "System threw 500 internal server errors when 400 concurrent students submitted quizzes simultaneously.",
    requestedPriority: "HIGH",
    itPriority: "HIGH",
    currentStatus: "IN_PROGRESS",
    createdAtOffsetDays: 2,
    actions: [
      {
        clientRequestId: "seed-act-010-1",
        description: "Inspected database connection pool settings and raised max pool size from 20 to 50 connections.",
        result: "Connection pool adjusted and metrics monitored.",
        status: "COMPLETED",
        performedByEmail: "michael.brown@example.com",
        assigneeEmail: "michael.brown@example.com",
        completedByEmail: "michael.brown@example.com",
        actionAtOffsetDays: 1,
      },
      {
        clientRequestId: "seed-act-010-2",
        description: "Set up PgBouncer connection pooling layer in front of PostgreSQL cluster.",
        status: "PLANNED",
        performedByEmail: "michael.brown@example.com",
        assigneeEmail: "michael.brown@example.com",
        actionAtOffsetDays: 0,
      },
    ],
    statusHistory: [
      { fromStatus: "NEW", toStatus: "IN_PROGRESS", changedByEmail: "michael.brown@example.com", offsetDays: 2 },
    ],
  },
  {
    ticketNumber: "TKT-2026-000011",
    requesterEmail: "jennifer.anderson@example.com",
    assignedToEmail: "sarah.johnson@example.com",
    categoryName: "Account and Access",
    relatedSystemName: "VPN",
    summary: "Annual TLS certificate renewal for staff remote VPN profiles",
    description: "Routine certificate rotation before the current wildcard certificate expiration date.",
    requestedPriority: "MEDIUM",
    itPriority: "MEDIUM",
    currentStatus: "RESOLVED",
    createdAtOffsetDays: 12,
    actions: [
      {
        clientRequestId: "seed-act-011-1",
        description: "Generated 4096-bit RSA CSR and obtained certificate signed by corporate CA.",
        result: "Certificate renewed and deployed until 2027.",
        status: "COMPLETED",
        performedByEmail: "sarah.johnson@example.com",
        assigneeEmail: "sarah.johnson@example.com",
        completedByEmail: "sarah.johnson@example.com",
        actionAtOffsetDays: 11,
      },
    ],
    statusHistory: [
      { fromStatus: "NEW", toStatus: "IN_PROGRESS", changedByEmail: "sarah.johnson@example.com", offsetDays: 12 },
      { fromStatus: "IN_PROGRESS", toStatus: "RESOLVED", changedByEmail: "sarah.johnson@example.com", reason: "Certificates renewed across all active tunnels", offsetDays: 11 },
    ],
  },
  {
    ticketNumber: "TKT-2026-000012",
    requesterEmail: "alex.thompson@example.com",
    assignedToEmail: "robert.wilson@example.com",
    categoryName: "Hardware",
    relatedSystemName: "Printer",
    summary: "Black toner cartridge empty on library first floor multi-function printer",
    description: "Display prompts 'Toner Low / Replace Black' and printouts exhibit faint horizontal lines.",
    requestedPriority: "LOW",
    itPriority: "LOW",
    currentStatus: "WAITING_FOR_REQUESTER",
    createdAtOffsetDays: 3,
    actions: [
      {
        clientRequestId: "seed-act-012-1",
        description: "Verified model cartridge number HP 89A in storage stockroom.",
        status: "PLANNED",
        performedByEmail: "robert.wilson@example.com",
        assigneeEmail: "robert.wilson@example.com",
        actionAtOffsetDays: 1,
      },
    ],
    statusHistory: [
      { fromStatus: "NEW", toStatus: "IN_PROGRESS", changedByEmail: "robert.wilson@example.com", offsetDays: 3 },
      { fromStatus: "IN_PROGRESS", toStatus: "WAITING_FOR_REQUESTER", changedByEmail: "robert.wilson@example.com", reason: "Asked librarian if backup toner is stored in cabinet", offsetDays: 2 },
    ],
  },
  {
    ticketNumber: "TKT-2026-000013",
    requesterEmail: "emily.davis@example.com",
    assignedToEmail: "sarah.johnson@example.com",
    categoryName: "Network",
    relatedSystemName: "Campus Wi-Fi",
    summary: "Wireless controller firmware update scheduled for core campus buildings",
    description: "Vendor advisory requires applying hotfix for 802.11ax roaming vulnerability.",
    requestedPriority: "MEDIUM",
    itPriority: "MEDIUM",
    currentStatus: "IN_PROGRESS",
    createdAtOffsetDays: 2,
    actions: [
      {
        clientRequestId: "seed-act-013-1",
        description: "Deployed firmware release v4.2.1 across primary wireless controller.",
        result: "Controller successfully rebooted; zero AP dropouts observed.",
        status: "COMPLETED",
        performedByEmail: "sarah.johnson@example.com",
        assigneeEmail: "sarah.johnson@example.com",
        completedByEmail: "sarah.johnson@example.com",
        actionAtOffsetDays: 1,
      },
    ],
    statusHistory: [
      { fromStatus: "NEW", toStatus: "IN_PROGRESS", changedByEmail: "sarah.johnson@example.com", offsetDays: 2 },
    ],
  },
  {
    ticketNumber: "TKT-2026-000014",
    requesterEmail: "david.lee@example.com",
    categoryName: "Hardware",
    relatedSystemName: "Corporate Laptop",
    summary: "Urgent: Laptop screen backlight failure before presentation",
    description: "Display remains completely dark though power indicator LEDs and fan are spinning.",
    requestedPriority: "HIGH",
    itPriority: "HIGH",
    currentStatus: "NEW",
    createdAtOffsetDays: 0,
  },
];

export async function seed() {
  const prisma = getPrisma();

  // 1. Categories (Lab 1)
  const categoryMap = new Map<string, number>();
  for (const name of CATEGORY_NAMES) {
    const record = await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    categoryMap.set(name, record.id);
  }

  // 2. Related Systems (Lab 2)
  const systemMap = new Map<string, number>();
  for (const name of RELATED_SYSTEM_NAMES) {
    const record = await prisma.relatedSystem.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    systemMap.set(name, record.id);
  }

  // 3. DevRequesters (Lab 2 backwards compatibility)
  for (const requester of DEV_REQUESTERS) {
    await prisma.devRequester.upsert({
      where: { email: requester.email },
      update: { isActive: requester.isActive },
      create: requester,
    });
  }

  // 4. Users (Sprint 3)
  const userMap = new Map<string, number>();
  for (const user of SEED_USERS) {
    const record = await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        role: user.role,
        isActive: user.isActive,
        mustChangePassword: user.mustChangePassword,
        passwordHash: user.passwordHash,
      },
      create: {
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
        mustChangePassword: user.mustChangePassword,
        passwordHash: user.passwordHash,
      },
    });
    userMap.set(user.email, record.id);
  }

  // 5. Realistic Tickets, Comments, Internal Notes, Actions Taken, and Status History (Sprint 4)
  const now = new Date();
  for (const ticketData of SEED_TICKETS) {
    const requesterId = userMap.get(ticketData.requesterEmail);
    const categoryId = categoryMap.get(ticketData.categoryName);
    const relatedSystemId = systemMap.get(ticketData.relatedSystemName);
    const assignedToId = ticketData.assignedToEmail ? userMap.get(ticketData.assignedToEmail) : null;

    if (!requesterId || !categoryId || !relatedSystemId) {
      console.warn(`Skipping ticket ${ticketData.ticketNumber} due to missing relation`);
      continue;
    }

    const createdAt = ticketData.createdAtOffsetDays !== undefined
      ? new Date(now.getTime() - ticketData.createdAtOffsetDays * 86400000)
      : now;

    const ticket = await prisma.ticket.upsert({
      where: { ticketNumber: ticketData.ticketNumber },
      update: {
        requesterId,
        assignedToId,
        categoryId,
        relatedSystemId,
        summary: ticketData.summary,
        description: ticketData.description,
        requestedPriority: ticketData.requestedPriority,
        itPriority: ticketData.itPriority ?? ticketData.requestedPriority,
        currentStatus: ticketData.currentStatus,
        isProblemResolvedIndicated: ticketData.isProblemResolvedIndicated ?? false,
      },
      create: {
        ticketNumber: ticketData.ticketNumber,
        requesterId,
        assignedToId,
        categoryId,
        relatedSystemId,
        summary: ticketData.summary,
        description: ticketData.description,
        requestedPriority: ticketData.requestedPriority,
        itPriority: ticketData.itPriority ?? ticketData.requestedPriority,
        currentStatus: ticketData.currentStatus,
        isProblemResolvedIndicated: ticketData.isProblemResolvedIndicated ?? false,
        version: 0,
        createdAt,
        updatedAt: createdAt,
      },
    });

    // Public Comments
    if (ticketData.comments && ticketData.comments.length > 0) {
      for (const commentData of ticketData.comments) {
        const authorId = userMap.get(commentData.authorEmail);
        if (authorId) {
          const existing = await prisma.comment.findFirst({
            where: {
              ticketId: ticket.id,
              authorId,
              content: commentData.content,
            },
          });
          if (!existing) {
            await prisma.comment.create({
              data: {
                ticketId: ticket.id,
                authorId,
                content: commentData.content,
              },
            });
          }
        }
      }
    }

    // Staff Internal Notes
    if (ticketData.internalNotes && ticketData.internalNotes.length > 0) {
      for (const noteData of ticketData.internalNotes) {
        const authorId = userMap.get(noteData.authorEmail);
        if (authorId) {
          const existing = await prisma.internalNote.findFirst({
            where: {
              ticketId: ticket.id,
              authorId,
              content: noteData.content,
            },
          });
          if (!existing) {
            await prisma.internalNote.create({
              data: {
                ticketId: ticket.id,
                authorId,
                content: noteData.content,
              },
            });
          }
        }
      }
    }

    // Actions Taken (Sprint 4)
    if (ticketData.actions && ticketData.actions.length > 0) {
      for (const actionData of ticketData.actions) {
        const performedById = userMap.get(actionData.performedByEmail);
        const assigneeId = actionData.assigneeEmail ? userMap.get(actionData.assigneeEmail) : performedById;
        const completedById = actionData.completedByEmail ? userMap.get(actionData.completedByEmail) : null;
        if (performedById) {
          const actionAt = actionData.actionAtOffsetDays !== undefined
            ? new Date(now.getTime() - actionData.actionAtOffsetDays * 86400000)
            : now;

          await prisma.actionTaken.upsert({
            where: {
              ticketId_clientRequestId: {
                ticketId: ticket.id,
                clientRequestId: actionData.clientRequestId,
              },
            },
            update: {
              description: actionData.description,
              result: actionData.result ?? null,
              status: actionData.status,
              assigneeId: assigneeId ?? null,
              completedById: completedById ?? null,
              followUpRequired: actionData.followUpRequired ?? false,
              followUpNote: actionData.followUpNote ?? null,
              actionAt,
            },
            create: {
              ticketId: ticket.id,
              clientRequestId: actionData.clientRequestId,
              description: actionData.description,
              result: actionData.result ?? null,
              status: actionData.status,
              performedById,
              assigneeId: assigneeId ?? null,
              completedById: completedById ?? null,
              followUpRequired: actionData.followUpRequired ?? false,
              followUpNote: actionData.followUpNote ?? null,
              version: 0,
              actionAt,
            },
          });
        }
      }
    }

    // Status History (Sprint 4)
    if (ticketData.statusHistory && ticketData.statusHistory.length > 0) {
      for (const historyData of ticketData.statusHistory) {
        const changedById = userMap.get(historyData.changedByEmail);
        if (changedById) {
          const changedAt = historyData.offsetDays !== undefined
            ? new Date(now.getTime() - historyData.offsetDays * 86400000)
            : now;

          const existingHistory = await prisma.ticketStatusHistory.findFirst({
            where: {
              ticketId: ticket.id,
              fromStatus: historyData.fromStatus,
              toStatus: historyData.toStatus,
              changedById,
            },
          });

          if (!existingHistory) {
            await prisma.ticketStatusHistory.create({
              data: {
                ticketId: ticket.id,
                fromStatus: historyData.fromStatus,
                toStatus: historyData.toStatus,
                changedById,
                reason: historyData.reason ?? null,
                changedAt,
              },
            });
          }
        }
      }
    }
  }

  console.log(`Seeded ${SEED_TICKETS.length} sample tickets with actions, history, comments, and notes successfully.`);
}

async function main() {
  await seed();
}

if (process.argv[1]?.endsWith("seed.ts") || process.argv[1]?.endsWith("seed.js")) {
  main()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await getPrisma().$disconnect();
    });
}
