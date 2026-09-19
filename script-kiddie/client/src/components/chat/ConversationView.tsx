import { useEffect, useLayoutEffect, useRef } from "react";
import { AlertCircle, ChevronLeft, MessagesSquare, RotateCw, Check, CheckCheck } from "lucide-react";
import { cn, initials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useChatStore } from "@/store/chatStore";
import { useAuthStore } from "@/store/authStore";
import { PresenceDot } from "./PresenceDot";
import { ConnectionStatus } from "./ConnectionStatus";
import { MessageComposer } from "./MessageComposer";
import { TypingIndicator } from "./TypingIndicator";
import type { ChatMessage, Friend } from "@/types";

const time = (iso: string) =>
  new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

const dayLabel = (iso: string) => {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};

function Bubble({
  message,
  mine,
  onRetry,
}: {
  message: ChatMessage;
  mine: boolean;
  onRetry: () => void;
}) {
  return (
    <div className={cn("flex", mine ? "justify-end" : "justify-start")}>
      <div className={cn("max-w-[72%] min-w-0", mine && "flex flex-col items-end")}>
        <div
          className={cn(
            "rounded-md border px-3 py-2 text-base leading-6",
            mine

              ? "border-accent bg-accent text-accent-ink"
              : "border-base-border bg-base-panel text-ink",
            message.pending === "sending" && "opacity-60",
            message.pending === "failed" && "border-danger bg-danger-muted text-ink"
          )}
        >
          <p className="whitespace-pre-wrap break-words">{message.body}</p>
        </div>

        <div className="mt-1 flex items-center gap-1.5 px-0.5 text-xs text-ink-faint">
          {message.pending === "failed" ? (
            <>
              <AlertCircle className="h-3 w-3 text-danger" />
              <span className="text-danger">Not sent</span>
              <button
                type="button"
                onClick={onRetry}
                className="flex items-center gap-1 text-accent hover:underline"
              >
                <RotateCw className="h-3 w-3" /> Retry
              </button>
            </>
          ) : (
            <>
              <time dateTime={message.createdAt}>{time(message.createdAt)}</time>
              {mine && message.pending !== "sending" && (
                message.readAt ? (
                  <CheckCheck className="h-3 w-3" aria-label="Read" />
                ) : (
                  <Check className="h-3 w-3" aria-label="Sent" />
                )
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function ConversationView({ friend, onBack }: { friend: Friend; onBack: () => void }) {
  const selfId = useAuthStore((s) => s.user?.id);
  const messages = useChatStore((s) => s.messages[friend.user.id]);
  const loading = useChatStore((s) => s.loadingThread);
  const hasMore = useChatStore((s) => s.hasMore[friend.user.id]);
  const typing = useChatStore((s) => Boolean(s.typingFrom[friend.user.id]));
  const loadOlder = useChatStore((s) => s.loadOlder);
  const retryMessage = useChatStore((s) => s.retryMessage);

  const scrollRef = useRef<HTMLDivElement>(null);
  const pinnedToBottom = useRef(true);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    pinnedToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el || !pinnedToBottom.current) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, typing]);

  useEffect(() => {
    pinnedToBottom.current = true;
  }, [friend.user.id]);

  const list = messages ?? [];
  let lastDay = "";

  return (
    <section className="flex min-h-0 flex-1 flex-col bg-base">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-base-border bg-base-panel px-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          aria-label="Back to friends"
          className="h-9 w-9 shrink-0 lg:hidden"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <span className="relative shrink-0">
          <Avatar>
            {friend.user.avatarUrl && <AvatarImage src={friend.user.avatarUrl} alt="" />}
            <AvatarFallback>{initials(friend.user.name)}</AvatarFallback>
          </Avatar>
          <PresenceDot online={friend.online} withRing className="absolute -bottom-0.5 -right-0.5" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">{friend.user.name}</p>
          <p className="text-xs text-ink-faint">{friend.online ? "Online" : "Offline"}</p>
        </div>

        <ConnectionStatus />
      </header>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4"
      >
        {loading && list.length === 0 ? (

          <div className="space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className={cn("flex", i % 2 ? "justify-end" : "justify-start")}>
                <Skeleton className={cn("h-10", i % 2 ? "w-48" : "w-64")} />
              </div>
            ))}
          </div>
        ) : list.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-md bg-accent-muted">
              <MessagesSquare className="h-5 w-5 text-accent" />
            </div>
            <h3 className="text-base font-semibold text-ink">No messages yet</h3>
            <p className="mt-1 max-w-xs text-sm text-ink-muted">
              Say hello to {friend.user.name} — messages are delivered instantly while you're both online.
            </p>
          </div>
        ) : (
          <>
            {hasMore && (
              <div className="flex justify-center pb-1">
                <Button size="sm" variant="ghost" onClick={() => loadOlder(friend.user.id)}>
                  Load earlier messages
                </Button>
              </div>
            )}

            {list.map((message) => {
              const day = dayLabel(message.createdAt);
              const showDay = day !== lastDay;
              lastDay = day;
              return (
                <div key={message.clientId ?? message.id} className="space-y-3">
                  {showDay && (
                    <div className="flex items-center gap-3 py-1">
                      <span className="h-px flex-1 bg-base-border" />
                      <span className="font-mono text-xs uppercase tracking-wide text-ink-faint">
                        {day}
                      </span>
                      <span className="h-px flex-1 bg-base-border" />
                    </div>
                  )}
                  <Bubble
                    message={message}
                    mine={message.senderId === selfId}
                    onRetry={() => retryMessage(friend.user.id, message.clientId ?? "")}
                  />
                </div>
              );
            })}
          </>
        )}
      </div>

      {typing && <TypingIndicator name={friend.user.name} />}
      <MessageComposer friendId={friend.user.id} friendName={friend.user.name} />
    </section>
  );
}
