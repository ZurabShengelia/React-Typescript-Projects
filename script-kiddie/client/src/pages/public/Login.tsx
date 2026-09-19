import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { SampleTestPreview } from "@/components/marketing/SampleTestPreview";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Welcome back");
      navigate("/dashboard");
    } catch (err) {
      if (err instanceof Error && err.message === "EMAIL_NOT_VERIFIED") {
        navigate(`/verify-email?email=${encodeURIComponent(email)}`);
        return;
      }
      setError(err instanceof Error ? err.message : "We couldn't log you in. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout panel={<SampleTestPreview />}>
      <h1 className="text-2xl font-semibold text-ink">Welcome back</h1>
      <p className="mt-1 text-sm text-ink-muted">Log in to pick up where you left off.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4" noValidate>
        {error && <Alert variant="danger">{error}</Alert>}
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link to="/forgot-password" className="text-xs text-accent hover:underline">Forgot it?</Link>
          </div>
          <Input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Logging in…" : "Log in"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-muted">
        New here? <Link to="/register" className="text-accent hover:underline">Create an account</Link>
      </p>
    </AuthLayout>
  );
}
