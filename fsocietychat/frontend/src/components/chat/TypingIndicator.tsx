import { PenLine } from 'lucide-react';

interface TypingIndicatorProps {
  typingUsernames: string[];
}

export default function TypingIndicator({ typingUsernames }: TypingIndicatorProps) {
  if (typingUsernames.length === 0) {
    return <div className="h-6" />;
  }

  const label =
    typingUsernames.length === 1
      ? `${typingUsernames[0]} is typing…`
      : `${typingUsernames.join(', ')} are typing…`;

  return (
    <div className="flex h-6 items-center gap-1.5 px-5 text-xs text-green-400">
      <PenLine size={12} className="animate-pulse text-green-400" />
      {label}
    </div>
  );
}
