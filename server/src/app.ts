import "dotenv/config";
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

app.use(errorHandler);

export default app;
