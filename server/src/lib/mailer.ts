import nodemailer from "nodemailer";
import { env } from "../config/env.js";

/** 6-digit numeric OTP */
export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const transport = env.smtp.host
  ? nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      auth: { user: env.smtp.user, pass: env.smtp.pass },
    })
  : null;

/** Sends the OTP email; in dev (no SMTP configured) logs the code to the console. */
export async function sendOtpEmail(to: string, code: string): Promise<void> {
  if (!transport) {
    console.log(`[dev-mail] OTP for ${to}: ${code} (10 min expiry)`);
    return;
  }
  await transport.sendMail({
    from: env.mailFrom,
    to,
    subject: "Your HackMatch sign-in code",
    text: `Your verification code is ${code}. It expires in 10 minutes.`,
    html: `<p>Your verification code is:</p><p style="font:700 28px 'JetBrains Mono',monospace;letter-spacing:8px">${code}</p><p>It expires in 10 minutes.</p>`,
  });
}
