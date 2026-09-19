import { useState } from "react";
import { toast } from "sonner";
import { api, getMappedErrorMessage } from "@/lib/api";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Step = "idle" | "request" | "confirm";

const REQUEST_ERRORS: Record<string, string> = {
  EMAIL_IN_USE: "That email is already linked to another account.",
  EMAIL_UNCHANGED: "That's already your current email address.",
  RATE_LIMITED: "Too many requests. Try again in an hour.",
};

const CONFIRM_ERRORS: Record<string, string> = {
  CODE_INVALID: "That code isn't right. Check the email and try again.",
  CODE_EXPIRED: "That code has expired. Request a new one.",
  TOO_MANY_ATTEMPTS: "Too many incorrect attempts. Request a new code.",
  EMAIL_IN_USE: "That email was claimed by another account. Try a different one.",
  RATE_LIMITED: "Too many requests. Try again in an hour.",
};

export function ChangeEmailCard({
  currentEmail,
  pendingEmail,
  onChanged,
}: {
  currentEmail: string;
  pendingEmail: string | null;
  onChanged: (email: string) => void;
}) {
  const [step, setStep] = useState<Step>(pendingEmail ? "confirm" : "idle");
  const [newEmail, setNewEmail] = useState("");
  const [target, setTarget] = useState(pendingEmail ?? "");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function reset() {
    setStep("idle");
    setNewEmail("");
    setCode("");
    setError(null);
  }

  async function handleRequest(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.post("/profile/email-change", { newEmail });
      setTarget(res.data.data.pendingEmail as string);
      setCode("");
      setStep("confirm");
      toast.success("Confirmation code sent to your new address");
    } catch (err) {
      setError(getMappedErrorMessage(err, REQUEST_ERRORS));
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.post("/profile/email-change/confirm", { code });
      onChanged(res.data.data.email as string);
      toast.success("Email address updated");
      reset();
    } catch (err) {
      setError(getMappedErrorMessage(err, CONFIRM_ERRORS));
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel() {
    setLoading(true);
    try {
      await api.post("/profile/email-change/cancel");
    } catch {

    } finally {
      setLoading(false);
      reset();
    }
  }

  return (
    <div className="max-w-sm space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="currentEmail">Email</Label>
        <Input id="currentEmail" value={currentEmail} disabled />
      </div>

      {step === "idle" && (
        <Button type="button" variant="secondary" onClick={() => setStep("request")}>
          Change email
        </Button>
      )}

      {step === "request" && (
        <form onSubmit={handleRequest} className="space-y-4">
          {error && <Alert variant="danger">{error}</Alert>}
          <div className="space-y-1.5">
            <Label htmlFor="newEmail">New email address</Label>
            <Input
              id="newEmail"
              type="email"
              required
              autoFocus
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="you@example.com"
            />
            <p className="text-xs text-ink-faint">
              We'll send a 6-digit code to this address to confirm you control it.
            </p>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={loading || newEmail.trim().length === 0}>
              {loading ? "Sending code…" : "Send confirmation code"}
            </Button>
            <Button type="button" variant="ghost" onClick={reset} disabled={loading}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {step === "confirm" && (
        <form onSubmit={handleConfirm} className="space-y-4">
          {error && <Alert variant="danger">{error}</Alert>}
          <p className="text-sm text-ink-muted">
            Enter the code sent to <span className="text-ink">{target}</span>. Your address changes only
            after this step.
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="emailChangeCode">Confirmation code</Label>
            <Input
              id="emailChangeCode"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              required
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="text-center text-lg tracking-[0.5em]"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={loading || code.length !== 6}>
              {loading ? "Confirming…" : "Confirm new email"}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setStep("request")} disabled={loading}>
              Use a different address
            </Button>
            <Button type="button" variant="ghost" onClick={handleCancel} disabled={loading}>
              Cancel
            </Button>
          </div>
          <p className="text-xs text-ink-faint">
            Requesting a new code invalidates the previous one. Codes expire after 15 minutes.
          </p>
        </form>
      )}
    </div>
  );
}
