import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FlaskConical } from "lucide-react";
import { api, getErrorMessage } from "@/lib/api";
import type { Difficulty, LabSummary } from "@/types";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DifficultyBadge } from "@/components/common/DifficultyBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { PageSpinner } from "@/components/common/LoadingState";

const TIER_ORDER: Difficulty[] = ["easy", "medium", "hard"];

export default function Labs() {
  const [labs, setLabs] = useState<LabSummary[]>([]);
  const [acceptance, setAcceptance] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [loaded, setLoaded] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    api
      .get("/labs")
      .then((res) => {
        if (!mounted) return;
        const items = res.data.data as LabSummary[];
        setLabs(items);
        setAcceptance(items.some((lab) => lab.acceptedAup));
        setLoaded(true);
      })
      .catch((err) => mounted && setError(getErrorMessage(err)))
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, [reloadKey]);

  async function handleAcceptAup() {
    try {
      await api.post("/labs/accept-aup");
      setAcceptance(true);
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  const groups = useMemo(
    () =>
      TIER_ORDER.map((tier) => ({ tier, items: labs.filter((lab) => lab.difficulty === tier) })).filter(
        (group) => group.items.length > 0
      ),
    [labs]
  );

  if (loading) return <PageSpinner />;

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-mono-label">LABORATORY</p>
          <h1 className="mt-1 text-2xl font-semibold text-ink">Linux Labs</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-muted">
            Practise Linux fundamentals against a simulated filesystem. Nothing here touches a real machine.
          </p>
        </div>
        <Badge variant="accent">Simulated</Badge>
      </header>

      {!acceptance && (
        <Alert variant="info" className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span>Accept the simulated environment use policy before starting a lab.</span>
          <Button onClick={handleAcceptAup}>Accept policy</Button>
        </Alert>
      )}

      {error && (
        <Alert variant="danger" className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span>{error}</span>
          <Button variant="secondary" onClick={() => setReloadKey((k) => k + 1)}>
            Retry
          </Button>
        </Alert>
      )}

      {!loaded ? null : labs.length === 0 ? (
        <EmptyState
          icon={FlaskConical}
          title="No labs available"
          description="No labs exist yet. If you're running this locally, make sure the database has been seeded (`npm run seed` in the server directory)."
        />
      ) : (
        <div className="space-y-8">
          {groups.map((group) => (
            <section key={group.tier} className="space-y-3">
              <h2 className="text-mono-label">{group.items[0].difficultyLabel.toUpperCase()}</h2>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
                {group.items.map((lab) => (
                  <Link
                    key={lab.slug}
                    to={`/labs/${lab.slug}`}
                    className="flex h-full flex-col rounded-md border border-base-border bg-base-panel p-5 transition-colors hover:border-base-borderStrong hover:bg-base-raised"
                  >
                    <span className="text-mono-label">{lab.category.toUpperCase()}</span>
                    <h3 className="mt-2 text-base font-semibold text-ink">{lab.title}</h3>
                    <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-ink-muted">
                      {lab.description}
                    </p>
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <DifficultyBadge difficulty={lab.difficulty} />
                      <span className="text-xs text-ink-faint">~{lab.estimatedTimeMinutes} min</span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
