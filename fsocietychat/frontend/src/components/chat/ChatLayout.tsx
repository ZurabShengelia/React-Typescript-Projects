import { useEffect, useRef, useState, useCallback } from 'react';
import Header from './Header';
import CreateGroupForm from './CreateGroupForm';
import AddGroupMembers from './AddGroupMembers';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import TypingIndicator from './TypingIndicator';
import { useAuth } from '../../context/AuthContext';
import { connectSocket, disconnectSocket, ChatSocket } from '../../lib/socket';
import {
  ChatSection,
  ChatLogEntry,
  ReceiveMessagePayload,
  UserStatusPayload,
  DisplayTypingPayload,
} from '../../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

function getPrivateRoomName(userA: string, userB: string): string {
  const [first, second] = [userA, userB].sort();
  return `private:${first}:${second}`;
}

function roomForSection(
  section: ChatSection,
  myUsername: string,
  privateRecipient: string,
  selectedGroupId: string | null
): string | null {
  if (section === 'global') return 'global';
  if (section === 'group') {
    return selectedGroupId ? `group:${selectedGroupId}` : null;
  }
  if (section === 'private') {
    const target = privateRecipient.trim();
    if (!target || target === myUsername) return null;
    return getPrivateRoomName(myUsername, target);
  }
  return null;
}

export default function ChatLayout() {
  const { token, user, logout } = useAuth();
  const [showIntro, setShowIntro] = useState(true);
  const [section, setSection] = useState<ChatSection>('global');
  const [privateRecipient, setPrivateRecipient] = useState('');
  const [groups, setGroups] = useState<{ _id: string; name: string }[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [activeGroupDetails, setActiveGroupDetails] = useState<any | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [mySocketId, setMySocketId] = useState<string | null>(null);
  const [entries, setEntries] = useState<ChatLogEntry[]>([]);
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({});

  const socketRef = useRef<ChatSocket | null>(null);
  const currentRoomRef = useRef<string | null>(null);
  const typingTimeoutsRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const room = user ? roomForSection(section, user.username, privateRecipient, selectedGroupId) : null;

  useEffect(() => {
    if (!token) return;
    try {
      const last = localStorage.getItem('nocturne_lastRoom');
      if (last && user) {
        if (last === 'global') {
          setSection('global');
        } else if (last.startsWith('group:')) {
          const id = last.split(':')[1];
          setSection('group');
          setSelectedGroupId(id);
        } else if (last.startsWith('private:')) {
          const parts = last.split(':');
          const other = parts[1] === user.username ? parts[2] : parts[1];
          setSection('private');
          setPrivateRecipient(other);
        }
      }
    } catch (err) {}

    const socket = connectSocket(token);
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      setMySocketId(socket.id ?? null);
      if (currentRoomRef.current) {
        socket.emit('join_room', { room: currentRoomRef.current });
      }
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('receive_message', (payload: ReceiveMessagePayload) => {
      if (payload.room !== currentRoomRef.current) return;
      setEntries((prev) => [...prev, { kind: 'message', data: payload }]);
    });

    socket.on('user_status', (payload: UserStatusPayload) => {
      if (payload.room !== currentRoomRef.current) return;
      setEntries((prev) => [
        ...prev,
        { kind: 'status', data: payload, id: `${Date.now()}-${Math.random()}` },
      ]);
    });

    socket.on('display_typing', (payload: DisplayTypingPayload) => {
      setTypingUsers((prev) => ({ ...prev, [payload.socketId]: payload.username }));
      clearTimeout(typingTimeoutsRef.current[payload.socketId]);
      typingTimeoutsRef.current[payload.socketId] = setTimeout(() => {
        setTypingUsers((prev) => {
          const next = { ...prev };
          delete next[payload.socketId];
          return next;
        });
      }, 2500);
    });

    socket.on('group_members_added', (payload: { groupId: string; added: string[] }) => {
      fetch(`${API_URL}/api/groups`, { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => res.json())
        .then((data: { groups: any[] }) => {
          const groups = (data.groups || []).map((g: any) => ({ _id: g._id?.toString?.() ?? g._id, name: g.name }));
          setGroups(groups);
        })
        .catch(() => {});

      if (activeGroupDetails && activeGroupDetails._id === payload.groupId) {
        fetch(`${API_URL}/api/groups/${payload.groupId}`, { headers: { Authorization: `Bearer ${token}` } })
          .then((res) => res.json())
          .then((data) => {
            const grp = data.group;
            const normalized = {
              ...grp,
              members: Array.isArray(grp.members) ? grp.members.map((m: any) => m.toString()) : [],
              _id: grp._id?.toString?.() ?? grp._id,
            };
            setActiveGroupDetails(normalized);
          })
          .catch(() => {});
      }
    });

    socket.on('added_to_group', (payload: { groupId: string; group: any }) => {
      fetch(`${API_URL}/api/groups`, { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => res.json())
        .then((data: { groups: any[] }) => {
          const groups = (data.groups || []).map((g: any) => ({ _id: g._id?.toString?.() ?? g._id, name: g.name }));
          setGroups(groups);
        })
        .catch(() => {});
    });

    return () => {
      disconnectSocket();
      socketRef.current = null;
    };
  }, [token]);

  useEffect(() => {
    currentRoomRef.current = room;
    try {
      if (room) localStorage.setItem('nocturne_lastRoom', room);
      else localStorage.removeItem('nocturne_lastRoom');
    } catch (err) {}
    setEntries([]);
    setTypingUsers({});

    if (!room || !socketRef.current || !token) return;

    socketRef.current.emit('join_room', { room });

    fetch(`${API_URL}/api/messages/${encodeURIComponent(room)}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data: { messages: { senderUsername: string; room: string; text: string; timestamp: string }[] }) => {
        if (currentRoomRef.current !== room) return;
        const history: ChatLogEntry[] = data.messages.map((m) => ({
          kind: 'message',
          data: {
            message: m.text,
            senderSocketId: '',
            senderUsername: m.senderUsername,
            room: m.room,
            timestamp: m.timestamp,
          },
        }));
        setEntries(history);
      })
      .catch((err) => console.error('Failed to load message history:', err));
  }, [room, token]);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/api/groups`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data: { groups: { _id: any; name: string }[] }) => {
        const groups = (data.groups || []).map((g: any) => ({ _id: g._id?.toString?.() ?? g._id, name: g.name }));
        setGroups(groups);
        if (groups.length > 0) {
          setSelectedGroupId((prev) => prev || groups[0]._id);
        }
      })
      .catch((err) => console.error('Failed to load groups:', err));
  }, [token]);

  const openManageModal = async (groupId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/groups/${groupId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load group');
      const grp = data.group;
      const normalized = {
        ...grp,
        members: Array.isArray(grp.members) ? grp.members.map((m: any) => m.toString()) : [],
        _id: grp._id?.toString?.() ?? grp._id,
      };
      setActiveGroupDetails(normalized);
      setIsManageModalOpen(true);
    } catch (err) {
      console.error('Failed to load group details:', err);
    }
  };

  const handleSend = useCallback(
    (text: string) => {
      if (!room || !socketRef.current) return;
      socketRef.current.emit('send_message', { room, message: text });
    },
    [room]
  );

  const handleTyping = useCallback(() => {
    if (!room || !socketRef.current) return;
    socketRef.current.emit('typing', { room });
  }, [room]);

  useEffect(() => {
    const t = setTimeout(() => setShowIntro(false), 2000);
    return () => clearTimeout(t);
  }, []);

  if (!user) return null;

  return (
    <div className="flex h-screen flex-col bg-black font-mono text-green-400">
      {showIntro && (
        <div className="intro-matrix scanlines">
          <div className="text-center">
            <pre className="matrix-text text-lg sm:text-2xl">Initializing fsociety…</pre>
          </div>
        </div>
      )}
      <Header
        username={user.username}
        section={section}
        onSectionChange={setSection}
        isConnected={isConnected}
        privateRecipient={privateRecipient}
        onPrivateRecipientChange={setPrivateRecipient}
        onLogout={() => {
          disconnectSocket();
          logout();
        }}
      />
      <div className="flex-1 relative flex flex-col">
        <div className="fs-watermark z-0" aria-hidden="true">
          <img src="/fsociety-watermark.jpg" alt="fsociety watermark" />
        </div>
        <MessageList entries={entries} mySocketId={mySocketId} myUsername={user.username} />
        <TypingIndicator typingUsernames={Object.values(typingUsers)} />

        {section === 'group' && (
          <div className="px-5 py-3">
            <label className="text-xs text-slate-400">Select group</label>
            <div className="mt-2">
              <select
                value={selectedGroupId ?? ''}
                onChange={(e) => setSelectedGroupId(e.target.value || null)}
                className="rounded-md border border-obsidian-700 bg-obsidian-900 px-3 py-1 text-sm text-slate-200"
              >
                <option value="">-- choose a group --</option>
                {groups.map((g) => (
                  <option key={g._id} value={g._id}>
                    {g.name}
                  </option>
                ))}
              </select>
              <button
                onClick={() => selectedGroupId && openManageModal(selectedGroupId)}
                className="ml-2 rounded bg-obsidian-800 px-3 py-1 text-sm text-slate-200"
              >
                Manage
              </button>
            </div>
          </div>
        )}

        {section === 'group' && (
          <div className="border-t border-obsidian-700 bg-obsidian-900/40">
            <CreateGroupForm
              onCreated={(g) => {
                fetch(`${API_URL}/api/groups`, { headers: { Authorization: `Bearer ${token}` } })
                  .then((res) => res.json())
                  .then((data) => setGroups(data.groups || []))
                  .catch(() => {});
              }}
            />
          </div>
        )}
      </div>

      <MessageInput onSend={handleSend} onTyping={handleTyping} disabled={!room} />

      {isManageModalOpen && activeGroupDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-[640px] max-w-full rounded bg-obsidian-950 p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-100">Manage Group: {activeGroupDetails.name}</h2>
              <button onClick={() => setIsManageModalOpen(false)} className="text-slate-400">Close</button>
            </div>
            <div className="mt-4">
              <AddGroupMembers
                group={activeGroupDetails}
                onDone={(g) => {
                  setIsManageModalOpen(false);
                  fetch(`${API_URL}/api/groups`, { headers: { Authorization: `Bearer ${token}` } })
                    .then((res) => res.json())
                    .then((data) => setGroups(data.groups || []))
                    .catch(() => {});
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
