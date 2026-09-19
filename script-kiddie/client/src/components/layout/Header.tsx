import { useNavigate } from "react-router-dom";
import { LogOut, Settings, UserRound } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { initials } from "@/lib/utils";
import { MobileNav } from "./MobileNav";
import { ThemeToggle } from "@/components/common/ThemeToggle";

export function Header({ title }: { title: string }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <header className="flex h-16 items-center justify-between gap-3 border-b border-base-border bg-base px-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-2">
        <MobileNav />
        <h1 className="truncate text-lg font-semibold text-ink">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-base-raised">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium text-ink leading-tight">{user?.name}</div>
              <div className="text-xs text-ink-faint leading-tight">{user?.email}</div>
            </div>
            <Avatar>
              {user?.avatarUrl && <AvatarImage src={user.avatarUrl} alt="" />}
              <AvatarFallback>{user ? initials(user.name) : "?"}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate("/profile")}>
              <UserRound className="h-4 w-4" /> Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/settings")}>
              <Settings className="h-4 w-4" /> Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="h-4 w-4" /> Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
