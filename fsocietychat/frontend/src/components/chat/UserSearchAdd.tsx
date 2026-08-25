import React, { useState } from 'react';
import { API_URL } from '../../lib/api';

interface IUser {
  _id: string;
  username: string;
}

export default function UserSearchAdd({
  token,
  selected,
  onAdd,
  onRemove,
  excludeIds,
}: {
  token?: string | null;
  selected: string[];
  onAdd: (user: IUser) => void;
  onRemove: (id: string) => void;
  excludeIds?: string[];
}) {
  const [term, setTerm] = useState('');
  const [results, setResults] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = async () => {
    setError(null);
    const q = term.trim();
    if (!q) return setResults([]);
    if (!token) {
      setError('Not authenticated');
      return setResults([]);
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/users/search?username=${encodeURIComponent(q)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          setError(data.error || 'Authentication required');
        } else {
          setError(data.error || 'Search failed');
        }
        setResults([]);
      } else {
        const raw = data.users || [];
        setResults(raw || []);
      }
    } catch (err) {
      setError('Search failed');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex gap-2">
        <input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Search username..."
          className="flex-1 rounded bg-transparent border border-green-700/50 px-3 py-2 text-sm text-green-100 placeholder-green-400 focus:outline-none focus:ring-2 focus:ring-green-400/20"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              search();
            }
          }}
        />
        <button
          type="button"
          onClick={search}
          className="rounded bg-green-700 hover:bg-green-600 text-black font-bold px-3 py-2"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {error && <div className="mt-2 text-sm text-rose-400">{error}</div>}

      <div className="mt-2 max-h-48 overflow-auto">
        {results
          .filter((u) => !(excludeIds || []).includes(u._id))
          .map((u) => (
          <div key={u._id} className="flex items-center justify-between gap-2 py-1">
            <div className="text-sm text-green-100">{u.username}</div>
            <div>
              {selected.includes(u._id) ? (
                <button
                  type="button"
                  onClick={() => onRemove(u._id)}
                  className="rounded border border-green-700/30 px-2 py-1 text-xs text-green-100"
                >
                  Remove
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onAdd(u)}
                  className="rounded bg-green-600 hover:bg-green-500 px-2 py-1 text-xs text-black font-bold"
                >
                  Add
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
