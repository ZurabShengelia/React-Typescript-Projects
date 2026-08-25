import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { createGroup } from '../../lib/groups';
import UserSearchAdd from './UserSearchAdd';
import { API_URL } from '../../lib/api';

export default function CreateGroupForm({ onCreated }: { onCreated?: (group: any) => void }) {
  const { token, user } = useAuth();
  const [selected, setSelected] = useState<{ _id: string; username: string }[]>([]);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAdd = (u: { _id: string; username: string }) => {
    setSelected((prev) => (prev.find((p) => p._id === u._id) ? prev : [...prev, u]));
  };

  const handleRemove = (id: string) => setSelected((prev) => prev.filter((p) => p._id !== id));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return setError('Group name required');
    const members = selected.map((s) => s._id);
    if (members.length === 0) return setError('Select at least one member');

    setLoading(true);
    try {
      const res = await createGroup({ name: name.trim(), members }, token!);
      setName('');
      setSelected([]);
      onCreated?.(res.group);
    } catch (err: any) {
      setError(err.message || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center">
      <form
        onSubmit={submit}
        className="w-full max-w-md bg-black font-mono text-green-200 border border-green-700/40 rounded-lg p-6 space-y-4 shadow-[0_8px_30px_rgba(34,197,94,0.06)]"
      >
        <h3 className="text-lg font-semibold text-green-200">Create Group</h3>

        <div className="space-y-2">
          <label className="block text-sm text-green-300">Group Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter group name"
            className="w-full rounded bg-transparent border border-green-700/50 px-3 py-2 text-sm text-green-100 placeholder-green-400 focus:outline-none focus:ring-2 focus:ring-green-400/20"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm text-green-300">Add Members</label>
          <UserSearchAdd token={token!} selected={selected.map((s) => s._id)} onAdd={handleAdd} onRemove={handleRemove} />

          <div className="mt-2 flex flex-wrap gap-2">
            {selected.map((u) => (
              <span
                key={u._id}
                className="inline-flex items-center gap-2 rounded border border-green-700/30 bg-transparent/20 px-2 py-1 text-sm text-green-100"
              >
                <span>{u.username}</span>
                <button
                  type="button"
                  onClick={() => handleRemove(u._id)}
                  className="text-rose-400 hover:text-rose-300"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        </div>

        {error && <div className="text-sm text-rose-400">{error}</div>}

        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-green-600 hover:bg-green-500 text-black font-bold px-3 py-2 disabled:opacity-60"
          >
            {loading ? 'Creating…' : 'Create Group'}
          </button>
        </div>
      </form>
    </div>
  );
}
