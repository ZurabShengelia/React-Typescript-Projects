import { useChatStore } from "@/store/chatStore";

export function ConnectionStatus() {
  const connection = useChatStore((s) => s.connection);
  if (connection === "online") return null;

  const label =
    connection === "reconnecting"
      ? "Reconnecting…"
      : connection === "connecting"
        ? "Connecting…"
        : "Offline";

  return (
    <span className="flex items-center gap-1.5 text-xs text-ink-faint" role="status" aria-live="polite">
      <span className="h-1.5 w-1.5 rounded-full bg-warning" />
      {label}
    </span>
  );
}
