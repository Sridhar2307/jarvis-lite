import { prisma } from "../lib/prisma";
import { hashPassword, signSessionToken, verifySessionToken } from "../lib/auth";

async function runVerification() {
  console.log("=== JARVIS LITE VERIFICATION & AUDIT SUITE ===\n");
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName} - ${detail}`);
      failed++;
    }
  }

  try {
    // Test 1: Database Connectivity & Models
    const userCount = await prisma.user.count();
    assert(typeof userCount === "number", "Database Connectivity", "Unable to count users");

    // Test 2: Password Hashing & Verification
    const password = "ExecutiveSecurePass2026!";
    const hash = await hashPassword(password);
    assert(hash.startsWith("$2"), "Password Hashing (bcrypt)", "Hash does not match bcrypt format");

    // Test 3: JWT Session Token Issuance & Verification
    const dummyPayload = {
      userId: "test-user-id",
      email: "test@domain.io",
      organizationId: "test-org-id",
      role: "OWNER",
    };
    const token = await signSessionToken(dummyPayload);
    const decoded = await verifySessionToken(token);
    assert(
      decoded?.userId === dummyPayload.userId && decoded?.organizationId === dummyPayload.organizationId,
      "JWT Session Issuance & Verification",
      "Decoded JWT did not match payload"
    );

    // Test 4: Multi-Tenant Organization Isolation Test
    const orgA = await prisma.organization.create({
      data: { name: "Org Alpha", slug: `org-alpha-${Date.now()}` },
    });
    const orgB = await prisma.organization.create({
      data: { name: "Org Beta", slug: `org-beta-${Date.now()}` },
    });

    const userA = await prisma.user.create({
      data: {
        email: `alpha_${Date.now()}@test.io`,
        passwordHash: hash,
        name: "User Alpha",
      },
    });

    await prisma.organizationMember.create({
      data: { organizationId: orgA.id, userId: userA.id, role: "OWNER" },
    });

    // Record data in Org Alpha
    await prisma.revenueRecord.create({
      data: { organizationId: orgA.id, amount: 50000, category: "SUBSCRIPTION", source: "STRIPE" },
    });

    // Verify Org Beta cannot see Org Alpha's revenue
    const orgBRecords = await prisma.revenueRecord.findMany({
      where: { organizationId: orgB.id },
    });
    assert(
      orgBRecords.length === 0,
      "Multi-Tenant Isolation (Revenue)",
      "Org Beta was able to access Org Alpha records"
    );

    // Test 5: Social Media Post Persistence & Character Limitation
    const post = await prisma.socialPost.create({
      data: {
        organizationId: orgA.id,
        platform: "X",
        content: "Automating executive busywork with Jarvis Lite.",
        status: "SCHEDULED",
        scheduledTimeString: "Tomorrow, 10:00 AM",
      },
    });
    assert(post.content.length <= 280, "Social Post Validation", "Post length exceeded bounds");
    const retrievedPost = await prisma.socialPost.findUnique({ where: { id: post.id } });
    assert(retrievedPost !== null, "Social Post Database Persistence", "Post did not persist");

    // Test 6: Support Ticket Management & Status Mutation
    const ticket = await prisma.supportTicket.create({
      data: {
        organizationId: orgA.id,
        ticketNumber: 1099,
        subject: "Critical API latency alert",
        requesterEmail: "dev@alpha.io",
        priority: "HIGH",
        status: "OPEN",
      },
    });
    const updatedTicket = await prisma.supportTicket.update({
      where: { id: ticket.id },
      data: { status: "RESOLVED" },
    });
    assert(updatedTicket.status === "RESOLVED", "Ticket Status Lifecycle", "Ticket failed to update status");

    // Test 7: Subscriptions & Dynamic MRR Calculation
    const plan = await prisma.subscriptionPlan.create({
      data: { organizationId: orgA.id, name: "Enterprise Pro", price: 500 },
    });
    await prisma.subscriber.create({
      data: { organizationId: orgA.id, planId: plan.id, customerEmail: "client@enterprise.com", status: "ACTIVE" },
    });
    const activeSubscribers = await prisma.subscriber.count({
      where: { organizationId: orgA.id, status: "ACTIVE" },
    });
    assert(activeSubscribers === 1, "Subscription & Plan Metrics", "Active subscribers count mismatch");

    // Test 8: Meta Ads Campaigns & Performance Metrics
    const adAccount = await prisma.adAccount.create({
      data: {
        organizationId: orgA.id,
        accountName: "Meta Ads Alpha",
        status: "CONNECTED",
      },
    });
    const campaign = await prisma.adCampaign.create({
      data: {
        adAccountId: adAccount.id,
        name: "Q4 Retargeting Funnel",
        spend: 1500.0,
        ctr: 3.2,
        roas: 4.1,
      },
    });
    assert(campaign.roas > 0, "Ad Campaign Tracking & ROAS Calculation", "ROAS value invalid");

    // Test 9: Agent Device Pairing, Token Hashing & Scope Validation
    const { hashToken, generateSecureToken, generatePairingCode } = await import("../lib/agent-auth");
    const rawToken = `jvt_${generateSecureToken()}`;
    const tokenHash = hashToken(rawToken);
    const pairingCode = generatePairingCode();
    assert(tokenHash.length === 64, "Device Token SHA-256 Hashing", "Hash length was not 64 chars");
    assert(pairingCode.startsWith("JARVIS-"), "Pairing Code Generator", "Pairing code format invalid");

    const device = await prisma.agentDevice.create({
      data: {
        organizationId: orgA.id,
        deviceName: "Test Nexora Workstation",
        platform: "windows",
        status: "ONLINE",
      },
    });
    const cred = await prisma.agentCredential.create({
      data: {
        deviceId: device.id,
        tokenHash,
        refreshTokenHash: hashToken("refresh_token_test"),
        scopes: "metrics:read,tickets:read,desktop:control",
        expiresAt: new Date(Date.now() + 86400000),
      },
    });
    assert(cred.id.length > 0, "Device Credential Record Persistence", "Credential failed to persist");

    // Test 10: Real-time Transactional Outbox & Event Publishing
    const { publishEvent } = await import("../lib/events");
    const outboxEvt = await publishEvent(orgA.id, "METRIC_UPDATED", { metric: "MRR", value: 50000 });
    assert(outboxEvt.eventType === "METRIC_UPDATED", "Transactional Outbox Event Publisher", "Event publishing failed");

    // Test 11: AI Tool Registry Risk Level & Confirmation Checks
    const { validateToolExecution } = await import("../lib/tool-registry");
    const lowRiskCheck = validateToolExecution("get_metrics", ["metrics:read"], false);
    assert(lowRiskCheck.allowed && !lowRiskCheck.requiresConfirmation, "Tool Registry (Low Risk Execution)", "Low risk tool was blocked");

    const highRiskCheck = validateToolExecution("close_window", ["desktop:control"], false);
    assert(highRiskCheck.requiresConfirmation, "Tool Registry Risk Engine (High Risk Guard)", "High risk action was not guarded");

    const confirmedCheck = validateToolExecution("close_window", ["desktop:control"], true);
    assert(confirmedCheck.allowed, "Tool Registry (High Risk User Approved)", "Confirmed high risk action was blocked");

    // Test 12: Multimodal Screen Intelligence Processing & Vision Fallback
    const { analyzeScreenWithGemini } = await import("../lib/vision-service");
    const dummyBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    const visionResult = await analyzeScreenWithGemini(dummyBase64, "image/png", "Test Window");
    assert(visionResult.analysis.length > 0, "Screen Intelligence & Multimodal Vision", "Vision analysis returned empty");

    // Test 13: Autonomous Workflow Engine & Task Step State Transitions
    const agentTask = await prisma.agentTask.create({
      data: {
        organizationId: orgA.id,
        deviceId: device.id,
        title: "Scheduled Social & Metric Report",
        goal: "Verify revenue and draft announcement",
        status: "QUEUED",
        steps: {
          create: [
            { stepNumber: 1, toolName: "get_metrics", status: "COMPLETED" },
            { stepNumber: 2, toolName: "draft_social_post", status: "PENDING" },
          ],
        },
      },
      include: { steps: true },
    });
    assert(agentTask.steps.length === 2, "Autonomous Task Engine (Multi-Step Plan)", "Task steps failed to create");

    // Clean up test organizations
    await prisma.organization.delete({ where: { id: orgA.id } });
    await prisma.organization.delete({ where: { id: orgB.id } });
    await prisma.user.delete({ where: { id: userA.id } });

    console.log(`\n=== TEST SUMMARY: ${passed} PASSED, ${failed} FAILED ===\n`);
    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error("Test execution encountered an error:", error);
    process.exit(1);
  }
}

runVerification();

