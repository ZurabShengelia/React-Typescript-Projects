import { useEffect, useRef } from 'react';
import { ChatLogEntry } from '../../types';

interface MessageListProps {
  entries: ChatLogEntry[];
  mySocketId: string | null;
  myUsername: string;
}

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function MessageList({ entries, mySocketId, myUsername }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries.length]);

  return (
    <div className="flex-1 flex flex-col space-y-2 overflow-y-auto px-3 sm:px-5 py-3 sm:py-4">
      {entries.length === 0 && (
        <p className="mt-8 text-center text-sm text-green-500">No messages yet — say something.</p>
      )}

      {entries.map((entry) => {
        if (entry.kind === 'status') {
          return (
            <div key={entry.id} className="flex justify-center py-1 z-10">
              <span className="rounded-full border border-green-500/40 bg-black/40 px-3 py-1 text-[11px] text-green-400">
                {entry.data.message}
              </span>
            </div>
          );
        }

        
        const isOwn = entry.data.senderSocketId
          ? entry.data.senderSocketId === mySocketId
          : entry.data.senderUsername === myUsername;

        return (
          <div key={`${entry.data.senderSocketId}-${entry.data.timestamp}-${entry.data.message}`} className={`w-full flex z-10 ${isOwn ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] sm:max-w-[70%] md:max-w-[60%] rounded-md border px-3 py-2 ${
              isOwn
                ? 'border-green-500/40 bg-green-900/20 text-green-200 text-right'
                : 'border-green-500/20 bg-black/30 text-green-400 text-left'
            }`}>
              <div className="mb-1 flex items-center gap-2">
                <span className="text-xs font-medium text-green-300">{entry.data.senderUsername}</span>
                <span className="font-mono text-[10px] text-green-600 hidden sm:inline">{entry.data.senderSocketId.slice(0, 6)}</span>
                <span className="font-mono text-[10px] text-green-600 hidden sm:inline">{formatTimestamp(entry.data.timestamp)}</span>
              </div>
              <p className="whitespace-pre-wrap break-words text-sm">{entry.data.message}</p>
            </div>
          </div>
        );
      })}

      <div ref={bottomRef} />
    </div>
  );
}
