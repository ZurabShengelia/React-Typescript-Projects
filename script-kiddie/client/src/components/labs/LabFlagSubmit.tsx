import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type FlagFeedback = { type: "success" | "error"; message: string } | null;

export function LabFlagSubmit({
  value,
  onChange,
  onSubmit,
  submitting,
  feedback,
  solved,
}: {
  value: string;
  onChange: (next: string) => void;
  onSubmit: () => void;
  submitting: boolean;
  feedback: FlagFeedback;
  solved: boolean;
}) {
  return (
    <section className="rounded-md border border-base-border bg-base-panel px-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-mono-label">SUBMIT FLAG</h2>
        {feedback && (
          <p
            role="status"
            className={feedback.type === "success" ? "text-sm text-accent" : "text-sm text-danger"}
          >
            {feedback.message}
          </p>
        )}
      </div>

      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="flag{…}"
          aria-label="Flag"
          spellCheck={false}
          autoComplete="off"
          disabled={solved}
          className="font-mono"
        />
        <Button type="submit" disabled={submitting || solved || value.trim().length === 0}>
          {submitting ? "Checking…" : solved ? "Solved" : "Submit"}
        </Button>
      </form>
    </section>
  );
}
