import {
  LayoutGrid,
  ShieldHalf,
  ListChecks,
  History,
  UserRound,
  Settings,
  Terminal,
  MessagesSquare,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;

  badge?: "chatUnread";
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const navGroups: NavGroup[] = [
  {
    label: "Learn",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutGrid },
      { to: "/categories", label: "Categories", icon: ShieldHalf },
      { to: "/tests", label: "Assessments", icon: ListChecks },
      { to: "/labs", label: "Labs", icon: Terminal },
    ],
  },
  {
    label: "Social",
    items: [{ to: "/chat", label: "Chat", icon: MessagesSquare, badge: "chatUnread" }],
  },
  {
    label: "Progress",
    items: [
      { to: "/attempts", label: "Attempts", icon: History },
      { to: "/profile", label: "Profile", icon: UserRound },
    ],
  },
  {
    label: "System",
    items: [{ to: "/settings", label: "Settings", icon: Settings }],
  },
];
