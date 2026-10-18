import test from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../src/lib/prisma.ts";
import { deleteHackathon, getHackathon, listBookmarks, updateHackathon } from "../src/services/hackathon.service.ts";

function replace(t, model, method, implementation) {
  const original = prisma[model][method];
  prisma[model][method] = implementation;
  t.after(() => { prisma[model][method] = original; });
}

test("another organizer cannot delete a hackathon or its related data", async (t) => {
  let deleted = false;
  replace(t, "hackathon", "findUnique", async () => ({ id: "event", organizerId: "owner" }));
  replace(t, "hackathon", "deleteMany", async () => { deleted = true; return { count: 1 }; });
  replace(t, "hackathon", "delete", async () => { deleted = true; });

  await assert.rejects(deleteHackathon("event", "other-organizer", "ORGANIZER"), { status: 403, code: "FORBIDDEN" });
  assert.equal(deleted, false);
});

test("the owner can delete, with ownership checked in the delete statement", async (t) => {
  let where;
  replace(t, "hackathon", "findUnique", async () => ({ id: "event", organizerId: "owner" }));
  replace(t, "hackathon", "deleteMany", async (query) => { where = query.where; return { count: 1 }; });
  await deleteHackathon("event", "owner", "ORGANIZER");
  assert.deepEqual(where, { id: "event", organizerId: "owner" });
});

test("a changed owner cannot be bypassed between lookup and deletion", async (t) => {
  replace(t, "hackathon", "findUnique", async () => ({ id: "event", organizerId: "owner" }));
  replace(t, "hackathon", "deleteMany", async () => ({ count: 0 }));
  await assert.rejects(deleteHackathon("event", "owner", "ORGANIZER"), { status: 403, code: "FORBIDDEN" });
});

test("an admin can delete an event owned by someone else", async (t) => {
  let deletedId;
  replace(t, "hackathon", "findUnique", async () => ({ id: "event", organizerId: "owner" }));
  replace(t, "hackathon", "deleteMany", async (query) => { deletedId = query.where.id; return { count: 1 }; });
  await deleteHackathon("event", "admin", "ADMIN");
  assert.equal(deletedId, "event");
});

test("a concurrent deletion still returns 404", async (t) => {
  replace(t, "hackathon", "findUnique", async () => ({ id: "event", organizerId: "owner" }));
  replace(t, "hackathon", "deleteMany", async () => ({ count: 0 }));
  await assert.rejects(deleteHackathon("event", "admin", "ADMIN"), { status: 404, code: "NOT_FOUND" });
});

test("missing events still return 404", async (t) => {
  replace(t, "hackathon", "findUnique", async () => null);
  await assert.rejects(deleteHackathon("missing", "owner", "ORGANIZER"), { status: 404, code: "NOT_FOUND" });
});

test("PATCH validates the complete resulting date range", async (t) => {
  let updated = false;
  replace(t, "hackathon", "findUnique", async () => ({
    organizerId: "owner", registrationDeadline: new Date("2026-11-01T00:00:00Z"),
    startDate: new Date("2026-11-02T00:00:00Z"), endDate: new Date("2026-11-03T00:00:00Z"),
    minTeamSize: 2, maxTeamSize: 4,
  }));
  replace(t, "hackathon", "update", async () => { updated = true; });
  await assert.rejects(
    updateHackathon("event", "owner", "ORGANIZER", { endDate: new Date("2026-10-31T00:00:00Z") }),
    { status: 400, code: "VALIDATION_ERROR" },
  );
  assert.equal(updated, false);
});

test("unpublished event details are restricted to the organizer", async (t) => {
  replace(t, "hackathon", "findUnique", async () => ({ id: "draft", status: "DRAFT", organizerId: "owner" }));
  await assert.rejects(getHackathon("draft", "other"), { status: 404, code: "NOT_FOUND" });
});

test("saved-list cards are marked as bookmarked", async (t) => {
  replace(t, "bookmark", "findMany", async () => [{
    remindAt: null, createdAt: new Date("2026-10-18T00:00:00Z"),
    hackathon: { id: "event", status: "PUBLISHED", organizerId: "owner", techTags: [], _count: { teams: 0, soloPosts: 0 } },
  }]);
  const result = await listBookmarks("student");
  assert.equal(result.items[0].hackathon.bookmarked, true);
});
