// Smoke test for the Phase 4 Team Matchmaking & Recruitment API.
// Run (API must be on :4000): node scripts/test-teams.mjs
const API = "http://localhost:4000/api";

let pass = 0;
let fail = 0;
function ok(label, cond, extra = "") {
  if (cond) { pass++; console.log(`  ✓ ${label}${extra ? "  " + extra : ""}`); }
  else { fail++; console.log(`  ✗ ${label}  ${extra}`); }
}

async function json(path, { token, ...init } = {}) {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
  const text = await res.text();
  let body;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  return { status: res.status, body };
}

const login = async (email) =>
  (await json("/auth/login", { method: "POST", body: JSON.stringify({ email, password: "password123" }) })).body.accessToken;

const arjun = await login("arjun@iiit.ac.in");
const maya = await login("maya@berkeley.edu");
const ravi = await login("ravi@iitb.ac.in");

const feed = await json("/hackathons?limit=50");
const calhacks = (feed.body.items || []).find((h) => h.name.includes("CalHacks"));
const hackvit = (feed.body.items || []).find((h) => h.name.includes("HackVIT"));
const sih = (feed.body.items || []).find((h) => h.name.includes("Smart India"));

console.log("\n── Board ────────────────────────────────────────────────────────");
const board = await json(`/hackathons/${calhacks.id}/teams`);
ok("GET board (public)", board.status === 200, `teams=${board.body.items?.length} openSlots=${board.body.openSlots}`);
function ctx(r) { return `openSlots=${r.body.openSlots} recruiting=${r.body.recruitingTeams}`; }
ok("board counts recruiting squads", board.body.recruitingTeams >= 1);
ok("public board hides contact", board.body.items.every((t) => t.contact === null));
ok("board items carry roster + slots", (board.body.items[0]?.filledSlots ?? -1) >= 1 && (board.body.items[0]?.slotsTotal ?? 0) >= 1);

const skills = await json("/hackathons/" + (await json("/hackathons?search=CalHacks")).body.items[0].id + "/teams?skills=PyTorch");
ok("board ?skills=PyTorch narrows to NeuroFlow", skills.body.items.every((t) => t.requiredSkills.includes("PyTorch")), `n=${skills.body.total}`);

const calhacksId = (await json("/hackathons?search=CalHacks")).body.items[0].id;
const openOnly = await json(`/hackathons/${calhacksId}/teams?openOnly=true`);
ok("board ?openOnly=true hides full squads", openOnly.body.items.every((t) => t.openSlots > 0 && t.isRecruiting));
ok("board ?role=UIUX", (await json(`/hackathons/${calhacksId}/teams?role=UIUX`)).body.items.every((t) => t.requiredRoles.includes("UIUX")));
ok("board on unknown hackathon → 404", (await json("/hackathons/nope/teams")).status === 404);

// ── create a squad ────────────────────────────────────────────────────────────
console.log("\nCreate squad (arjun on CalHacks)");
const draft = {
  name: "Smoke Squad",
  description: "Created by scripts/test-teams.mjs to exercise the matchmaking API end to end.",
  track: "Testing · Smoke Track",
  openSlots: 2,
  requiredRoles: ["UIUX", "AIML"],
  requiredSkills: ["Figma", "PyTorch"],
  contactChannel: "DISCORD",
  contactValue: "https://discord.gg/smoke-squad",
};
ok("POST team (no token) → 401", (await json(`/hackathons/${calhacksId}/teams`, { method: "POST", body: JSON.stringify(draft) })).status === 401);
ok("POST team bad role → 400", (await json(`/hackathons/${calhacksId}/teams`, { method: "POST", token: arjun, body: JSON.stringify({ ...draft, requiredRoles: ["WIZARD"] }) })).status === 400);

const created = await json(`/hackathons/${calhacksId}/teams`, { method: "POST", token: arjun, body: JSON.stringify(draft) });
ok("POST team (as arjun) → 201", created.status === 201, `id=${created.body?.id}`);
const teamId = created.body.id;
ok("creator is founding leader", created.body.isLeader && created.body.filledSlots === 1 && created.body.members[0].isLeader);
ok("leader sees contact", created.body.contact?.value === draft.contactValue);
ok("second squad same hackathon → 409", (await json(`/hackathons/${calhacksId}/teams`, { method: "POST", token: arjun, body: JSON.stringify(draft) })).status === 409);

const board2 = await json(`/hackathons/${calhacksId}/teams`);
ok("new squad appears on board", board2.body.items.some((t) => t.id === teamId));
ok("contact hidden from public board", board2.body.items.find((t) => t.id === teamId)?.contact === null);

// ── join requests ─────────────────────────────────────────────────────────────
console.log("\nJoin requests (maya → Smoke Squad)");
const appBody = { message: "I can own the design system and the whole UI pass.", role: "UIUX", portfolioUrl: "https://maya.design", commitment: "FULL_SPRINT" };
const applied = await json(`/teams/${teamId}/requests`, { method: "POST", token: maya, body: JSON.stringify(appBody) });
ok("POST request (maya) → 201", applied.status === 201, `status=${applied.body?.status}`);
ok("request is PENDING", applied.body.status === "PENDING");
const reqId = applied.body.id;
ok("duplicate request → 409", (await json(`/teams/${teamId}/requests`, { method: "POST", token: maya, body: JSON.stringify(appBody) })).status === 409);
ok("leader applying to own squad → 409", (await json(`/teams/${teamId}/requests`, { method: "POST", token: arjun, body: JSON.stringify(appBody) })).status === 409);

ok("applicant sees their request on the squad", (await json(`/teams/${teamId}`, { token: maya })).body.myRequest?.status === "PENDING");
ok("applicant cannot see contact before acceptance", (await json(`/teams/${teamId}`, { token: maya })).body.contact === null);

const incoming = await json(`/teams/${teamId}/requests`, { token: arjun });
ok("leader lists incoming (n=1)", incoming.body.items.length === 1, `by=${incoming.body.items[0]?.requester?.name}`);
ok("non-leader lists incoming → 403", (await json(`/teams/${teamId}/requests`, { token: ravi })).status === 403);
ok("non-leader reviews request → 403", (await json(`/requests/${reqId}`, { method: "PATCH", token: ravi, body: JSON.stringify({ status: "ACCEPTED" }) })).status === 403);
ok("bad review status → 400", (await json(`/requests/${reqId}`, { method: "PATCH", token: arjun, body: JSON.stringify({ status: "MAYBE" }) })).status === 400);

const accepted = await json(`/requests/${reqId}`, { method: "PATCH", token: arjun, body: JSON.stringify({ status: "ACCEPTED" }) });
ok("accept request → ACCEPTED", accepted.body.status === "ACCEPTED");
const after = await json(`/teams/${teamId}`, { token: maya });
ok("accepted member added to roster", after.body.filledSlots === 2 && after.body.isMember);
ok("slot decremented (2 → 1)", after.body.openSlots === 1);
ok("💬 Instant Connect: contact revealed to the new member", after.body.contact?.value === draft.contactValue);
ok("double-review → 409", (await json(`/requests/${reqId}`, { method: "PATCH", token: arjun, body: JSON.stringify({ status: "ACCEPTED" }) })).status === 409);

// ── my teams / my requests ────────────────────────────────────────────────────
console.log("\nMy Teams / My Requests");
const myTeams = await json("/teams/mine", { token: maya });
const smoke = myTeams.body.items.find((t) => t.id === teamId);
ok("GET /teams/mine includes the joined squad", Boolean(smoke), `myRole=${smoke?.myRole}`);
ok("my-teams exposes my contact (I'm a member)", smoke?.contact?.value === draft.contactValue);

const myReq = await json("/requests/mine", { token: maya });
ok("GET /requests/mine lists outgoing", myReq.body.outgoing.some((r) => r.id === reqId && r.status === "ACCEPTED"));
ok("GET /requests/mine lists incoming for leads", (await json("/requests/mine", { token: arjun })).body.incoming.every((r) => r.status === "PENDING"));

// cancel + decline flow — kept on the squad this script creates, so the run is repeatable.
console.log("\nCancel / decline flow");
const hackvitId = (await json("/hackathons?search=HackVIT")).body.items[0].id;
const raviApp = await json(`/teams/${teamId}/requests`, { method: "POST", token: ravi, body: JSON.stringify({ role: "AIML", message: "ML pipeline owner here." }) });
ok("POST third request (ravi) → 201", raviApp.status === 201);
ok("cancel someone else's request → 403", (await json(`/requests/${raviApp.body.id}`, { method: "DELETE", token: maya })).status === 403);
ok("applicant cancels own request", (await json(`/requests/${raviApp.body.id}`, { method: "DELETE", token: ravi })).body.status === "CANCELLED");
const reapplied = await json(`/teams/${teamId}/requests`, { method: "POST", token: ravi, body: JSON.stringify({ role: "AIML" }) });
ok("cancelled request does not block re-applying", reapplied.status === 201);
ok("leader declines a request", (await json(`/requests/${reapplied.body.id}`, { method: "PATCH", token: arjun, body: JSON.stringify({ status: "DECLINED" }) })).body.status === "DECLINED");
const pixelPirates = (await json(`/hackathons/${hackvitId}/teams`)).body.items.find((t) => t.name === "Pixel Pirates");
ok("full squad rejects applications → 409", (await json(`/teams/${pixelPirates.id}/requests`, { method: "POST", token: arjun, body: JSON.stringify({}) })).status === 409);

// ── solo builders ─────────────────────────────────────────────────────────────
console.log("\nSolo builders (Looking for Team)");
const solo = await json(`/hackathons/${hackvitId}/solo-posts`, { token: arjun });
ok("GET solo posts → items", solo.body.items.length >= 1, `n=${solo.body.total}`);
ok("solo list includes viewer's own post (mine)", solo.body.mine?.user?.id !== undefined, `mine=${solo.body.mine?.user?.name}`);
ok("mine is null when the viewer hasn't posted", (await json(`/hackathons/${hackvitId}/solo-posts`, { token: maya })).body.mine === null);
const posted = await json(`/hackathons/${hackvitId}/solo-post`, { method: "POST", token: ravi, body: JSON.stringify({ pitch: "Systems + backend human looking for a design-forward squad for HackVIT." }) });
ok("POST solo-post upserts", posted.status === 200 && posted.body.pitch.startsWith("Systems"));
const reposted = await json(`/hackathons/${hackvitId}/solo-post`, { method: "POST", token: ravi, body: JSON.stringify({ pitch: "Updated pitch from the smoke test." }) });
ok("POST solo-post again → same id (upsert)", reposted.body.id === posted.body.id);
ok("delete someone else's solo post → 403", (await json(`/solo-posts/${posted.body.id}`, { method: "DELETE", token: maya })).status === 403);
ok("DELETE own solo post → 204", (await json(`/solo-posts/${posted.body.id}`, { method: "DELETE", token: ravi })).status === 204);
ok("solo-post with no token → 401", (await json(`/hackathons/${hackvitId}/solo-post`, { method: "POST", body: JSON.stringify({ pitch: "nope nope nope" }) })).status === 401);

// ── cleanup ───────────────────────────────────────────────────────────────────
console.log("\nCleanup");
ok("non-leader delete squad → 403", (await json(`/teams/${teamId}`, { method: "DELETE", token: ravi })).status === 403);
ok("leader deletes squad → 204", (await json(`/teams/${teamId}`, { method: "DELETE", token: arjun })).status === 204);
ok("deleted squad gone from board", !(await json(`/hackathons/${calhacksId}/teams`)).body.items.some((t) => t.id === teamId));

console.log(`\n${fail === 0 ? "✅" : "⚠️"}  ${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
