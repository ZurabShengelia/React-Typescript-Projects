import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { api, getErrorMessage } from "@/lib/api";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DetailSkeleton } from "@/components/common/LoadingState";
import { formatDate, initials } from "@/lib/utils";
import { useChatStore } from "@/store/chatStore";

export default function PublicProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const openConversation = useChatStore((s) => s.openConversation);
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    if (!id) return;
    api
      .get(`/profile/${id}`)
      .then((res) => {
        if (!mounted) return;
        setData(res.data.data);
      })
      .catch((err) => {
        if (!mounted) return;
        toast.error(getErrorMessage(err));
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading) return <DetailSkeleton />;
  if (!data) return <div className="mx-auto max-w-3xl">Profile not found</div>;

  const isPrivate = data.privacy?.profileVisibility === "private" && data.stats == null;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="flex items-center gap-5">
        <Avatar className="h-20 w-20 text-xl">
          {data.avatarUrl && <AvatarImage src={data.avatarUrl} alt="" />}
          <AvatarFallback className="text-xl">{initials(data.name)}</AvatarFallback>
        </Avatar>

        <div>
          <h1 className="text-xl font-semibold text-ink">{data.name}</h1>
          <p className="text-sm text-ink-muted">Member since {formatDate(data.createdAt)}</p>
        </div>

        <div className="ml-auto">
          <Button
            onClick={async () => {
              await openConversation(id!);
              navigate("/chat");
            }}
          >
            Open conversation
          </Button>
        </div>
      </div>

      {isPrivate ? (
        <Card>
          <CardHeader>
            <CardTitle>Profile is private</CardTitle>
          </CardHeader>
          <CardContent>
            This user has chosen to keep their profile private.
          </CardContent>
        </Card>
      ) : (
        <div>
          <p className="text-mono-label mb-3">PERFORMANCE</p>
          <div className="grid grid-cols-3 divide-x divide-base-border rounded-md border border-base-border bg-base-panel">
            <div className="px-5 py-4">
              <p className="text-xs text-ink-faint">Completed assessments</p>
              <p className="mt-1.5 text-2xl font-semibold text-ink">{data.stats?.completedTests ?? 0}</p>
            </div>
            <div className="px-5 py-4">
              <p className="text-xs text-ink-faint">Average score</p>
              <p className="mt-1.5 text-2xl font-semibold text-ink">{data.stats?.averageScore ?? 0}%</p>
            </div>
            <div className="px-5 py-4">
              <p className="text-xs text-ink-faint">Strongest category</p>
              <p className="mt-1.5 text-lg font-semibold text-ink">{data.stats?.strongestCategory ?? "—"}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
