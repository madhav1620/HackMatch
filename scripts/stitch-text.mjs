import fs from "node:fs";
const slug = process.argv[2];
const html = fs.readFileSync(`design-reference/${slug}.html`, "utf8");
const text = html
  .replace(/<style[\s\S]*?<\/style>/gi, "")
  .replace(/<script[\s\S]*?<\/script>/gi, "")
  .replace(/<\/(div|section|header|footer|article|li|tr|h1|h2|h3|h4|p|button|a)>/gi, "\n")
  .replace(/<[^>]+>/g, " ")
  .replace(/&nbsp;/g, " ")
  .replace(/&amp;/g, "&")
  .split("\n")
  .map((l) => l.replace(/\s+/g, " ").trim())
  .filter((l) => l.length);
console.log(text.join("\n"));
