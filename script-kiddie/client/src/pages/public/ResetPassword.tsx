import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { api, getErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { SecurityNotePanel } from "@/components/marketing/SecurityNotePanel";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token, password });
      toast.success("Password reset. Please log in.");
      navigate("/login");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <AuthLayout panel={<SecurityNotePanel />}>
        <div className="text-center">
          <Alert variant="danger">This reset link is missing a token. Please request a new one.</Alert>
          <Link to="/forgot-password" className="mt-4 inline-block text-sm text-accent hover:underline">
            Request a new link
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout panel={<SecurityNotePanel />}>
      <h1 className="text-2xl font-semibold text-ink">Set a new password</h1>
      <form onSubmit={handleSubmit} className="mt-8 space-y-4" noValidate>
        {error && <Alert variant="danger">{error}</Alert>}
        <div className="space-y-1.5">
          <Label htmlFor="password">New password</Label>
          <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Saving…" : "Reset password"}
        </Button>
      </form>
    </AuthLayout>
  );
}
