import { useEffect, useRef, useState } from "react";
import { Smile } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const GROUPS: Array<{ label: string; emoji: string[] }> = [
  {
    label: "Smileys",
    emoji: ["😀", "😄", "😅", "😂", "🙂", "😉", "😊", "😍", "😎", "🤔", "😴", "😭", "😤", "😱", "🤯", "🫡"],
  },
  { label: "Gestures", emoji: ["👍", "👎", "👌", "🙌", "👏", "🤝", "💪", "🫶", "🙏", "👀", "🖖", "✌️"] },
  { label: "Work", emoji: ["💻", "⌨️", "🖥️", "🔧", "🧰", "📎", "📌", "📝", "📊", "⏱️", "📦", "🗂️"] },
  { label: "Security", emoji: ["🔒", "🔓", "🔑", "🛡️", "🚩", "🐛", "⚠️", "🧨", "🕵️", "👾", "🧪", "📡"] },
  { label: "Reactions", emoji: ["🔥", "✅", "❌", "⭐", "💡", "🎯", "🎉", "💯", "☕", "🍕", "🧠", "⚡"] },
  { label: "Hearts", emoji: ["❤️", "🧡", "💚", "💙", "🖤", "💔", "💬", "💭"] },
];

export function EmojiPicker({ onSelect, disabled }: { onSelect: (emoji: string) => void; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <Button
        ref={triggerRef}
        type="button"
        variant="ghost"
        size="icon"
        disabled={disabled}
        aria-label="Insert emoji"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((value) => !value)}
        className={cn("h-9 w-9 shrink-0", open && "bg-base-raised text-ink")}
      >
        <Smile className="h-4 w-4" />
      </Button>

      {open && (
        <div
          role="dialog"
          aria-label="Emoji"
          className="absolute bottom-11 right-0 z-40 w-72 rounded-md border border-base-border bg-base-panel p-3 shadow-pop"
        >
          <div className="max-h-64 space-y-3 overflow-y-auto">
            {GROUPS.map((group) => (
              <div key={group.label}>
                <p className="px-1 pb-1.5 text-xs font-medium uppercase tracking-wider text-ink-faint">
                  {group.label}
                </p>
                <div className="grid grid-cols-8 gap-0.5">
                  {group.emoji.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      aria-label={emoji}
                      onClick={() => {
                        onSelect(emoji);
                        setOpen(false);
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded text-[17px] leading-none transition-colors hover:bg-base-raised focus-visible:bg-base-raised"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
