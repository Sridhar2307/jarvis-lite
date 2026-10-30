import { PrismaClient } from "@prisma/client";

/**
 * Automated Database Migration Utility
 * Dumps SQLite data models into JSON for backup or transfers records directly to PostgreSQL.
 */
async function runDatabaseMigration() {
  const prisma = new PrismaClient();
  console.log("=== JARVIS LITE DATABASE MIGRATION UTILITY ===");
  console.log("Reading data from current database...");

  try {
    const users = await prisma.user.findMany();
    const organizations = await prisma.organization.findMany();
    const members = await prisma.organizationMember.findMany();
    const revenueRecords = await prisma.revenueRecord.findMany();
    const metrics = await prisma.businessMetric.findMany();
    const socialPosts = await prisma.socialPost.findMany();
    const adAccounts = await prisma.adAccount.findMany({ include: { campaigns: true } });
    const plans = await prisma.subscriptionPlan.findMany({ include: { subscribers: true } });
    const tickets = await prisma.supportTicket.findMany({ include: { notes: true } });
    const credentials = await prisma.integrationCredential.findMany();

    const backup = {
      timestamp: new Date().toISOString(),
      summary: {
        users: users.length,
        organizations: organizations.length,
        members: members.length,
        revenueRecords: revenueRecords.length,
        businessMetrics: metrics.length,
        socialPosts: socialPosts.length,
        adAccounts: adAccounts.length,
        subscriptionPlans: plans.length,
        supportTickets: tickets.length,
        integrationCredentials: credentials.length,
      },
      data: {
        users,
        organizations,
        members,
        revenueRecords,
        metrics,
        socialPosts,
        adAccounts,
        plans,
        tickets,
        credentials,
      },
    };

    const fs = await import("fs/promises");
    const filename = `db-backup-${Date.now()}.json`;
    await fs.writeFile(filename, JSON.stringify(backup, null, 2), "utf8");

    console.log(`\n✅ Data snapshot successfully generated: ${filename}`);
    console.log("Table Record Counts:");
    Object.entries(backup.summary).forEach(([k, v]) => {
      console.log(` - ${k}: ${v} records`);
    });

    console.log("\nTo complete migration to PostgreSQL:");
    console.log("1. Update prisma/schema.prisma datasource provider to 'postgresql'");
    console.log("2. Set DATABASE_URL=\"postgresql://jarvis_admin:jarvis_secure_password_2026!@localhost:5432/jarvis_lite?schema=public\"");
    console.log("3. Run: npx prisma db push");
    console.log("4. Import the JSON snapshot if transferring existing records.");

    await prisma.$disconnect();
  } catch (err) {
    console.error("Migration snapshot failed:", err);
    await prisma.$disconnect();
    process.exit(1);
  }
}

runDatabaseMigration();

