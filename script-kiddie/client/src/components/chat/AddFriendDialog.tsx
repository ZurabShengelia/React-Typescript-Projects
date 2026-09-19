import { useEffect, useMemo, useState } from "react";
import { Search, UserPlus, Check, Clock, UserRoundSearch } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useChatStore } from "@/store/chatStore";
import { initials } from "@/lib/utils";
import type { UserSearchResult } from "@/types";

export function AddFriendDialog({ trigger }: { trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [sent, setSent] = useState<string[]>([]);

  const searchUsers = useChatStore((s) => s.searchUsers);
  const sendRequest = useChatStore((s) => s.sendRequest);

  useEffect(() => {
    if (!open) return;
    const query = term.trim();
    if (query.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const found = await searchUsers(query);
        if (!cancelled) setResults(found);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [term, open, searchUsers]);

  useEffect(() => {
    if (!open) {
      setTerm("");
      setResults([]);
      setSent([]);
    }
  }, [open]);

  const state = useMemo(() => {
    const query = term.trim();
    if (query.length < 2) return "prompt" as const;
    if (searching) return "searching" as const;
    if (results.length === 0) return "empty" as const;
    return "results" as const;
  }, [term, searching, results]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogTitle className="text-lg font-semibold text-ink">Add a friend</DialogTitle>
        <DialogDescription className="mt-1 text-sm text-ink-muted">
          Search by display name. They'll get a request they can accept or decline.
        </DialogDescription>

        <div className="relative mt-5">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <Input
            autoFocus
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Start typing a name"
            aria-label="Search users by name"
            className="pl-9"
          />
        </div>

        <div className="mt-4 min-h-[184px]">
          {state === "prompt" && (
            <div className="flex h-[184px] flex-col items-center justify-center rounded-md border border-dashed border-base-border px-6 text-center">
              <UserRoundSearch className="mb-3 h-5 w-5 text-ink-faint" />
              <p className="text-sm text-ink-muted">Enter at least two characters to search.</p>
            </div>
          )}

          {state === "searching" && (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 rounded-md border border-base-border p-3">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
            </div>
          )}

          {state === "empty" && (
            <div className="flex h-[184px] flex-col items-center justify-center rounded-md border border-dashed border-base-border px-6 text-center">
              <p className="text-base font-semibold text-ink">No matches</p>
              <p className="mt-1 text-sm text-ink-muted">
                No verified account starts with “{term.trim()}”. Check the spelling and try again.
              </p>
            </div>
          )}

          {state === "results" && (
            <ul className="space-y-2">
              {results.map((result) => {
                const requested = sent.includes(result.id) || result.relationship === "request_sent";
                return (
                  <li
                    key={result.id}
                    className="flex items-center justify-between gap-3 rounded-md border border-base-border bg-base-raised p-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar>
                        {result.avatarUrl && <AvatarImage src={result.avatarUrl} alt="" />}
                        <AvatarFallback>{initials(result.name)}</AvatarFallback>
                      </Avatar>
                      <span className="truncate text-sm font-medium text-ink">{result.name}</span>
                    </div>

                    {result.relationship === "friends" ? (
                      <span className="flex shrink-0 items-center gap-1.5 text-xs text-ink-faint">
                        <Check className="h-3.5 w-3.5" /> Friends
                      </span>
                    ) : requested ? (
                      <span className="flex shrink-0 items-center gap-1.5 text-xs text-ink-faint">
                        <Clock className="h-3.5 w-3.5" /> Pending
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={async () => {
                          try {
                            await sendRequest(result.id);
                            setSent((ids) => [...ids, result.id]);
                          } catch {

                          }
                        }}
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                        {result.relationship === "request_received" ? "Accept" : "Add"}
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
