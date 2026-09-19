import { Link, Outlet, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { useAuthStore } from "@/store/authStore";
import { LogoLockup } from "@/components/common/Logo";

export function PublicLayout() {
  const { user } = useAuthStore();
  const location = useLocation();
  const isAuthPage = ["/login", "/register", "/forgot-password", "/reset-password"].includes(location.pathname);

  return (
    <div className="flex min-h-screen flex-col bg-base">
      <header className="border-b border-base-border">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-6">
          <Link to="/" aria-label="Script Kiddie home">
            <LogoLockup markClassName="h-8 w-8" />
          </Link>
          {!isAuthPage && (
            <nav className="flex items-center gap-2">
              <ThemeToggle />
              {user ? (
                <Button asChild size="sm">
                  <Link to="/dashboard">Go to dashboard</Link>
                </Button>
              ) : (
                <>
                  <Button asChild variant="ghost" size="sm">
                    <Link to="/login">Log in</Link>
                  </Button>
                  <Button asChild size="sm">
                    <Link to="/register">Create account</Link>
                  </Button>
                </>
              )}
            </nav>
          )}
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-base-border">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-3 px-6 py-6 text-sm text-ink-faint">
          <span>© {new Date().getFullYear()} Script Kiddie. All rights reserved.</span>
          <div className="flex gap-5">
            <Link to="/privacy" className="hover:text-ink-muted">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-ink-muted">Terms &amp; Conditions</Link>
            <Link to="/contact" className="hover:text-ink-muted">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
