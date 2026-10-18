import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
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

test("DELETE endpoint preserves the auth and ownership boundary", async (t) => {
  process.env.JWT_ACCESS_SECRET = "test-access-secret";
  process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
  const [{ default: app }, { signAccess }] = await Promise.all([
    import("../src/app.ts"), import("../src/lib/jwt.ts"),
  ]);
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(() => new Promise((resolve) => server.close(resolve)));

  let deleted = 0;
  replace(t, "hackathon", "findUnique", async ({ where }) => where.id === "missing" ? null : { id: "event", organizerId: "owner" });
  replace(t, "hackathon", "deleteMany", async () => { deleted += 1; return { count: 1 }; });
  const base = `http://127.0.0.1:${server.address().port}/api/hackathons`;
  const remove = (id, sub, role) => fetch(`${base}/${id}`, {
    method: "DELETE",
    headers: sub ? { Authorization: `Bearer ${signAccess({ sub, role, email: `${sub}@example.edu` })}` } : {},
  });

  assert.equal((await remove("event")).status, 401);
  assert.equal((await remove("event", "student", "STUDENT")).status, 403);
  assert.equal((await remove("event", "other", "ORGANIZER")).status, 403);
  assert.equal(deleted, 0);
  assert.equal((await remove("event", "owner", "ORGANIZER")).status, 204);
  assert.equal((await remove("event", "admin", "ADMIN")).status, 204);
  assert.equal((await remove("missing", "owner", "ORGANIZER")).status, 404);
  assert.equal(deleted, 2);
});
