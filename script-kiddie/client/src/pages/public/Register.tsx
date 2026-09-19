import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { SampleTestPreview } from "@/components/marketing/SampleTestPreview";

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuthStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const passwordValid = password.length >= 10 && /[a-z]/.test(password) && /[A-Z]/.test(password) && /[0-9]/.test(password);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!passwordValid) {
      setError("Your password needs at least 10 characters, including an uppercase letter, a lowercase letter, and a number.");
      return;
    }
    setLoading(true);
    try {
      const verifiedEmail = await register(name, email, password);
      navigate(`/verify-email?email=${encodeURIComponent(verifiedEmail)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong creating your account. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout panel={<SampleTestPreview />}>
      <h1 className="text-2xl font-semibold text-ink">Create your account</h1>
      <p className="mt-1 text-sm text-ink-muted">Takes about a minute. No credit card needed.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4" noValidate>
        {error && <Alert variant="danger">{error}</Alert>}
        <div className="space-y-1.5">
          <Label htmlFor="name">Your name</Label>
          <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} minLength={2} maxLength={60} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <p className="text-xs text-ink-faint">We'll send a code here to confirm it's really you.</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          <p className="text-xs text-ink-faint">At least 10 characters, with an uppercase letter, a lowercase letter, and a number.</p>
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Creating your account…" : "Create account"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-muted">
        Already have an account? <Link to="/login" className="text-accent hover:underline">Log in</Link>
      </p>
    </AuthLayout>
  );
}
