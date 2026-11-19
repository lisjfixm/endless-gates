const {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} = require("@firebase/rules-unit-testing");
const { test, before, after, beforeEach } = require("node:test");
const fs = require("node:fs");

let testEnv;
const PROJECT_ID = process.env.GCP_PROJECT || "demo-no-project";
const ALICE_UID = "alice_uid_001";
const BOB_UID = "bob_uid_002";

const [emulatorHost, emulatorPortStr] = (process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8085").split(":");
const emulatorPort = parseInt(emulatorPortStr, 10);

function validCreatePayload(uid, createdDate, updatedDate) {
  return {
    userId: uid,
    deviceLabel: "Pixel 9 Pro",
    displayName: "Alice",
    clientUpdatedAtMs: Date.now(),
    clearedDoorsCount: 3,
    endingsCount: 7,
    achievementsCount: 5,
    memoryShards: 120,
    currentDoorId: 4,
    currentDoorName: "無聲病院",
    currentSceneId: "ward_entry",
    currentRoomName: "候診大廳",
    currentHp: 88,
    saveSlotCount: 2,
    progressData: {
      clearedDungeons: [1, 2, 3],
      memoryShards: 120,
      endingsLog: ["1|true|逃離質數旅館"],
    },
    settingsData: {
      soundEnabled: true,
      theme: "default",
    },
    lastSessionData: {
      dungeonId: 4,
      sceneId: "ward_entry",
      roomName: "候診大廳",
      timestamp: Date.now(),
    },
    chronoAnchorsData: [
      {
        slot: 0,
        dungeonId: 4,
        sceneId: "ward_entry",
      },
    ],
    saveSlotsData: [
      {
        slotIndex: 1,
        dungeonId: 4,
        sceneId: "ward_entry",
        hp: 88,
      },
    ],
    createdAt: createdDate,
    updatedAt: updatedDate,
  };
}

before(async () => {
  const rules = fs.readFileSync("./firestore.rules", "utf8");
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules,
      host: emulatorHost,
      port: emulatorPort,
    },
  });
});

after(async () => {
  if (testEnv) {
    await testEnv.cleanup();
  }
});

beforeEach(async () => {
  if (testEnv) {
    await testEnv.clearFirestore();
  }
});

test("Unauthenticated user cannot read, list, or write cloud saves", async () => {
  const unauthDb = testEnv.unauthenticatedContext().firestore();
  const now = new Date(Date.now() - 1000);

  await assertFails(
    unauthDb.collection("users").doc(ALICE_UID).collection("cloud_saves").doc("primary").get()
  );
  await assertFails(
    unauthDb.collection("users").doc(ALICE_UID).collection("cloud_saves").get()
  );
  await assertFails(
    unauthDb
      .collection("users")
      .doc(ALICE_UID)
      .collection("cloud_saves")
      .doc("primary")
      .set(validCreatePayload(ALICE_UID, now, now))
  );
});

test("Authenticated owner can create, read, list, and update own cloud save with Kotlin-aligned payloads", async () => {
  const aliceDb = testEnv.authenticatedContext(ALICE_UID).firestore();
  const docRef = aliceDb.collection("users").doc(ALICE_UID).collection("cloud_saves").doc("primary");
  const created = new Date(Date.now() - 5000);

  // Create with lastSessionData present
  await assertSucceeds(docRef.set(validCreatePayload(ALICE_UID, created, created)));

  // Get & list own saves
  await assertSucceeds(docRef.get());
  await assertSucceeds(aliceDb.collection("users").doc(ALICE_UID).collection("cloud_saves").get());

  // Partial update matching CloudSaveRepository.uploadCloudSave() (preserves userId & createdAt)
  await assertSucceeds(
    docRef.update({
      deviceLabel: "Pixel Tablet",
      displayName: "Alice",
      clientUpdatedAtMs: Date.now(),
      clearedDoorsCount: 4,
      endingsCount: 9,
      achievementsCount: 6,
      memoryShards: 185,
      currentDoorId: 5,
      currentDoorName: "鏡中迴廊",
      currentSceneId: "mirror_hall",
      currentRoomName: "長鏡廊道",
      currentHp: 100,
      saveSlotCount: 3,
      progressData: { clearedDungeons: [1, 2, 3, 4], memoryShards: 185 },
      settingsData: { soundEnabled: true, theme: "ice" },
      chronoAnchorsData: [],
      saveSlotsData: [],
      updatedAt: new Date(Date.now() - 1000),
    })
  );

  // Create without optional lastSessionData
  const secondDoc = aliceDb.collection("users").doc(ALICE_UID).collection("cloud_saves").doc("backup_1");
  const withoutSession = validCreatePayload(ALICE_UID, created, created);
  delete withoutSession.lastSessionData;
  await assertSucceeds(secondDoc.set(withoutSession));
});

test("Cross-user isolation blocks reading, listing, writing, and deleting another user's cloud save", async () => {
  const created = new Date(Date.now() - 10000);
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await context
      .firestore()
      .collection("users")
      .doc(BOB_UID)
      .collection("cloud_saves")
      .doc("primary")
      .set(validCreatePayload(BOB_UID, created, created));
  });

  const aliceDb = testEnv.authenticatedContext(ALICE_UID).firestore();
  const bobDoc = aliceDb.collection("users").doc(BOB_UID).collection("cloud_saves").doc("primary");

  await assertFails(bobDoc.get());
  await assertFails(aliceDb.collection("users").doc(BOB_UID).collection("cloud_saves").get());
  await assertFails(bobDoc.update({ memoryShards: 999, updatedAt: new Date(Date.now() - 1000) }));
  await assertFails(bobDoc.delete());
});

test("Security rules reject shadow fields, immutable mutations, future timestamps, and out-of-bounds values", async () => {
  const aliceDb = testEnv.authenticatedContext(ALICE_UID).firestore();
  const docRef = aliceDb.collection("users").doc(ALICE_UID).collection("cloud_saves").doc("primary");
  const created = new Date(Date.now() - 5000);

  // Ghost / shadow field rejected on create
  const ghostPayload = { ...validCreatePayload(ALICE_UID, created, created), isAdmin: true };
  await assertFails(docRef.set(ghostPayload));

  // Identity spoofing rejected
  const spoofPayload = validCreatePayload(BOB_UID, created, created);
  await assertFails(docRef.set(spoofPayload));

  // Future timestamp rejected
  const futurePayload = validCreatePayload(ALICE_UID, created, new Date(Date.now() + 60000));
  await assertFails(docRef.set(futurePayload));

  // Out-of-bounds clearedDoorsCount (> 14) rejected
  const badDoors = { ...validCreatePayload(ALICE_UID, created, created), clearedDoorsCount: 99 };
  await assertFails(docRef.set(badDoors));

  // Create valid doc first, then verify immutable fields cannot be mutated on update
  await assertSucceeds(docRef.set(validCreatePayload(ALICE_UID, created, created)));

  await assertFails(
    docRef.update({
      createdAt: new Date(Date.now() - 500),
      updatedAt: new Date(Date.now() - 500),
    })
  );
  await assertFails(
    docRef.update({
      userId: BOB_UID,
      updatedAt: new Date(Date.now() - 500),
    })
  );
});
