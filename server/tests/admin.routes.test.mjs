import assert from "node:assert/strict";
import { test } from "node:test";
import { once } from "node:events";
import { prisma } from "../src/lib/prisma.ts";

function replace(t, model, method, implementation) {
  const original = prisma[model][method];
  prisma[model][method] = implementation;
  t.after(() => { prisma[model][method] = original; });
}

test("admin API checks the current database role, not the token claim", async (t) => {
  process.env.JWT_ACCESS_SECRET = "test-access-secret";
  process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
  const [{ default: app }, { signAccess }] = await Promise.all([
    import("../src/app.ts"), import("../src/lib/jwt.ts"),
  ]);
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(() => new Promise((resolve) => server.close(resolve)));

  let currentRole = "STUDENT";
  replace(t, "user", "findUnique", async () => ({ role: currentRole, verified: true }));
  replace(t, "user", "count", async () => 4);
  replace(t, "hackathon", "count", async () => 2);
  replace(t, "team", "count", async () => 1);
  replace(t, "joinRequest", "count", async () => 0);
  replace(t, "soloPost", "count", async () => 0);
  const url = `http://127.0.0.1:${server.address().port}/api/admin/summary`;
  const token = signAccess({ sub: "admin", role: "ADMIN", email: "admin@example.com" });

  assert.equal((await fetch(url)).status, 401);
  assert.equal((await fetch(url, { headers: { Authorization: `Bearer ${token}` } })).status, 403);
  currentRole = "ADMIN";
  const allowed = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  assert.equal(allowed.status, 200);
  assert.equal((await allowed.json()).users, 4);
});

test("admin user listing selects profile fields without password or OTP", async (t) => {
  let select;
  replace(t, "user", "count", async () => 1);
  replace(t, "user", "findMany", async (query) => { select = query.select; return []; });
  const { listUsers } = await import("../src/services/admin.service.ts");
  await listUsers({ page: 1, limit: 20 });
  assert.equal(select.email, true);
  assert.equal(select.passwordHash, undefined);
  assert.equal(select.otpCode, undefined);
  assert.equal(select.otpExpiresAt, undefined);
});

test("admin cannot demote their own account", async (t) => {
  replace(t, "user", "findUnique", async () => ({ id: "admin", role: "ADMIN", email: "admin@example.com" }));
  const { updateUser } = await import("../src/services/admin.service.ts");
  await assert.rejects(updateUser("admin", "admin", { role: "STUDENT" }), { status: 400, code: "LAST_ADMIN" });
});
