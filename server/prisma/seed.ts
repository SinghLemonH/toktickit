import { getPrisma } from "../src/prisma.js";
import type { Role, Priority, TicketStatus } from "@prisma/client";

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
  comments?: Array<{ authorEmail: string; content: string }>;
  internalNotes?: Array<{ authorEmail: string; content: string }>;
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
  },
];

async function main() {
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
  console.log("Seeded categories successfully.");

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
  console.log("Seeded related systems successfully.");

  // 3. DevRequesters (Lab 2 backwards compatibility)
  for (const requester of DEV_REQUESTERS) {
    await prisma.devRequester.upsert({
      where: { email: requester.email },
      update: { isActive: requester.isActive },
      create: requester,
    });
  }
  console.log("Seeded development requesters successfully.");

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
  console.log(`Seeded ${userMap.size} users across all roles successfully.`);

  // 5. Realistic Tickets, Comments, and Internal Notes
  for (const ticketData of SEED_TICKETS) {
    const requesterId = userMap.get(ticketData.requesterEmail);
    const categoryId = categoryMap.get(ticketData.categoryName);
    const relatedSystemId = systemMap.get(ticketData.relatedSystemName);
    const assignedToId = ticketData.assignedToEmail ? userMap.get(ticketData.assignedToEmail) : null;

    if (!requesterId || !categoryId || !relatedSystemId) {
      console.warn(`Skipping ticket ${ticketData.ticketNumber} due to missing relation`);
      continue;
    }

    const ticket = await prisma.ticket.upsert({
      where: { ticketNumber: ticketData.ticketNumber },
      update: {
        assignedToId,
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
  }
  console.log(`Seeded ${SEED_TICKETS.length} sample tickets with comments and notes successfully.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await getPrisma().$disconnect();
  });
