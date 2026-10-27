/**
 * test_challenges_feature.js
 * Automated test suite for the Savings Challenges & Milestones feature.
 * Run from server/ with: node test_challenges_feature.js
 */

require("dotenv").config({ path: require("path").join(__dirname, ".env") });
const mongoose = require("mongoose");

const SavingsChallenge = require("./models/SavingsChallenge");
const Transaction = require("./models/Transaction");
const User = require("./models/User");

const challengeService = require("./services/challengeService");

// ── Helpers ─────────────────────────────────────────────────────────────────
let passed = 0, failed = 0;
const TESTS = [];

async function test(name, fn) {
  try {
    await fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`✗ ${name}`);
    console.error(`  Error: ${err.message}`);
    failed++;
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg || "Assertion failed");
}

// ── Setup ────────────────────────────────────────────────────────────────────
const userAId = new mongoose.Types.ObjectId();
const userBId = new mongoose.Types.ObjectId();

async function setup() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("MONGO_URI not set in .env");

  await mongoose.connect(uri, { dbName: "moneymate" });
  console.log("\n==============================");
  console.log("✅ MongoDB Connected");
  console.log(`📦 Database: ${mongoose.connection.db.databaseName}`);
  console.log("==============================");

  // Clean up any leftover test data
  await SavingsChallenge.deleteMany({ userId: { $in: [userAId, userBId] } });
  console.log("✓ Test isolation environment initialized.\n");
}

async function teardown() {
  await SavingsChallenge.deleteMany({ userId: { $in: [userAId, userBId] } });
  await mongoose.disconnect();
  console.log("\n✓ Test cleanup completed and DB disconnected.");
}

// ── Tests ────────────────────────────────────────────────────────────────────
async function runTests() {
  // Test 1: Empty state
  await test("Test 1: Empty state returns zero summary without errors", async () => {
    const data = await challengeService.getUserChallenges(userAId);
    assert(data.challenges.length === 0, "Expected no challenges");
    assert(data.summary.totalChallenges === 0, "Expected zero total");
    assert(data.summary.totalContributed === 0, "Expected zero contributed");
    assert(Array.isArray(data.achievements), "Achievements should be array");
  });

  // Test 2: Create challenge
  let challenge;
  await test("Test 2: Challenge created successfully with correct initial values", async () => {
    challenge = await challengeService.createChallenge(userAId, {
      title: "Test Sprint",
      type: "30_day",
      targetAmount: 10000,
      startingAmount: 1000,
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      description: "Automated test challenge",
    });

    assert(challenge.title === "Test Sprint", "Title mismatch");
    assert(challenge.targetAmount === 10000, "Target mismatch");
    assert(challenge.currentAmount === 1000, "Starting amount not applied");
    assert(challenge.percentage === 10, `Expected 10% but got ${challenge.percentage}%`);
    assert(challenge.status === "active", `Expected active, got ${challenge.status}`);
    // Starting contribution should be logged
    assert(challenge.contributions.length === 1, "Should have 1 starting contribution");
  });

  // Test 3: Milestone unlocking at 25%
  await test("Test 3: Milestone unlocks at 25% threshold correctly", async () => {
    // Add 1500 more to reach 2500 (25% of 10000)
    const result = await challengeService.recordContribution(userAId, challenge._id, {
      amount: 1500,
      notes: "Milestone test",
      idempotencyKey: `test3_${Date.now()}`,
    });

    assert(result.newlyUnlockedMilestones.length >= 1, "Expected at least 1 new milestone");
    assert(result.newlyUnlockedMilestones[0].threshold === 25, `Expected 25% milestone, got ${result.newlyUnlockedMilestones[0].threshold}%`);
    assert(!result.isDuplicate, "Should not be duplicate");

    const pct = result.challenge.percentage;
    assert(pct === 25, `Expected 25%, got ${pct}%`);
    challenge = result.challenge;
  });

  // Test 4: Idempotency — duplicate request prevention
  await test("Test 4: Duplicate idempotency key prevents double-counting", async () => {
    const key = `dedup_test_${Date.now()}`;
    const res1 = await challengeService.recordContribution(userAId, challenge._id, {
      amount: 500,
      notes: "First submission",
      idempotencyKey: key,
    });
    assert(!res1.isDuplicate, "First contribution should not be duplicate");
    const amountAfterFirst = res1.challenge.currentAmount;

    const res2 = await challengeService.recordContribution(userAId, challenge._id, {
      amount: 500,
      notes: "Duplicate submission",
      idempotencyKey: key,
    });
    assert(res2.isDuplicate, "Second submission with same key should be marked duplicate");
    assert(res2.challenge.currentAmount === amountAfterFirst, "Amount should not change on duplicate");
  });

  // Test 5: Progress calculation accuracy
  await test("Test 5: Progress percentage calculated accurately", async () => {
    const data = await challengeService.getUserChallenges(userAId);
    const c = data.challenges.find((c) => c.title === "Test Sprint");
    assert(c, "Test Sprint challenge not found");
    const expected = Math.round((c.currentAmount / c.targetAmount) * 100);
    assert(c.percentage === expected, `Percentage mismatch: got ${c.percentage}, expected ${expected}`);
    assert(c.remainingAmount === c.targetAmount - c.currentAmount, "Remaining amount mismatch");
    assert(typeof c.suggestedDaily === "number" && c.suggestedDaily >= 0, "suggestedDaily should be a number");
    assert(typeof c.daysRemaining === "number" && c.daysRemaining >= 0, "daysRemaining should be numeric");
  });

  // Test 6: Pause and resume
  await test("Test 6: Challenge can be paused and resumed correctly", async () => {
    let ch = await challengeService.togglePause(userAId, challenge._id, true);
    assert(ch.status === "paused", `Expected paused, got ${ch.status}`);

    ch = await challengeService.togglePause(userAId, challenge._id, false);
    assert(ch.status === "active", `Expected active after resume, got ${ch.status}`);
  });

  // Test 7: Editing a challenge
  await test("Test 7: Challenge edits update title and target correctly", async () => {
    const updated = await challengeService.updateChallenge(userAId, challenge._id, {
      title: "Updated Sprint",
      targetAmount: 12000,
    });
    assert(updated.title === "Updated Sprint", "Title not updated");
    assert(updated.targetAmount === 12000, "Target not updated");
    // Milestones should not be retroactively wiped
    const stillUnlocked = updated.milestones.find((m) => m.threshold === 25);
    assert(stillUnlocked && stillUnlocked.unlocked, "Previously unlocked milestone should remain unlocked after edit");
  });

  // Test 8: Challenge completion on 100%
  await test("Test 8: Challenge completes automatically when target is fully met", async () => {
    const current = (await SavingsChallenge.findById(challenge._id)).currentAmount;
    const remaining = 12000 - current;
    const result = await challengeService.recordContribution(userAId, challenge._id, {
      amount: remaining,
      idempotencyKey: `complete_${Date.now()}`,
    });
    assert(result.challenge.status === "completed", `Expected completed, got ${result.challenge.status}`);
    assert(result.challenge.completedAt !== null, "completedAt should be set");
    // 100% milestone should be unlocked
    const platinum = result.newlyUnlockedMilestones.find((m) => m.threshold === 100);
    assert(platinum, "100% platinum milestone should be unlocked");
  });

  // Test 9: User data isolation
  await test("Test 9: User B cannot access User A's challenges", async () => {
    const dataB = await challengeService.getUserChallenges(userBId);
    assert(dataB.challenges.length === 0, "User B should see zero challenges");

    // Attempt to contribute to User A's challenge as User B
    let threw = false;
    try {
      await challengeService.recordContribution(userBId, challenge._id, { amount: 100 });
    } catch {
      threw = true;
    }
    assert(threw, "User B should get an error accessing User A's challenge");
  });

  // Test 10: Invalid amount validation
  await test("Test 10: Negative and zero contributions are rejected", async () => {
    // Create a fresh challenge for validation testing
    const ch = await challengeService.createChallenge(userAId, {
      title: "Validation Test",
      targetAmount: 5000,
      endDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    });

    let threw = false;
    try {
      await challengeService.recordContribution(userAId, ch._id, { amount: -100 });
    } catch { threw = true; }
    assert(threw, "Negative contribution should be rejected");

    threw = false;
    try {
      await challengeService.recordContribution(userAId, ch._id, { amount: 0 });
    } catch { threw = true; }
    assert(threw, "Zero contribution should be rejected");
  });

  // Test 11: Invalid challenge creation
  await test("Test 11: Creating challenge without required fields is rejected", async () => {
    let threw = false;
    try {
      await challengeService.createChallenge(userAId, {
        title: "No End Date",
        targetAmount: 1000,
        // No endDate
      });
    } catch { threw = true; }
    assert(threw, "Missing endDate should throw");

    threw = false;
    try {
      await challengeService.createChallenge(userAId, {
        title: "  ", // blank
        targetAmount: 1000,
        endDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      });
    } catch { threw = true; }
    assert(threw, "Blank title should throw");

    threw = false;
    try {
      await challengeService.createChallenge(userAId, {
        title: "Invalid target",
        targetAmount: -500, // invalid
        endDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      });
    } catch { threw = true; }
    assert(threw, "Negative target should throw");
  });

  // Test 12: Delete does not erase transactions
  await test("Test 12: Deleting challenge leaves financial transactions intact", async () => {
    const ch = await challengeService.createChallenge(userAId, {
      title: "Delete Test",
      targetAmount: 2000,
      endDate: new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10),
    });

    // Create a real transaction (separately, not linked to challenge)
    const tx = await Transaction.create({
      userId: userAId,
      type: "expense",
      amount: 500,
      category: "Savings",
      title: "Test savings deposit",
    });

    await challengeService.deleteChallenge(userAId, ch._id);

    // Transaction should still exist
    const stillExists = await Transaction.findById(tx._id);
    assert(stillExists, "Transaction should NOT be deleted when challenge is removed");

    // Challenge should be gone
    const gone = await SavingsChallenge.findById(ch._id);
    assert(!gone, "Challenge should be fully removed");

    // Cleanup
    await Transaction.findByIdAndDelete(tx._id);
  });

  // Test 13: Widget returns correct active challenge
  await test("Test 13: Dashboard widget returns correct primary active challenge", async () => {
    const newest = await challengeService.createChallenge(userAId, {
      title: "Widget Test Challenge",
      targetAmount: 3000,
      endDate: new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10),
    });

    const widget = await challengeService.getActiveWidget(userAId);
    assert(widget.hasActive, "Widget should report hasActive=true");
    assert(widget.activeChallenge, "Widget should return an active challenge");
    assert(typeof widget.activeChallenge.percentage === "number", "Widget challenge should have percentage");
    assert(typeof widget.activeChallenge.daysRemaining === "number", "Widget challenge should have daysRemaining");
  });
}

// ── Entry point ───────────────────────────────────────────────────────────────
(async () => {
  console.log("\n==================================================");
  console.log("🧪 STARTING SAVINGS CHALLENGES & MILESTONES TEST SUITE");
  console.log("==================================================");

  await setup();

  await runTests();

  await teardown();

  console.log("\n==================================================");
  if (failed === 0) {
    console.log(`🎉 ALL ${passed} SAVINGS CHALLENGES TESTS PASSED!`);
  } else {
    console.log(`❌ ${passed} passed, ${failed} failed.`);
  }
  console.log("==================================================\n");

  process.exit(failed === 0 ? 0 : 1);
})();
