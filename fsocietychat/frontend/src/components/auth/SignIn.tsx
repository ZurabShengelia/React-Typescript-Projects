import { useState, FormEvent } from 'react';
import { LogIn, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SignInProps {
  onSwitchToSignUp: () => void;
}

export default function SignIn({ onSwitchToSignUp }: SignInProps) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
      <div className="relative rounded-md border border-green-500/50 bg-black/70 p-6" style={{backgroundImage: 'linear-gradient(rgba(0,255,0,0.03) 1px, transparent 1px)', backgroundSize: '100% 8px'}}>
        <div className="flex items-center gap-3 mb-4">
          <img src="/fsociety-logo.jpg" alt="fsociety" className="h-10 w-10 object-cover" />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-green-300">Sign in</h1>
            <p className="mt-1 text-sm text-green-500">Continue to fsociety chat</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-green-500">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-green-500/50 bg-black/60 px-3 py-2.5 text-sm text-green-300 outline-none transition-colors focus:border-green-500"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-green-500">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-green-500/50 bg-black/60 px-3 py-2.5 text-sm text-green-300 outline-none transition-colors focus:border-green-500"
            placeholder="••••••••"
          />
        </div>

          {error && (
            <p className="rounded-md border border-red-900/50 bg-black/40 px-3 py-2 text-sm text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-green-600 px-4 py-2.5 text-sm font-bold text-black transition-colors hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
            Sign in
          </button>
      </form>
        <p className="mt-6 text-center text-sm text-green-500">
          Don&apos;t have an account?{' '}
          <button onClick={onSwitchToSignUp} className="font-medium text-green-400 hover:text-green-300">
            Create one
          </button>
        </p>
      </div>
    </div>
  );
}
