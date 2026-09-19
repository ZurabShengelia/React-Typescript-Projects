import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <p className="font-mono text-sm text-ink-faint">404</p>
      <h1 className="mt-2 text-2xl font-semibold text-ink">Page not found</h1>
      <p className="mt-2 max-w-sm text-ink-muted">The page you're looking for doesn't exist or has moved.</p>
      <Button asChild className="mt-6">
        <Link to="/">Back to home</Link>
      </Button>
    </div>
  );
}
