import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ListChecks, Search } from "lucide-react";
import { api, getErrorMessage } from "@/lib/api";
import type { Category, TestSummary } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DifficultyBadge } from "@/components/common/DifficultyBadge";
import { CardGridSkeleton } from "@/components/common/LoadingState";
import { EmptyState } from "@/components/common/EmptyState";
import { Alert } from "@/components/ui/alert";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

const stateLabel: Record<TestSummary["state"], { text: string; variant: "neutral" | "warning" | "success" }> = {
  not_started: { text: "Not started", variant: "neutral" },
  in_progress: { text: "In progress", variant: "warning" },
  completed: { text: "Completed", variant: "success" },
};

export default function Tests() {
  const [params, setParams] = useSearchParams();
  const [tests, setTests] = useState<TestSummary[] | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState(params.get("search") ?? "");

  const category = params.get("category") ?? "";
  const difficulty = params.get("difficulty") ?? "";

  useEffect(() => {
    api.get("/categories").then((res) => setCategories(res.data.data));
  }, []);

  useEffect(() => {
    let mounted = true;
    setTests(null);
    const query: Record<string, string> = {};
    if (category) query.category = category;
    if (difficulty) query.difficulty = difficulty;
    if (search) query.search = search;

    api
      .get("/tests", { params: query })
      .then((res) => mounted && setTests(res.data.data))
      .catch((err) => mounted && setError(getErrorMessage(err)));
    return () => {
      mounted = false;
    };
  }, [category, difficulty, search]);

  function updateParam(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <Input
            placeholder="Search tests…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onBlur={() => updateParam("search", search)}
            onKeyDown={(e) => e.key === "Enter" && updateParam("search", search)}
          />
        </div>
        <Select value={category || "all"} onValueChange={(v) => updateParam("category", v === "all" ? "" : v)}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={difficulty || "all"} onValueChange={(v) => updateParam("difficulty", v === "all" ? "" : v)}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Difficulty" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All difficulties</SelectItem>
            <SelectItem value="easy">Script Kiddie</SelectItem>
            <SelectItem value="medium">Experienced Coder</SelectItem>
            <SelectItem value="hard">Senior Developer</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {!tests ? (
        <CardGridSkeleton />
      ) : tests.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="No tests found"
          description={
            category || difficulty || search
              ? "Try adjusting your filters or search."
              : "No tests exist yet. If you're running this locally, make sure the database has been seeded (`npm run seed` in the server directory)."
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tests.map((t) => (
            <Card key={t.id} className="flex h-full flex-col">
              <CardContent className="flex flex-1 flex-col">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-mono-label">{(t.category?.name ?? "UNCATEGORIZED").toUpperCase()}</span>
                  <Badge variant={stateLabel[t.state].variant}>{stateLabel[t.state].text}</Badge>
                </div>
                <h3 className="mt-2 text-base font-semibold text-ink">{t.title}</h3>
                <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-ink-muted">{t.description}</p>
                <div className="mt-4 flex items-center justify-between text-xs text-ink-faint">
                  <DifficultyBadge difficulty={t.difficulty} />
                  <span>{t.questionCount} questions{t.timeLimitMinutes ? ` · ~${t.timeLimitMinutes} min` : ""}</span>
                </div>
                {t.bestScore !== null && (
                  <p className="mt-2 text-xs text-ink-muted">Best score: <span className="text-ink">{t.bestScore}%</span></p>
                )}
                <Button asChild className="mt-4 w-full" variant={t.state === "not_started" ? "primary" : "secondary"}>
                  <Link to={`/tests/${t.id}`}>
                    {t.state === "not_started" ? "Start test" : t.state === "in_progress" ? "Resume test" : "View test"}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
