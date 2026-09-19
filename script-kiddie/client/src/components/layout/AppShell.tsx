import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";

const titleMap: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/categories": "Categories",
  "/tests": "Assessments",
  "/attempts": "Attempts",
  "/profile": "Profile",
  "/settings": "Settings",
  "/chat": "Chat",
};

function resolveTitle(pathname: string): string {
  const exact = titleMap[pathname];
  if (exact) return exact;
  const base = "/" + pathname.split("/")[1];
  return titleMap[base] ?? "Script Kiddie";
}

export function AppShell() {
  const location = useLocation();
  const userId = useAuthStore((s) => s.user?.id);
  const connect = useChatStore((s) => s.connect);
  const disconnect = useChatStore((s) => s.disconnect);

  useEffect(() => {
    if (!userId) return;
    connect(userId);
    return () => disconnect();
  }, [userId, connect, disconnect]);

  return (
    <div className="flex h-screen w-full bg-base">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header title={resolveTitle(location.pathname)} />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1360px] px-4 py-6 sm:px-6 sm:py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
