import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import UserSearchAdd from './UserSearchAdd';
import { API_URL } from '../../lib/api';

export default function GroupAddMembersForm({
  group,
  onUpdated,
}: {
  group: { _id: string; name: string; members: string[] };
  onUpdated?: (group: any) => void;
}) {
  const { token } = useAuth();
  const [selected, setSelected] = useState<{ _id: string; username: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = (u: { _id: string; username: string }) => {
    setSelected((prev) => (prev.find((p) => p._id === u._id) ? prev : [...prev, u]));
  };
  const handleRemove = (id: string) => setSelected((prev) => prev.filter((p) => p._id !== id));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (selected.length === 0) return setError('Select at least one member to add');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/groups/${group._id}/members`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ members: selected.map((s) => s._id) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add members');
      setSelected([]);
      onUpdated?.(data.group || data);
    } catch (err: any) {
      setError(err.message || 'Failed to add members');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="p-4">
      <h3 className="mb-2 text-sm font-semibold text-slate-200">Add members to {group.name}</h3>
      <UserSearchAdd
        token={token!}
        selected={selected.map((s) => s._id)}
        onAdd={handleAdd}
        onRemove={handleRemove}
        excludeIds={group.members}
      />

      <div className="mt-2 flex flex-wrap gap-2">
        {selected.map((u) => (
          <span key={u._id} className="inline-flex items-center gap-2 rounded bg-obsidian-800 px-2 py-1 text-sm text-slate-200">
            <span>{u.username}</span>
            <button type="button" onClick={() => handleRemove(u._id)} className="text-rose-400">✕</button>
          </span>
        ))}
      </div>

      {error && <div className="mb-2 text-sm text-rose-400">{error}</div>}

      <div className="mt-3">
        <button type="submit" disabled={loading} className="rounded bg-accent px-3 py-2 text-sm text-white">
          {loading ? 'Adding...' : 'Add Selected Members'}
        </button>
      </div>
    </form>
  );
}
