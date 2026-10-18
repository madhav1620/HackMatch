import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import { authRouter } from "./routes/auth.routes.js";
import { hackRouter, bookmarksRouter } from "./routes/hackathon.routes.js";
import { hackathonTeamsRouter, requestsRouter, soloRouter, teamsRouter } from "./routes/team.routes.js";
import { errorHandler } from "./middleware/auth.js";

const app = express();

app.use(cors({ origin: env.clientUrl, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "hackmatch-server", time: new Date().toISOString() });
});

app.use("/api/auth", authRouter);
app.use("/api/hackathons", hackRouter);
app.use("/api/hackathons", hackathonTeamsRouter);
app.use("/api/teams", teamsRouter);
app.use("/api/requests", requestsRouter);
app.use("/api/solo-posts", soloRouter);
app.use("/api/bookmarks", bookmarksRouter);

/**
 * Production: host the built client from this same server. The client calls
 * the API with relative `/api/*` paths, so single-origin serving means no CORS
 * and no API-base configuration. Skipped when `client/dist` is absent (dev).
 */
if (env.serveClient) {
  const distDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../client/dist");
  if (fs.existsSync(distDir)) {
    app.use(express.static(distDir, { index: false, maxAge: "1h", fallthrough: true }));
    // SPA fallback — any non-/api GET renders the client shell.
    app.get(/^(?!\/api\/).*/, (_req, res) => {
      res.sendFile(path.join(distDir, "index.html"));
    });
  } else {
    console.warn(`[server] SERVE_CLIENT enabled but ${distDir} not found — run "npm run build" first.`);
  }
}

app.use(errorHandler);

export default app;
