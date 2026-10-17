/**
 * stitch-generate.mjs
 * ---------------------------------------------------------------------------
 * Drives the Stitch MCP endpoint over plain HTTP so generations are NOT bound
 * by opencode's 60s MCP tool timeout (a screen takes several minutes).
 *
 * The API key is read out of ~/.config/opencode/opencode.jsonc at runtime —
 * never hardcode it here.
 *
 *   node scripts/stitch-generate.mjs
 *
 * Reads:      scripts/stitch-screens.json
 * Writes:     scripts/out/<slug>.json   (raw tools/call payload)
 *             scripts/out/<slug>.error.txt
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = "D:/MADDY/HackMatch";
const MANIFEST = join(ROOT, "scripts/stitch-screens.json");
const OUT = join(ROOT, "scripts/out");
mkdirSync(OUT, { recursive: true });

const CFG = join(process.env.USERPROFILE, ".config/opencode/opencode.jsonc");
const cfg = readFileSync(CFG, "utf8");
const key = (cfg.match(/"X-Goog-Api-Key"\s*:\s*"([^"]+)"/) || [])[1];
if (!key) throw new Error("X-Goog-Api-Key not found in " + CFG);

const URL = "https://stitch.googleapis.com/mcp";
const JOBS = JSON.parse(readFileSync(MANIFEST, "utf8"));
const CONCURRENCY = Number(process.env.STITCH_CONCURRENCY || 2);
const stamp = () => new Date().toISOString().slice(11, 19);

/** Parse either a plain JSON body or an SSE stream into the final message. */
function parse(text) {
  const t = text.trim();
  if (t.startsWith("{") || t.startsWith("[")) {
    try { return JSON.parse(t); } catch { /* fall through */ }
  }
  const datas = text
    .split(/\r?\n/)
    .filter((l) => l.startsWith("data:"))
    .map((l) => l.slice(5).trim())
    .filter((d) => d && d !== "[DONE]");
  if (datas.length) {
    try { return JSON.parse(datas[datas.length - 1]); } catch { /* fall through */ }
  }
  return { _unparsed: text.slice(0, 4000) };
}

async function callTool(name, args) {
  const res = await fetch(URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
      "X-Goog-Api-Key": key,
    },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name, arguments: args } }),
  });
  const text = await res.text();
  return { httpStatus: res.status, message: parse(text) };
}

let next = 0;

async function worker(wid) {
  for (;;) {
    const my = next++;
    if (my >= JOBS.length) return;
    const job = JOBS[my];
    const t0 = Date.now();
    console.log(`[${stamp()}] w${wid} START ${job.slug}`);
    try {
      const payload = await callTool("generate_screen_from_text", {
        projectId: job.projectId,
        prompt: job.prompt,
        designSystem: job.designSystem,
        deviceType: job.deviceType,
      });
      writeFileSync(join(OUT, `${job.slug}.json`), JSON.stringify(payload, null, 2));
      console.log(`[${stamp()}] w${wid} DONE ${job.slug} in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
    } catch (e) {
      writeFileSync(join(OUT, `${job.slug}.error.txt`), String(e && e.stack ? e.stack : e));
      console.log(`[${stamp()}] w${wid} FAIL ${job.slug}: ${e}`);
    }
  }
}

const workers = Number.isFinite(CONCURRENCY) && CONCURRENCY > 0 ? CONCURRENCY : 2;
console.log(`[${stamp()}] ${JOBS.length} job(s), concurrency ${workers}`);
await Promise.all(Array.from({ length: workers }, (_, i) => worker(i + 1)));
console.log(`[${stamp()}] ALL JOBS COMPLETE`);
