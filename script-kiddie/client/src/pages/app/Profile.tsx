import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
import { api, getErrorMessage } from "@/lib/api";
import type { ProfileData } from "@/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DetailSkeleton } from "@/components/common/LoadingState";
import { Alert } from "@/components/ui/alert";
import { AvatarUploadDialog } from "@/components/profile/AvatarUploadDialog";
import { ChangeEmailCard } from "@/components/profile/ChangeEmailCard";
import { formatDate, initials } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";

export default function Profile() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    let mounted = true;
    api
      .get("/profile")
      .then((res) => {
        if (!mounted) return;
        setProfile(res.data.data);
        setName(res.data.data.name);
      })
      .catch((err) => mounted && setError(getErrorMessage(err)));
    return () => {
      mounted = false;
    };
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch("/profile", { name });
      toast.success("Profile updated");
      await hydrate();
      setProfile((p) => (p ? { ...p, name } : p));
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleEmailChanged(email: string) {
    setProfile((p) => (p ? { ...p, email, pendingEmail: null } : p));

    await hydrate();
  }

  async function handleAvatarChanged(avatarUrl: string | null) {
    setProfile((p) => (p ? { ...p, avatarUrl } : p));
    await hydrate();
  }

  if (error) return <Alert variant="danger">{error}</Alert>;
  if (!profile) return <DetailSkeleton />;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="flex items-center gap-5">
        <button
          type="button"
          onClick={() => setAvatarDialogOpen(true)}
          className="group relative rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          aria-label="Change profile picture"
        >
          <Avatar className="h-20 w-20 text-xl">
            {profile.avatarUrl && <AvatarImage src={profile.avatarUrl} alt="" />}
            <AvatarFallback className="text-xl">{initials(profile.name)}</AvatarFallback>
          </Avatar>
          <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-base bg-base-raised text-ink-muted transition-colors group-hover:border-accent group-hover:text-accent">
            <Pencil className="h-3.5 w-3.5" />
          </span>
        </button>

        <div>
          <h1 className="text-xl font-semibold text-ink">{profile.name}</h1>
          <p className="text-sm text-ink-muted">{profile.email}</p>
          <p className="text-xs text-ink-faint">Member since {formatDate(profile.createdAt)}</p>
        </div>
      </div>

      <AvatarUploadDialog
        open={avatarDialogOpen}
        onOpenChange={setAvatarDialogOpen}
        currentAvatarUrl={profile.avatarUrl}
        userName={profile.name}
        onChanged={handleAvatarChanged}
      />

      <div>
        <p className="text-mono-label mb-3">PERFORMANCE</p>
        <div className="grid grid-cols-3 divide-x divide-base-border rounded-md border border-base-border bg-base-panel">
          <div className="px-5 py-4">
            <p className="text-xs text-ink-faint">Completed assessments</p>
            <p className="mt-1.5 text-2xl font-semibold text-ink">{profile.stats.completedTests}</p>
          </div>
          <div className="px-5 py-4">
            <p className="text-xs text-ink-faint">Average score</p>
            <p className="mt-1.5 text-2xl font-semibold text-ink">{profile.stats.averageScore}%</p>
          </div>
          <div className="px-5 py-4">
            <p className="text-xs text-ink-faint">Strongest category</p>
            <p className="mt-1.5 text-lg font-semibold text-ink">{profile.stats.strongestCategory ?? "—"}</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Profile details</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="max-w-sm space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} minLength={2} maxLength={60} required />
            </div>
            <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Email address</CardTitle></CardHeader>
        <CardContent>
          <ChangeEmailCard
            currentEmail={profile.email}
            pendingEmail={profile.pendingEmail}
            onChanged={handleEmailChanged}
          />
        </CardContent>
      </Card>
    </div>
  );
}
