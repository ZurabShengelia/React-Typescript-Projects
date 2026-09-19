import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, ShieldHalf } from "lucide-react";
import { api, getErrorMessage } from "@/lib/api";
import type { Category } from "@/types";
import { TableSkeleton } from "@/components/common/LoadingState";
import { EmptyState } from "@/components/common/EmptyState";
import { Alert } from "@/components/ui/alert";

export default function Categories() {
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    api
      .get("/categories")
      .then((res) => mounted && setCategories(res.data.data))
      .catch((err) => mounted && setError(getErrorMessage(err)));
    return () => {
      mounted = false;
    };
  }, []);

  if (error) return <Alert variant="danger">{error}</Alert>;
  if (!categories) return <TableSkeleton rows={8} />;

  if (categories.length === 0) {
    return (
      <EmptyState
        icon={ShieldHalf}
        title="No categories yet"
        description="Categories will appear here once they are added to the platform."
      />
    );
  }

  return (
    <div className="divide-y divide-base-border rounded-md border border-base-border bg-base-panel">
      {categories.map((c) => (
        <Link
          key={c.id}
          to={`/tests?category=${c.id}`}
          className="flex items-center justify-between gap-6 px-5 py-4 transition-colors hover:bg-base-raised"
        >
          <div className="min-w-0">
            <p className="text-base font-medium text-ink">{c.name}</p>
            <p className="mt-1 text-sm leading-relaxed text-ink-muted">{c.description}</p>
          </div>
          <div className="flex shrink-0 items-center gap-5">
            <div className="hidden text-right sm:block">
              {c.performance ? (
                <>
                  <p className="text-sm font-medium text-ink">{c.performance.averageScore}% avg</p>
                  <p className="text-xs text-ink-faint">
                    {c.performance.attempts} attempt{c.performance.attempts === 1 ? "" : "s"}
                  </p>
                </>
              ) : (
                <p className="text-xs text-ink-faint">Not yet assessed</p>
              )}
            </div>
            <span className="text-sm text-ink-faint">
              {c.testCount} assessment{c.testCount === 1 ? "" : "s"}
            </span>
            <ChevronRight className="h-4 w-4 text-ink-faint" />
          </div>
        </Link>
      ))}
    </div>
  );
}
