import { getPrisma } from "../src/prisma.js";

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

const DEV_REQUESTERS = [
  { name: "Jennifer Anderson", email: "jennifer.anderson@example.com", isActive: true },
  { name: "Michael Brown", email: "michael.brown@example.com", isActive: true },
  { name: "Sarah Johnson", email: "sarah.johnson@example.com", isActive: true },
  { name: "David Lee", email: "david.lee@example.com", isActive: true },
  { name: "Inactive Test User", email: "inactive.user@example.com", isActive: false },
];

async function main() {
  const prisma = getPrisma();

  // --- existing Lab 1 seed, unchanged ---
  for (const name of CATEGORY_NAMES) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log("Seeded categories successfully.");

  // --- Lab 2 additions, idempotent (safe to re-run) ---
  for (const name of RELATED_SYSTEM_NAMES) {
    await prisma.relatedSystem.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log("Seeded related systems successfully.");

  for (const requester of DEV_REQUESTERS) {
    await prisma.devRequester.upsert({
      where: { email: requester.email },
      update: { isActive: requester.isActive },
      create: requester,
    });
  }
  console.log("Seeded development requesters successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await getPrisma().$disconnect();
  });