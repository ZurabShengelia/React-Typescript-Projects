import { useRef, useState } from "react";
import { toast } from "sonner";
import { UploadCloud, X, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { uploadAvatar, deleteAvatar, getErrorMessage } from "@/lib/api";
import { initials, cn } from "@/lib/utils";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

type Status = "idle" | "uploading" | "success" | "error";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentAvatarUrl: string | null;
  userName: string;
  onChanged: (avatarUrl: string | null) => void;
}

export function AvatarUploadDialog({ open, onOpenChange, currentAvatarUrl, userName, onChanged }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function reset() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setStatus("idle");
    setError(null);
    setDragActive(false);
  }

  function handleClose(nextOpen: boolean) {
    if (status === "uploading") return;
    if (!nextOpen) reset();
    onOpenChange(nextOpen);
  }

  function validateAndSetFile(candidate: File | undefined) {
    if (!candidate) return;
    setError(null);

    if (!ACCEPTED_TYPES.includes(candidate.type)) {
      setError("Please choose a JPG, PNG, or WEBP image.");
      return;
    }
    if (candidate.size > MAX_BYTES) {
      setError("Image must be 5MB or smaller.");
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(candidate);
    setPreviewUrl(URL.createObjectURL(candidate));
    setStatus("idle");
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragActive(false);
    validateAndSetFile(e.dataTransfer.files?.[0]);
  }

  async function handleSave() {
    if (!file) return;
    setStatus("uploading");
    setError(null);
    try {
      const avatarUrl = await uploadAvatar(file);
      setStatus("success");
      onChanged(avatarUrl);
      toast.success("Profile picture updated");
      setTimeout(() => handleClose(false), 600);
    } catch (err) {
      setStatus("error");
      setError(getErrorMessage(err));
    }
  }

  async function handleRemove() {
    setStatus("uploading");
    setError(null);
    try {
      await deleteAvatar();
      setStatus("success");
      onChanged(null);
      toast.success("Profile picture removed");
      setTimeout(() => handleClose(false), 400);
    } catch (err) {
      setStatus("error");
      setError(getErrorMessage(err));
    }
  }

  const displaySrc = previewUrl ?? currentAvatarUrl ?? undefined;
  const busy = status === "uploading";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogTitle className="text-lg font-semibold text-ink">Change profile picture</DialogTitle>
        <DialogDescription className="mt-1 text-sm text-ink-muted">
          JPG, PNG, or WEBP. Maximum 5MB.
        </DialogDescription>

        <div className="mt-5 flex items-center gap-5">
          <Avatar className="h-16 w-16 text-lg">
            {displaySrc && <AvatarImage src={displaySrc} alt="" />}
            <AvatarFallback className="text-lg">{initials(userName)}</AvatarFallback>
          </Avatar>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
            className={cn(
              "flex flex-1 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-md border border-dashed px-4 py-5 text-center transition-colors",
              dragActive ? "border-accent bg-accent-muted" : "border-base-border hover:border-base-borderStrong"
            )}
          >
            <UploadCloud className="h-5 w-5 text-ink-faint" />
            <p className="text-sm text-ink-muted">
              <span className="font-medium text-accent">Browse files</span> or drop an image here
            </p>
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(e) => validateAndSetFile(e.target.files?.[0])}
            />
          </div>
        </div>

        {error && (
          <p className="mt-3 flex items-center gap-1.5 text-sm text-danger">
            <AlertCircle className="h-4 w-4 shrink-0" /> {error}
          </p>
        )}
        {status === "success" && (
          <p className="mt-3 flex items-center gap-1.5 text-sm text-success">
            <CheckCircle2 className="h-4 w-4 shrink-0" /> Saved
          </p>
        )}

        <div className="mt-6 flex items-center justify-between">
          {currentAvatarUrl && !file ? (
            <Button variant="ghost" size="sm" onClick={handleRemove} disabled={busy}>
              <X className="h-3.5 w-3.5" /> Remove current picture
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => handleClose(false)} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!file || busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {busy ? "Uploading…" : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
