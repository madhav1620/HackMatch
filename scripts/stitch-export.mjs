import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "scripts", "out");
const refDir = path.join(root, "design-reference");

const files = fs.readdirSync(outDir).filter((f) => f.endsWith(".json"));
const manifest = [];

for (const f of files) {
  const slug = f.replace(/\.json$/, "");
  const j = JSON.parse(fs.readFileSync(path.join(outDir, f), "utf8"));
  const inner = JSON.parse(j.message.result.content[0].text);
  const s = inner.outputComponents[0].design.screens[0];

  const htmlRes = await fetch(s.htmlCode.downloadUrl);
  if (!htmlRes.ok) throw new Error(`html ${slug} ${htmlRes.status}`);
  const html = await htmlRes.text();
  fs.writeFileSync(path.join(refDir, `${slug}.html`), html);

  const pngRes = await fetch(s.screenshot.downloadUrl);
  if (!pngRes.ok) throw new Error(`png ${slug} ${pngRes.status}`);
  const png = Buffer.from(await pngRes.arrayBuffer());
  fs.writeFileSync(path.join(refDir, `${slug}.png`), png);

  manifest.push({ slug, title: s.title, screenId: s.id, sessionId: inner.sessionId, width: s.width, height: s.height, html: `${slug}.html`, png: `${slug}.png` });
  console.log(`${slug}: html ${html.length}B, png ${png.length}B`);
}

fs.writeFileSync(path.join(refDir, "manifest.json"), JSON.stringify(manifest, null, 2));
console.log("wrote design-reference/manifest.json");
