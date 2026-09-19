import { useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";

export function LabTerminal({
  output,
  currentPath,
  value,
  onChange,
  onSubmit,
  disabled = false,
}: {
  output: string[];
  currentPath: string;
  value: string;
  onChange: (next: string) => void;
  onSubmit: (command: string) => void;
  disabled?: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [output]);

  return (
    <section
      className="flex min-h-[420px] flex-col overflow-hidden rounded-md border border-base-border bg-terminal"
      aria-label="Simulated terminal"
    >
      <header className="flex items-center justify-between gap-3 border-b border-base-border px-4 py-2.5">
        <span className="text-mono-label">TERMINAL</span>
        <Badge variant="accent">Simulated</Badge>
      </header>

      {}
      <div
        ref={scrollRef}
        onClick={() => inputRef.current?.focus()}
        className="flex-1 overflow-y-auto px-4 py-3 font-mono text-sm leading-relaxed text-terminal-ink"
      >
        <div className="space-y-0.5 whitespace-pre-wrap break-words">
          {output.map((line, idx) => (
            <div key={idx}>{line}</div>
          ))}
        </div>

        <div className="mt-0.5 flex items-baseline gap-2">
          <span className="shrink-0 select-none text-ink-faint">student@script-kiddie:~$</span>
          <input
            ref={inputRef}
            value={value}
            disabled={disabled}
            spellCheck={false}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            aria-label="Terminal command"
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              e.preventDefault();
              onSubmit(value);
            }}
            className="w-full flex-1 border-0 bg-transparent p-0 font-mono text-sm text-terminal-ink caret-accent outline-none focus:outline-none focus-visible:outline-none disabled:opacity-50"
          />
        </div>
      </div>

      <footer className="flex items-center justify-between gap-3 border-t border-base-border px-4 py-2 font-mono text-xs text-ink-faint">
        <span>{currentPath}</span>
        <span>try: ls -a · cat &lt;file&gt; · chmod 644 &lt;file&gt; · pwd</span>
      </footer>
    </section>
  );
}
