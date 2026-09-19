import { ShieldCheck } from "lucide-react";

export function SecurityNotePanel() {
  const points = [
    {
      title: "Reset links expire in 1 hour",
      body: "Unused links stop working automatically — request a new one if yours has expired.",
    },
    {
      title: "Single-use tokens",
      body: "A reset link can only be used once. The token is hashed before it's stored, never kept in plain text.",
    },
    {
      title: "We never confirm which emails exist",
      body: "You'll see the same message whether or not an account exists for that address — this prevents account enumeration.",
    },
    {
      title: "All sessions are signed out on reset",
      body: "Successfully resetting your password immediately invalidates every active session on your account.",
    },
  ];

  return (
    <div className="max-w-sm">
      <ShieldCheck className="h-6 w-6 text-accent" />
      <h2 className="mt-4 text-lg font-semibold text-ink">How password reset works here</h2>
      <div className="mt-6 space-y-5">
        {points.map((p) => (
          <div key={p.title}>
            <p className="text-sm font-medium text-ink">{p.title}</p>
            <p className="mt-1 text-sm leading-relaxed text-ink-muted">{p.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
