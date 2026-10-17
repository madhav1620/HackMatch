import "dotenv/config";
import express from "express";
import cors from "cors";

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL ?? "http://localhost:5173", credentials: true }));
app.use(express.json());

// Health check — Phase 2 adds route modules here (auth, profiles, hackathons, teams)
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "hackmatch-server", time: new Date().toISOString() });
});

const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => {
  console.log(`[server] HackMatch API listening on http://localhost:${port}`);
});
