import { DifficultyBadge } from "@/components/common/DifficultyBadge";
import { Progress } from "@/components/ui/progress";

const categories = [
  "Web Security", "Authentication", "Cryptography", "Secure Coding",
  "Network Security", "Linux & Systems", "APIs & Databases", "DevSecOps",
];

export function SampleTestPreview() {
  return (
    <div>
      <div className="rounded-md border border-base-border bg-base p-6">
        <div className="mb-3 flex items-center gap-2 text-sm">
          <span className="font-medium text-ink">APIs &amp; Databases</span>
          <span className="text-ink-faint">·</span>
          <DifficultyBadge difficulty="medium" />
        </div>
        <div className="mb-4 flex items-center justify-between">
          <span className="text-mono-label">QUESTION 4 OF 12</span>
        </div>
        <Progress value={33} className="mb-5" />
        <h3 className="text-base font-medium leading-snug text-ink">
          A production API accepts a MongoDB filter object directly from{" "}
          <code className="rounded bg-base-raised px-1 py-0.5 font-mono text-sm">req.query</code>. What is the
          safest approach?
        </h3>
        <div className="mt-4 space-y-2">
          {[
            "Use req.query directly",
            "Allow all MongoDB operators through",
            "Explicitly validate and allow only expected fields",
            "Trust the authenticated user's role",
          ].map((opt, i) => (
            <div
              key={opt}
              className={
                "rounded-md border px-3.5 py-3 text-sm " +
                (i === 2 ? "border-accent/50 bg-accent-muted text-ink" : "border-base-border text-ink-muted")
              }
            >
              {opt}
            </div>
          ))}
        </div>
      </div>

      <p className="mt-6 text-sm font-medium text-ink-muted">Assessment categories</p>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
        {categories.map((c) => (
          <span key={c} className="text-sm text-ink-faint">{c}</span>
        ))}
      </div>
    </div>
  );
}
