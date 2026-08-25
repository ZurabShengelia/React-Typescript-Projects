import React, { useState, useRef, KeyboardEvent, useEffect } from 'react';
import { SendHorizontal } from 'lucide-react';

interface MessageInputProps {
  onSend: (text: string) => void;
  onTyping: () => void;
  disabled?: boolean;
}

export default function MessageInput({ onSend, onTyping, disabled }: MessageInputProps) {
  const [value, setValue] = useState('');
  const lastTypingEmitRef = useRef<number>(0);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [showEmoji, setShowEmoji] = useState(false);

  const EMOJIS = ['😀', '😂', '🙌', '👍', '❤️', '🎉', '😅', '🤔', '😢', '🔥', '🙏', '🥳'];

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);

    const now = Date.now();
    if (now - lastTypingEmitRef.current > 1500) {
      lastTypingEmitRef.current = now;
      onTyping();
    }
  };

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
  };

  const insertAtCursor = (emoji: string) => {
    const el = textareaRef.current;
    if (!el) return setValue((v) => v + emoji);
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    const next = el.value.slice(0, start) + emoji + el.value.slice(end);
    setValue(next);
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + emoji.length;
      el.setSelectionRange(pos, pos);
    });
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="border-t border-green-500/40 bg-black/70 px-3 sm:px-5 py-2 sm:py-3">
      <div className="max-w-6xl mx-auto w-full relative flex items-center gap-3">
        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            rows={1}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={disabled ? 'Select a room to start chatting…' : 'Type a message…'}
            className="min-h-[40px] max-h-40 w-full resize-none rounded-full border border-green-500/40 bg-black/60 px-3 py-2 text-sm text-green-400 outline-none transition-colors placeholder:text-green-600 focus:border-green-500 disabled:opacity-50"
          />
          <button
            type="button"
            onClick={() => setShowEmoji((s) => !s)}
            className="absolute right-10 top-2 text-green-400 hidden sm:block"
            aria-label="Toggle emoji picker"
          >
            😊
          </button>
          {showEmoji && (
            <div className="absolute bottom-12 right-10 sm:right-14 z-50 grid w-48 grid-cols-6 gap-2 rounded bg-black/80 p-2 shadow-lg">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => {
                    insertAtCursor(e);
                    setShowEmoji(false);
                  }}
                  className="text-lg text-green-400"
                >
                  {e}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={submit}
          disabled={disabled || !value.trim()}
          aria-label="Send message"
          className="flex h-10 w-10 md:h-12 md:w-12 shrink-0 items-center justify-center rounded-full bg-green-600 text-black transition-colors hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <SendHorizontal size={18} />
        </button>
      </div>
    </div>
  );
}
