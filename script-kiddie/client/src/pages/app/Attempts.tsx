import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { History } from "lucide-react";
import { api, getErrorMessage } from "@/lib/api";
import type { AttemptSummary, Category } from "@/types";
import { Badge } from "@/components/ui/badge";
import { DifficultyBadge } from "@/components/common/DifficultyBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { TableSkeleton } from "@/components/common/LoadingState";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { formatDate, formatDuration } from "@/lib/utils";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "score_desc", label: "Highest score" },
  { value: "score_asc", label: "Lowest score" },
];

export default function Attempts() {
  const [attempts, setAttempts] = useState<AttemptSummary[] | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("newest");

  useEffect(() => {
    api.get("/categories").then((res) => setCategories(res.data.data));
  }, []);

  useEffect(() => {
    let mounted = true;
    setAttempts(null);
    const params: Record<string, string | number> = { page, limit: 10, sort };
    if (category) params.category = category;

    api
      .get("/attempts", { params })
      .then((res) => {
        if (!mounted) return;
        setAttempts(res.data.data);
        setTotalPages(res.data.meta?.totalPages ?? 1);
      })
      .catch((err) => mounted && setError(getErrorMessage(err)));
    return () => {
      mounted = false;
    };
  }, [page, category, sort]);

  function scoreVariant(score: number): "success" | "warning" | "danger" {
    return score >= 70 ? "success" : score >= 40 ? "warning" : "danger";
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <Select value={category || "all"} onValueChange={(v) => { setCategory(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-56"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(v) => { setSort(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {!attempts ? (
        <TableSkeleton />
      ) : attempts.length === 0 ? (
        <EmptyState
          icon={History}
          title="No assessments completed"
          description={
            category
              ? "No attempts match this filter yet."
              : "Your assessment history will appear here after you complete your first security assessment."
          }
          action={
            !category ? (
              <Button asChild size="sm" variant="secondary">
                <Link to="/tests">Browse assessments</Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          {}
          <div className="hidden overflow-x-auto rounded-md border border-base-border sm:block">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-base-border bg-base-panel text-left text-mono-label">
                  <th className="px-4 py-3">Test</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Difficulty</th>
                  <th className="px-4 py-3">Score</th>
                  <th className="px-4 py-3">Duration</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {attempts.map((a) => (
                  <tr key={a.id} className="border-b border-base-border last:border-0 hover:bg-base-panel">
                    <td className="px-4 py-3 font-medium text-ink">{a.test?.title ?? "Deleted test"}</td>
                    <td className="px-4 py-3 text-ink-muted">{a.test?.category?.name ?? "—"}</td>
                    <td className="px-4 py-3">{a.test && <DifficultyBadge difficulty={a.test.difficulty} />}</td>
                    <td className="px-4 py-3">
                      <Badge variant={scoreVariant(a.score)}>{a.score}%</Badge>
                    </td>
                    <td className="px-4 py-3 text-ink-muted">{formatDuration(a.durationSeconds)}</td>
                    <td className="px-4 py-3 text-ink-muted">{formatDate(a.submittedAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <Button asChild size="sm" variant="ghost">
                        <Link to={`/attempts/${a.id}`}>Review</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {}
          <div className="space-y-3 sm:hidden">
            {attempts.map((a) => (
              <Link
                key={a.id}
                to={`/attempts/${a.id}`}
                className="block rounded-md border border-base-border bg-base-panel p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">{a.test?.title ?? "Deleted test"}</p>
                    <p className="mt-0.5 text-xs text-ink-faint">{a.test?.category?.name ?? "—"}</p>
                  </div>
                  <Badge variant={scoreVariant(a.score)}>{a.score}%</Badge>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-ink-faint">
                  <div className="flex items-center gap-2">
                    {a.test && <DifficultyBadge difficulty={a.test.difficulty} />}
                    <span>{formatDuration(a.durationSeconds)}</span>
                  </div>
                  <span>{formatDate(a.submittedAt)}</span>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span className="text-sm text-ink-faint">Page {page} of {totalPages}</span>
          <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
