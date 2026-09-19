import { useEffect, useRef, useState } from "react";
import { SendHorizonal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChatStore } from "@/store/chatStore";
import { EmojiPicker } from "./EmojiPicker";

const MAX_LENGTH = 4000;

export function MessageComposer({ friendId, friendName }: { friendId: string; friendName: string }) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingRef = useRef(false);
  const stopTimer = useRef<ReturnType<typeof setTimeout>>();

  const sendMessage = useChatStore((s) => s.sendMessage);
  const emitTyping = useChatStore((s) => s.emitTyping);

  useEffect(() => {
    setValue("");
    textareaRef.current?.focus();
  }, [friendId]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 144)}px`;
  }, [value]);

  function signalTyping() {
    if (!typingRef.current) {
      typingRef.current = true;
      emitTyping(friendId, true);
    }
    clearTimeout(stopTimer.current);

    stopTimer.current = setTimeout(() => {
      typingRef.current = false;
      emitTyping(friendId, false);
    }, 1500);
  }

  function stopTyping() {
    clearTimeout(stopTimer.current);
    if (typingRef.current) {
      typingRef.current = false;
      emitTyping(friendId, false);
    }
  }

  useEffect(() => stopTyping, [friendId]);

  function submit() {
    const body = value.trim();
    if (!body) return;
    void sendMessage(friendId, body);
    setValue("");
    stopTyping();
    textareaRef.current?.focus();
  }

  return (
    <div className="shrink-0 border-t border-base-border bg-base-panel px-4 py-3">
      <div className="flex items-end gap-2">
        <label htmlFor="chat-composer" className="sr-only">
          Message {friendName}
        </label>
        <textarea
          id="chat-composer"
          ref={textareaRef}
          rows={1}
          value={value}
          maxLength={MAX_LENGTH}
          placeholder={`Message ${friendName}`}
          onChange={(event) => {
            setValue(event.target.value);
            signalTyping();
          }}
          onBlur={stopTyping}
          onKeyDown={(event) => {

            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              submit();
            }
          }}
          className="max-h-36 min-h-[40px] flex-1 resize-none rounded-md border border-base-border bg-base px-3 py-2 text-base text-ink placeholder:text-ink-faint transition-colors focus-visible:border-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
        />

        <EmojiPicker
          onSelect={(emoji) => {
            setValue((current) => (current + emoji).slice(0, MAX_LENGTH));
            textareaRef.current?.focus();
          }}
        />

        <Button
          type="button"
          size="icon"
          aria-label="Send message"
          disabled={value.trim().length === 0}
          onClick={submit}
          className="h-9 w-9 shrink-0"
        >
          <SendHorizonal className="h-4 w-4" />
        </Button>
      </div>

      {value.length > MAX_LENGTH - 200 && (
        <p className="mt-1.5 text-right text-xs text-ink-faint">
          {MAX_LENGTH - value.length} characters left
        </p>
      )}
    </div>
  );
}
