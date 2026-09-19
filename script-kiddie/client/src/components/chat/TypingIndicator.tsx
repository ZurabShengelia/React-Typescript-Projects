
export function TypingIndicator({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-2 px-4 pb-2" role="status" aria-live="polite">
      <span className="flex items-center gap-1 rounded-md border border-base-border bg-base-panel px-2.5 py-2">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-ink-faint animate-typing-dot"
            style={{ animationDelay: `${i * 160}ms` }}
          />
        ))}
      </span>
      <span className="text-xs text-ink-faint">{name} is typing…</span>
    </div>
  );
}
