import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { SecurityNotePanel } from "@/components/marketing/SecurityNotePanel";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
    } finally {
      setLoading(false);
      setSent(true);
    }
  }

  return (
    <AuthLayout panel={<SecurityNotePanel />}>
      <h1 className="text-2xl font-semibold text-ink">Reset your password</h1>
      <p className="mt-1 text-sm text-ink-muted">We'll email you a link to reset it.</p>

      {sent ? (
        <Alert variant="success" className="mt-8">
          If an account exists for that email, a reset link has been sent.
        </Alert>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Sending…" : "Send reset link"}
          </Button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-ink-muted">
        <Link to="/login" className="text-accent hover:underline">Back to log in</Link>
      </p>
    </AuthLayout>
  );
}
