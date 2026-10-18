import { Router } from "express";
import * as auth from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const authRouter = Router();

authRouter.post("/register", asyncHandler(auth.register));
authRouter.post("/verify-otp", asyncHandler(auth.verifyOtp));
authRouter.post("/resend-otp", asyncHandler(auth.resendOtp));
authRouter.post("/login", asyncHandler(auth.login));
authRouter.post("/refresh", asyncHandler(auth.refresh));
authRouter.post("/logout", asyncHandler(auth.logout));
authRouter.get("/me", requireAuth, asyncHandler(auth.me));
authRouter.patch("/me", requireAuth, asyncHandler(auth.updateMe));
authRouter.get("/profiles/:id", requireAuth, asyncHandler(auth.profile));
