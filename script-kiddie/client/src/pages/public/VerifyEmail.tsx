import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { MailCheck } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { SampleTestPreview } from "@/components/marketing/SampleTestPreview";

const RESEND_COOLDOWN_SECONDS = 30;

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { verifyEmail, resendVerificationCode } = useAuthStore();
  const email = params.get("email") ?? "";
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    return () => clearInterval(timerRef.current);
  }, []);

  function startCooldown() {
    setCooldown(RESEND_COOLDOWN_SECONDS);
    timerRef.current = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await verifyEmail(email, code);
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "That code didn't work. Double-check it and try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (cooldown > 0) return;
    try {
      await resendVerificationCode(email);
      toast.success("New code sent");
      startCooldown();
    } catch {
      toast.error("Couldn't send a new code right now. Try again in a moment.");
    }
  }

  if (!email) {
    return (
      <AuthLayout panel={<SampleTestPreview />}>
        <Alert variant="danger">We're missing the email to verify. Start over from registration.</Alert>
        <Link to="/register" className="mt-4 inline-block text-sm text-accent hover:underline">
          Back to registration
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout panel={<SampleTestPreview />}>
      <MailCheck className="h-6 w-6 text-accent" />
      <h1 className="mt-4 text-2xl font-semibold text-ink">Check your email</h1>
      <p className="mt-1 text-sm text-ink-muted">
        We sent a 6-digit code to <span className="text-ink">{email}</span>. Enter it below to finish setting up
        your account.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4" noValidate>
        {error && <Alert variant="danger">{error}</Alert>}
        <div className="space-y-1.5">
          <Label htmlFor="code">Verification code</Label>
          <Input
            id="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="000000"
            required
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className="text-center text-lg tracking-[0.5em]"
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading || code.length !== 6}>
          {loading ? "Verifying…" : "Verify and continue"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-muted">
        Didn't get it?{" "}
        <button
          type="button"
          onClick={handleResend}
          disabled={cooldown > 0}
          className="text-accent hover:underline disabled:cursor-not-allowed disabled:text-ink-faint disabled:no-underline"
        >
          {cooldown > 0 ? `Resend in ${cooldown}s` : "Send a new code"}
        </button>
      </p>
    </AuthLayout>
  );
}
