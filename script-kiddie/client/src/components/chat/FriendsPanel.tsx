import { useState } from "react";
import { UserPlus, Users, Inbox, MoreHorizontal, UserMinus, MessageSquare, Trash2 } from "lucide-react";
import { cn, initials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useChatStore, selectIncomingRequests } from "@/store/chatStore";
import { PresenceDot } from "./PresenceDot";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AddFriendDialog } from "./AddFriendDialog";
import { useNavigate } from "react-router-dom";
import type { Friend, FriendRequest } from "@/types";

type Tab = "friends" | "requests";

function TabButton({
  active,
  count,
  children,
  onClick,
}: {
  active: boolean;
  count?: number;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex flex-1 items-center justify-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
        active
          ? "border-accent text-ink"
          : "border-transparent text-ink-muted hover:text-ink"
      )}
    >
      {children}
      {typeof count === "number" && count > 0 && (
        <span className="rounded-sm bg-accent-muted px-1.5 py-0.5 font-mono text-xs text-accent">{count}</span>
      )}
    </button>
  );
}

function FriendRow({
  friend,
  active,
  typing,
  onOpen,
  onRemove,
  onView,
  onDeleteConversation,
}: {
  friend: Friend;
  active: boolean;
  typing: boolean;
  onOpen: () => void;
  onRemove: () => void;
  onView: () => void;
  onDeleteConversation: () => void;
}) {
  const preview = friend.lastMessage ? (friend.lastMessage.fromSelf ? `You: ${friend.lastMessage.body}` : friend.lastMessage.body) : "No messages yet";

  return (
    <li className="group">
      <div
        className={cn(
          "flex w-full items-center gap-3 rounded-md border-l-2 px-3 py-2.5 transition-colors",
          active ? "border-accent bg-accent-muted" : "border-transparent hover:bg-base-raised"
        )}
      >
        {}
        <button type="button" onClick={onOpen} className="flex min-w-0 flex-1 items-center gap-3 text-left">
          <span className="relative shrink-0">
            <Avatar>
              {friend.user.avatarUrl && <AvatarImage src={friend.user.avatarUrl} alt="" />}
              <AvatarFallback>{initials(friend.user.name)}</AvatarFallback>
            </Avatar>
            {}
            <PresenceDot online={friend.online} withRing className="absolute -bottom-0.5 -right-0.5" />
          </span>

          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2">
              <span className="truncate text-sm font-medium text-ink">{friend.user.name}</span>
              {friend.unread > 0 && (
                <span className="shrink-0 rounded-sm bg-accent px-1.5 py-0.5 font-mono text-xs font-semibold text-accent-ink">
                  {friend.unread > 99 ? "99+" : friend.unread}
                </span>
              )}
            </span>
            <span
              className={cn(
                "mt-0.5 block truncate text-xs",
                typing ? "text-accent" : friend.unread > 0 ? "text-ink-muted" : "text-ink-faint"
              )}
            >
              {typing ? "typing…" : preview}
            </span>
          </span>
        </button>

        {}
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onOpen}
            className="inline-flex items-center gap-1.5 rounded bg-accent px-2.5 py-1.5 text-xs font-medium text-accent-ink"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Open
          </button>
          <button
            type="button"
            onClick={onView}
            className="inline-flex items-center rounded border border-base-border px-2.5 py-1.5 text-xs text-ink-muted transition-colors hover:text-ink"
          >
            View profile
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label={`Options for ${friend.user.name}`}
              className="rounded p-1.5 text-ink-faint opacity-0 transition-opacity hover:bg-base-panel hover:text-ink focus-visible:opacity-100 group-hover:opacity-100"
            >
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onOpen}>
                <MessageSquare className="h-4 w-4" /> Open conversation
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onRemove}>
                <UserMinus className="h-4 w-4" /> Remove friend
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDeleteConversation} className="text-danger hover:bg-danger-muted">
                <Trash2 className="h-4 w-4" />
                Delete conversation
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </li>
  );
}

function RequestRow({ request }: { request: FriendRequest }) {
  const respond = useChatStore((s) => s.respondToRequest);
  const incoming = request.direction === "incoming";

  return (
    <li className="flex items-center gap-3 rounded-md border border-base-border bg-base-raised p-3">
      <Avatar>
        {request.user.avatarUrl && <AvatarImage src={request.user.avatarUrl} alt="" />}
        <AvatarFallback>{initials(request.user.name)}</AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">{request.user.name}</p>
        <p className="text-xs text-ink-faint">{incoming ? "Wants to connect" : "Request sent"}</p>
      </div>

      {incoming ? (
        <div className="flex shrink-0 gap-2">
          <Button size="sm" onClick={() => respond(request.id, true)}>
            Accept
          </Button>
          <Button size="sm" variant="outline" onClick={() => respond(request.id, false)}>
            Decline
          </Button>
        </div>
      ) : (
        <Button size="sm" variant="ghost" onClick={() => respond(request.id, false)}>
          Cancel
        </Button>
      )}
    </li>
  );
}

export function FriendsPanel({ className }: { className?: string }) {
  const [tab, setTab] = useState<Tab>("friends");
  const friends = useChatStore((s) => s.friends);
  const requests = useChatStore((s) => s.requests);
  const loading = useChatStore((s) => s.loadingFriends);
  const activeFriendId = useChatStore((s) => s.activeFriendId);
  const typingFrom = useChatStore((s) => s.typingFrom);
  const openConversation = useChatStore((s) => s.openConversation);
  const removeFriend = useChatStore((s) => s.removeFriend);
  const incoming = useChatStore(selectIncomingRequests);
  const deleteConversation = useChatStore((s) => s.deleteConversation);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteFriend, setPendingDeleteFriend] = useState<string | null>(null);

  function handleOpenDelete(friendId: string) {
    setPendingDeleteFriend(friendId);
    setConfirmOpen(true);
  }

  async function handleConfirmDelete() {
    if (!pendingDeleteFriend) return;
    try {
      await deleteConversation(pendingDeleteFriend);
      setConfirmOpen(false);
      setPendingDeleteFriend(null);
    } catch {

    }
  }

  const navigate = useNavigate();

  return (
    <div className={cn("flex min-h-0 flex-col border-r border-base-border bg-base-panel", className)}>
      <div className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-base-border px-4">
        <h2 className="text-base font-semibold text-ink">Friends</h2>
        <AddFriendDialog
          trigger={
            <Button size="sm" variant="secondary" aria-label="Add a friend">
              <UserPlus className="h-3.5 w-3.5" />
              Add
            </Button>
          }
        />
      </div>

      <div className="flex shrink-0 border-b border-base-border">
        <TabButton active={tab === "friends"} onClick={() => setTab("friends")}>
          <Users className="h-4 w-4" />
          All
        </TabButton>
        <TabButton active={tab === "requests"} count={incoming} onClick={() => setTab("requests")}>
          <Inbox className="h-4 w-4" />
          Requests
        </TabButton>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {tab === "friends" &&
          (loading ? (
            <div className="space-y-1 p-1">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-2 py-2.5">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-28" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                </div>
              ))}
            </div>
          ) : friends.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-base-border px-6 py-12 text-center">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-md bg-accent-muted">
                <Users className="h-5 w-5 text-accent" />
              </div>
              <h3 className="text-base font-semibold text-ink">No friends yet</h3>
              <p className="mt-1 text-sm text-ink-muted">
                Find someone by name and send them a request to start a conversation.
              </p>
              <AddFriendDialog
                trigger={
                  <Button size="sm" className="mt-5">
                    <UserPlus className="h-3.5 w-3.5" />
                    Add a friend
                  </Button>
                }
              />
            </div>
          ) : (
            <ul className="space-y-0.5">
              {friends.map((friend) => (
                <FriendRow
                  key={friend.user.id}
                  friend={friend}
                  active={activeFriendId === friend.user.id}
                  typing={Boolean(typingFrom[friend.user.id])}
                  onOpen={() => openConversation(friend.user.id)}
                  onRemove={() => removeFriend(friend.user.id)}
                  onView={() => navigate(`/profile/${friend.user.id}`)}
                  onDeleteConversation={() => handleOpenDelete(friend.user.id)}
                />
              ))}
            </ul>
          ))}

        {tab === "requests" &&
          (requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-base-border px-6 py-12 text-center">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-md bg-accent-muted">
                <Inbox className="h-5 w-5 text-accent" />
              </div>
              <h3 className="text-base font-semibold text-ink">No pending requests</h3>
              <p className="mt-1 text-sm text-ink-muted">
                Incoming and outgoing friend requests will appear here.
              </p>
            </div>
          ) : (
            <ul className="space-y-2 p-1">
              {requests.map((request) => (
                <RequestRow key={request.id} request={request} />
              ))}
            </ul>
          ))}
      </div>
    </div>
  );
}
