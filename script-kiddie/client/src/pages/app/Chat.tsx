import { useEffect } from "react";
import { MessagesSquare } from "lucide-react";
import { useChatStore } from "@/store/chatStore";
import { FriendsPanel } from "@/components/chat/FriendsPanel";
import { ConversationView } from "@/components/chat/ConversationView";

export default function Chat() {
  const friends = useChatStore((s) => s.friends);
  const activeFriendId = useChatStore((s) => s.activeFriendId);
  const closeConversation = useChatStore((s) => s.closeConversation);
  const loadFriends = useChatStore((s) => s.loadFriends);

  useEffect(() => {
    void loadFriends();
  }, [loadFriends]);

  const activeFriend = friends.find((f) => f.user.id === activeFriendId) ?? null;

  return (

    <div className="flex h-[calc(100vh-10rem)] min-h-[480px] overflow-hidden rounded-md border border-base-border bg-base-panel">
      <FriendsPanel
        className={activeFriend ? "hidden w-full shrink-0 lg:flex lg:w-80" : "flex w-full shrink-0 lg:w-80"}
      />

      {activeFriend ? (
        <ConversationView friend={activeFriend} onBack={closeConversation} />
      ) : (
        <div className="hidden flex-1 flex-col items-center justify-center bg-base px-6 text-center lg:flex">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-md bg-accent-muted">
            <MessagesSquare className="h-5 w-5 text-accent" />
          </div>
          <h3 className="text-base font-semibold text-ink">Select a conversation</h3>
          <p className="mt-1 max-w-sm text-sm text-ink-muted">
            Pick someone from your friends list, or add a new friend to start talking.
          </p>
        </div>
      )}
    </div>
  );
}
