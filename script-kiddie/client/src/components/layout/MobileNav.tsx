import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetTrigger, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { navGroups } from "./navItems";
import { useChatStore, selectTotalUnread } from "@/store/chatStore";
import { LogoLockup } from "@/components/common/Logo";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const unread = useChatStore(selectTotalUnread);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation menu">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0">
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <div className="flex h-16 items-center border-b border-base-border px-5">
          <LogoLockup />
        </div>
        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p className="px-3 pb-2 text-xs font-medium uppercase tracking-wider text-ink-faint">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map(({ to, label, icon: Icon, badge }) => (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 rounded-md border-l-2 px-3 py-2.5 text-sm font-medium transition-colors",
                        isActive
                          ? "border-accent bg-accent-muted text-accent"
                          : "border-transparent text-ink-muted hover:bg-base-raised hover:text-ink"
                      )
                    }
                  >
                    <Icon className="h-4 w-4" />
                    <span className="flex-1">{label}</span>
                    {badge === "chatUnread" && unread > 0 && (
                      <span
                        aria-label={`${unread} unread messages`}
                        className="rounded-sm bg-accent px-1.5 py-0.5 font-mono text-xs font-semibold text-accent-ink"
                      >
                        {unread > 99 ? "99+" : unread}
                      </span>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
