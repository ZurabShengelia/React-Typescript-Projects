import React from 'react';
import { Radio, Globe, Users, Lock, LogOut, CircleDot } from 'lucide-react';
import { ChatSection } from '../../types';

interface HeaderProps {
  username: string;
  section: ChatSection;
  onSectionChange: (section: ChatSection) => void;
  isConnected: boolean;
  privateRecipient: string;
  onPrivateRecipientChange: (value: string) => void;
  onLogout: () => void;
}

const sections: { key: ChatSection; label: string; icon: React.ReactNode }[] = [
  { key: 'global', label: 'Global', icon: <Globe size={14} /> },
  { key: 'group', label: 'Group', icon: <Users size={14} /> },
  { key: 'private', label: 'Private', icon: <Lock size={14} /> },
];

export default function Header({
  username,
  section,
  onSectionChange,
  isConnected,
  privateRecipient,
  onPrivateRecipientChange,
  onLogout,
}: HeaderProps) {
  return (
    <header className="flex flex-col gap-3 border-b border-green-500/40 bg-black px-5 py-3 font-mono text-green-400">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md border border-green-500/40 bg-black">
            <img src="/fsociety-logo.jpg" alt="fsociety" className="h-8 w-8 object-cover" />
          </div>
          <div>
            <h1 className="text-sm font-semibold leading-none tracking-tight text-green-400">fsociety chat</h1>
            <p className="mt-0.5 font-mono text-[11px] leading-none text-green-500">{username}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${
              isConnected
                ? 'border-green-500/40 bg-black/40 text-green-400'
                : 'border-red-900/60 bg-black/20 text-red-400'
            }`}
          >
            <CircleDot size={10} className={isConnected ? 'text-green-400' : 'text-red-400'} />
            {isConnected ? 'Connected' : 'Disconnected'}
          </div>

          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 rounded-md border border-green-500/40 px-2.5 py-1.5 text-xs text-green-400 transition-colors hover:border-green-500/60 hover:text-green-300"
            aria-label="Log out"
          >
            <LogOut size={13} />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <nav className="flex gap-1 rounded-md border border-green-500/40 bg-black p-1">
          {sections.map((s) => (
            <button
              key={s.key}
              onClick={() => onSectionChange(s.key)}
              className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                section === s.key
                  ? 'bg-black/40 text-green-300'
                  : 'text-green-500 hover:text-green-300'
              }`}
            >
              {s.icon}
              {s.label}
            </button>
          ))}
        </nav>

        {section === 'private' && (
          <input
            type="text"
            value={privateRecipient}
            onChange={(e) => onPrivateRecipientChange(e.target.value)}
            placeholder="Username to chat with…"
            className="w-56 rounded-md border border-green-500/40 bg-black px-3 py-1.5 text-xs text-green-400 outline-none transition-colors focus:border-green-500"
          />
        )}
      </div>
    </header>
  );
}
