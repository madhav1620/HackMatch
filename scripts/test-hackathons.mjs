// Smoke test for the Phase 3 Discovery Hub API. Run: node scripts/test-hackathons.mjs
const API = "http://localhost:4000/api";

async function json(path, init) {
  const res = await fetch(API + path, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  return { status: res.status, body };
}

const log = (label, r, extra = "") => {
  const b = r.body;
  const summary =
    b && typeof b === "object"
      ? Array.isArray(b.items)
        ? `items=${b.items.length} total=${b.total}`
        : b.error
          ? `error=${b.error.code}`
          : "ok"
      : String(b).slice(0, 60);
  console.log(`${String(r.status).padEnd(4)} ${label.padEnd(46)} ${summary} ${extra}`);
  return b;
};

// 1. Public feed
const feed = await json("/hackathons");
const feedBody = log("GET /hackathons (public)", feed, `first=${feed.body.items?.[0]?.name}`);
console.log(
  "     deadlines in order:",
  (feed.body.items || []).map((h) => h.name.slice(0, 14) + ":" + h.registrationDeadline.slice(5, 10)).join(" | "),
);

// 2. Filters
log("GET ?mode=ONLINE", await json("/hackathons?mode=ONLINE"));
log("GET ?orgType=INTERNAL", await json("/hackathons?orgType=INTERNAL"));
log("GET ?tech=React,PyTorch", await json("/hackathons?tech=React,PyTorch&limit=50"));
const prizes = await json("/hackathons?minPrize=1000000&sort=prize&limit=50");
log("GET ?minPrize=1000000&sort=prize", prizes, `order=[${prizes.body.items.map((h) => h.prizePool).join(" > ")}]`);
log("GET ?search=web3", await json("/hackathons?search=web3"));
log("GET ?search=calhacks&mode=OFFLINE", await json("/hackathons?search=calhacks&mode=OFFLINE"));
const from = new Date(Date.now() + 6 * 864e5).toISOString();
const to = new Date(Date.now() + 14 * 864e5).toISOString();
log("GET ?from=+6d&to=+14d", await json(`/hackathons?from=${from}&to=${to}`));
log("GET ?page=2&limit=5", await json("/hackathons?page=2&limit=5"));
log("GET ?includeClosed=true", await json("/hackathons?includeClosed=true"));

// 3. Auth
const login = await json("/auth/login", {
  method: "POST",
  body: JSON.stringify({ email: "arjun@iiit.ac.in", password: "password123" }),
});
const student = log("POST /auth/login (student)", login);

const orgLogin = await json("/auth/login", {
  method: "POST",
  body: JSON.stringify({ email: "priya@bits-pilani.ac.in", password: "password123" }),
});
const organizer = log("POST /auth/login (organizer)", orgLogin, `role=${orgLogin.body?.user?.role}`);

const auth = (t) => ({ Authorization: `Bearer ${t}` });

// 4. Authed feed reflects bookmarks
const authedFeed = await json("/hackathons", { headers: auth(student.accessToken) });
const marked = (authedFeed.body.items || []).filter((h) => h.bookmarked).map((h) => h.name);
log("GET /hackathons (as arjun)", authedFeed, `bookmarked=[${marked.join(", ")}]`);

// 5. Detail
const target = (feedBody.items || []).find((h) => h.name.includes("CalHacks")) ?? feedBody.items[0];
const detail = await json(`/hackathons/${target.id}`, { headers: auth(student.accessToken) });
log("GET /hackathons/:id", detail, `teamCount=${detail.body.teamCount} ${detail.body.bookmarked ? "bookmarked" : ""}`);
log("GET /hackathons/does-not-exist", await json("/hackathons/nope"));

// 6. Bookmarks
const bk = await json(`/hackathons/${target.id}/bookmark`, { method: "POST", headers: auth(student.accessToken), body: "{}" });
log("POST /hackathons/:id/bookmark", bk);
const dup = await json(`/hackathons/${target.id}/bookmark`, { method: "POST", headers: auth(student.accessToken), body: "{}" });
log("POST bookmark again (idempotent)", dup);
const bkList = await json("/bookmarks", { headers: auth(student.accessToken) });
log("GET /bookmarks", bkList, `names=[${(bkList.body.items || []).map((b) => b.hackathon.name).join(", ")}]`);
log("DELETE /hackathons/:id/bookmark", await json(`/hackathons/${target.id}/bookmark`, { method: "DELETE", headers: auth(student.accessToken) }));
log("GET /bookmarks after delete", await json("/bookmarks", { headers: auth(student.accessToken) }));
log("GET /bookmarks (no token)", await json("/bookmarks"));

// 7. Organizer authoring
log("GET /hackathons/mine (student → 403)", await json("/hackathons/mine", { headers: auth(student.accessToken) }));
const mine = await json("/hackathons/mine", { headers: auth(organizer.accessToken) });
log("GET /hackathons/mine (organizer)", mine, `names=[${(mine.body.items || []).map((h) => h.name + "/" + h.status).join(", ")}]`);

const createBody = {
  name: "Smoke Test Hack",
  tagline: "created by the smoke test",
  description: "Temporary hackathon created by scripts/test-hackathons.mjs.",
  mode: "ONLINE",
  orgType: "EXTERNAL",
  prizePool: 42000,
  registrationDeadline: new Date(Date.now() + 10 * 864e5).toISOString(),
  startDate: new Date(Date.now() + 12 * 864e5).toISOString(),
  endDate: new Date(Date.now() + 14 * 864e5).toISOString(),
  techTags: ["Testing", "React"],
  minTeamSize: 2,
  maxTeamSize: 4,
  status: "PUBLISHED",
};

log("POST /hackathons (as student, expect 403)", await json("/hackathons", { method: "POST", headers: auth(student.accessToken), body: JSON.stringify(createBody) }));
const created = await json("/hackathons", { method: "POST", headers: auth(organizer.accessToken), body: JSON.stringify(createBody) });
log("POST /hackathons (as organizer)", created, `id=${created.body?.id}`);

log(
  "POST /hackathons invalid (end < start)",
  await json("/hackathons", {
    method: "POST",
    headers: auth(organizer.accessToken),
    body: JSON.stringify({ ...createBody, endDate: new Date(Date.now() + 1 * 864e5).toISOString() }),
  }),
);

if (created.body?.id) {
  log(
    "PATCH /hackathons/:id (organizer)",
    await json(`/hackathons/${created.body.id}`, {
      method: "PATCH",
      headers: auth(organizer.accessToken),
      body: JSON.stringify({ prizePool: 99000, status: "DRAFT" }),
    }),
  );
  log(
    "PATCH /hackathons/:id (as student, expect 403)",
    await json(`/hackathons/${created.body.id}`, { method: "PATCH", headers: auth(student.accessToken), body: JSON.stringify({ prizePool: 1 }) }),
  );
  log("DELETE /hackathons/:id (organizer)", await json(`/hackathons/${created.body.id}`, { method: "DELETE", headers: auth(organizer.accessToken) }));
}
