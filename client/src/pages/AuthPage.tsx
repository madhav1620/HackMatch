import { Button, Input, Modal } from "../components/ui";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function AuthPage() {
  const { login, register, verifyOtp } = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");
  const [otpOpen, setOtpOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  /** Admin accounts open their workspace; fresh student accounts complete onboarding. */
  function goNext(u: { role: string; primaryRole: string; skills: string[] }) {
    if (u.role === "ADMIN") { nav("/admin"); return; }
    const fresh = u.primaryRole === "OTHER" && u.skills.length === 0;
    nav(fresh ? "/onboarding" : "/");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "login") {
        const u = await login(email, password);
        goNext(u);
      } else {
        await register(email, password, name);
        setOtpOpen(true);
      }
    } catch (err: unknown) {
      const m = err instanceof Error ? err.message : "Something went wrong";
      setError(m);
    } finally {
      setBusy(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const u = await verifyOtp(email, otp);
      setOtpOpen(false);
      goNext(u);
    } catch (err: unknown) {
      const m = err instanceof Error ? err.message : "Invalid code";
      setError(m);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-dotmatrix flex min-h-screen items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="border-hairline bg-surface rounded-xl border p-6 shadow-card w-full max-w-sm"
      >
        <h1 className="text-xl font-semibold">{mode === "login" ? "Sign in" : "Create account"}</h1>
        <p className="text-ink-muted mt-1 text-sm">{mode === "login" ? "Use your account email" : "Use your college email"}</p>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        {mode === "register" && (
          <div className="mt-4">
            <label className="label-caps text-ink-muted">Full name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required minLength={2} />
          </div>
        )}

        <div className="mt-4">
          <label className="label-caps text-ink-muted">{mode === "login" ? "Email" : "College email"}</label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </div>

        <div className="mt-4">
          <label className="label-caps text-ink-muted">Password</label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />
        </div>

        <Button type="submit" className="mt-6 w-full" disabled={busy} loading={busy}>
          {mode === "login" ? "Sign in" : "Send verification code"}
        </Button>

        <div className="mt-4 text-center text-sm">
          <button
            type="button"
            className="text-ink underline-offset-2 hover:underline"
            onClick={() => setMode(mode === "login" ? "register" : "login")}
          >
            {mode === "login" ? "No account? Create one" : "Have an account? Sign in"}
          </button>
        </div>
      </form>

      <Modal open={otpOpen} title="Verify your college email" onClose={() => setOtpOpen(false)}>
        <form onSubmit={handleVerify} className="space-y-4">
          <p className="text-ink-muted text-sm">
            We sent a 6-digit code to <span className="text-ink">{email}</span> (check console in dev).
          </p>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Input
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="123456"
            className="text-center font-mono tracking-widest text-lg"
            required
            inputMode="numeric"
          />
          <Button type="submit" className="w-full" disabled={busy} loading={busy}>
            Verify &amp; continue
          </Button>
        </form>
      </Modal>
    </div>
  );
}
