import { Button } from "@/components/ui/button";

export function LabHints({
  hints,
  revealed,
  pendingIndex,
  hintCost,
  onAskReveal,
  onConfirmReveal,
  onCancelReveal,
}: {
  hints: string[];
  revealed: number[];
  pendingIndex: number | null;
  hintCost: number;
  onAskReveal: (index: number) => void;
  onConfirmReveal: (index: number) => void;
  onCancelReveal: () => void;
}) {
  if (hints.length === 0) return null;

  return (
    <section>
      <h2 className="text-mono-label">HINTS</h2>
      <div className="mt-3 divide-y divide-base-border overflow-hidden rounded-md border border-base-border bg-base-panel">
        {hints.map((hint, index) => {
          const isRevealed = revealed.includes(index);
          const isLocked = index > revealed.length;
          const isPending = pendingIndex === index && !isRevealed;

          return (
            <div key={index} className="px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <span className={isRevealed || !isLocked ? "text-sm text-ink" : "text-sm text-ink-faint"}>
                  Hint {index + 1}
                </span>
                {!isRevealed && !isPending && (
                  <Button variant="outline" size="sm" disabled={isLocked} onClick={() => onAskReveal(index)}>
                    {isLocked ? "Locked" : "Reveal"}
                  </Button>
                )}
              </div>

              {isPending && (
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <p className="text-sm text-ink-muted">
                    Revealing costs {hintCost} point{hintCost === 1 ? "" : "s"}.
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => onConfirmReveal(index)}>
                      Reveal
                    </Button>
                    <Button size="sm" variant="ghost" onClick={onCancelReveal}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {isRevealed && <p className="mt-2 text-sm leading-relaxed text-ink-muted">{hint}</p>}
            </div>
          );
        })}
      </div>
    </section>
  );
}
