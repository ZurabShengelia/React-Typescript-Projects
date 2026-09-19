import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { api, getErrorMessage } from "@/lib/api";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useAuthStore } from "@/store/authStore";

export default function Settings() {
  const { tab } = useParams<{ tab: string }>();
  const navigate = useNavigate();
  const activeTab = tab ?? "security";

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold text-ink">Settings</h1>
      <Tabs value={activeTab} onValueChange={(v) => navigate(`/settings/${v}`)} className="mt-6">
        <TabsList>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>

        <TabsContent value="security"><SecurityTab /></TabsContent>
        <TabsContent value="privacy"><PrivacyTab /></TabsContent>
        <TabsContent value="account"><AccountTab /></TabsContent>
      </Tabs>
    </div>
  );
}

function SecurityTab() {
  const [step, setStep] = useState<"form" | "code">("form");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);

  async function handleRequestChange(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.post("/auth/change-password", { currentPassword, newPassword });
      toast.success("Check your email for a confirmation code");
      setStep("code");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmChange(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.post("/auth/change-password/confirm", { code });
      toast.success("Password updated. Please log in again.");
      await logout();
      navigate("/login");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Change password</CardTitle></CardHeader>
        <CardContent>
          {step === "form" ? (
            <form onSubmit={handleRequestChange} className="max-w-sm space-y-4">
              {error && <Alert variant="danger">{error}</Alert>}
              <div className="space-y-1.5">
                <Label htmlFor="currentPassword">Current password</Label>
                <Input id="currentPassword" type="password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="newPassword">New password</Label>
                <Input id="newPassword" type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                <p className="text-xs text-ink-faint">At least 10 characters, with upper, lower case letters and a number.</p>
              </div>
              <Button type="submit" disabled={loading}>{loading ? "Sending code…" : "Send confirmation code"}</Button>
            </form>
          ) : (
            <form onSubmit={handleConfirmChange} className="max-w-sm space-y-4">
              {error && <Alert variant="danger">{error}</Alert>}
              <p className="text-sm text-ink-muted">
                We emailed a 6-digit code to confirm this change. Enter it below to finish updating your password.
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="changeCode">Confirmation code</Label>
                <Input
                  id="changeCode"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="text-center text-lg tracking-[0.5em]"
                />
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="secondary" onClick={() => setStep("form")}>Back</Button>
                <Button type="submit" disabled={loading || code.length !== 6}>
                  {loading ? "Confirming…" : "Confirm password change"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Account security</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-ink-muted">
            Changing your password immediately signs you out of every active session, including this one.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function PrivacyTab() {
  const [visibility, setVisibility] = useState<"private" | "public">("private");
  const [shareAnalytics, setShareAnalytics] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get("/profile").then((res) => {
      setVisibility(res.data.data.privacy.profileVisibility);
      setShareAnalytics(res.data.data.privacy.shareAnalytics);
    });
  }, []);

  async function updatePrivacy(patch: Partial<{ profileVisibility: "private" | "public"; shareAnalytics: boolean }>) {
    setLoading(true);
    try {
      await api.patch("/profile/privacy", patch);
      toast.success("Privacy settings updated");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader><CardTitle>Privacy</CardTitle></CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-ink">Profile visibility</p>
            <p className="text-xs text-ink-muted">Control whether your profile stats are visible to other users.</p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={visibility === "private" ? "primary" : "secondary"}
              disabled={loading}
              onClick={() => { setVisibility("private"); updatePrivacy({ profileVisibility: "private" }); }}
            >
              Private
            </Button>
            <Button
              size="sm"
              variant={visibility === "public" ? "primary" : "secondary"}
              disabled={loading}
              onClick={() => { setVisibility("public"); updatePrivacy({ profileVisibility: "public" }); }}
            >
              Public
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-base-border pt-5">
          <div>
            <p className="text-sm font-medium text-ink">Share usage analytics</p>
            <p className="text-xs text-ink-muted">Help us improve Script Kiddie by sharing anonymized usage data.</p>
          </div>
          <Button
            size="sm"
            variant={shareAnalytics ? "primary" : "secondary"}
            disabled={loading}
            onClick={() => { const next = !shareAnalytics; setShareAnalytics(next); updatePrivacy({ shareAnalytics: next }); }}
          >
            {shareAnalytics ? "Enabled" : "Disabled"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function AccountTab() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [step, setStep] = useState<"confirm" | "code">("confirm");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);

  function openDialog() {
    setStep("confirm");
    setCode("");
    setError(null);
    setDialogOpen(true);
  }

  async function handleRequestDeletion() {
    setLoading(true);
    setError(null);
    try {
      await api.post("/profile/delete-request");
      setStep("code");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmDeletion(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.post("/profile/delete-request/confirm", { code });
      toast.success("Your account has been deleted");
      setDialogOpen(false);
      await logout();
      navigate("/");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader><CardTitle>Account</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-ink-muted">
          Deleting your account permanently removes your profile, avatar, and entire assessment history.
          This cannot be undone.
        </p>
        <Button variant="danger" onClick={openDialog}>Delete account</Button>
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          {step === "confirm" ? (
            <>
              <DialogTitle className="text-lg font-semibold text-ink">Delete your account?</DialogTitle>
              <DialogDescription className="mt-2 text-sm text-ink-muted">
                We'll email you a confirmation code first. Nothing is deleted until you enter it.
              </DialogDescription>
              <div className="mt-6 flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button variant="danger" onClick={handleRequestDeletion} disabled={loading}>
                  {loading ? "Sending code…" : "Send confirmation code"}
                </Button>
              </div>
            </>
          ) : (
            <form onSubmit={handleConfirmDeletion}>
              <DialogTitle className="text-lg font-semibold text-ink">Enter confirmation code</DialogTitle>
              <DialogDescription className="mt-2 text-sm text-ink-muted">
                Check your email for a 6-digit code. Entering it will permanently delete your account —
                there's no undo after this.
              </DialogDescription>
              {error && <Alert variant="danger" className="mt-4">{error}</Alert>}
              <div className="mt-4 space-y-1.5">
                <Label htmlFor="deleteCode">Confirmation code</Label>
                <Input
                  id="deleteCode"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="text-center text-lg tracking-[0.5em]"
                />
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" variant="danger" disabled={loading || code.length !== 6}>
                  {loading ? "Deleting…" : "Permanently delete account"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
