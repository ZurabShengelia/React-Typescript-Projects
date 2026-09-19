import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { api, getErrorMessage } from "@/lib/api";
import type { TestDetail as TestDetailType } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DifficultyBadge } from "@/components/common/DifficultyBadge";
import { PageSpinner } from "@/components/common/LoadingState";
import { Alert } from "@/components/ui/alert";
import { formatDate } from "@/lib/utils";

export default function TestDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [test, setTest] = useState<TestDetailType | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    api
      .get(`/tests/${id}`)
      .then((res) => mounted && setTest(res.data.data))
      .catch((err) => mounted && setError(getErrorMessage(err)));
    return () => {
      mounted = false;
    };
  }, [id]);

  if (error) return <Alert variant="danger">{error}</Alert>;
  if (!test) return <PageSpinner />;

  const submittedAttempts = test.attempts.filter((a) => a.status === "submitted");
  const metadata = [
    { label: "Security domain", value: test.category.name },
    { label: "Difficulty", value: test.difficultyLabel },
    { label: "Questions", value: String(test.questionCount) },
    { label: "Estimated time", value: test.timeLimitMinutes ? `${test.timeLimitMinutes} min` : "Untimed" },
  ];

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/tests" className="mb-6 inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Back to tests
      </Link>

      <div className="flex items-center gap-2">
        <DifficultyBadge difficulty={test.difficulty} />
        <span className="text-sm text-ink-faint">{test.category.name}</span>
      </div>
      <h1 className="mt-3 text-2xl font-semibold text-ink">{test.title}</h1>
      <p className="mt-3 text-base leading-relaxed text-ink-muted">{test.description}</p>

      <div className="mt-6 grid grid-cols-2 divide-x divide-y divide-base-border rounded-md border border-base-border bg-base-panel sm:grid-cols-4 sm:divide-y-0">
        {metadata.map((m) => (
          <div key={m.label} className="px-4 py-3">
            <p className="text-mono-label">{m.label.toUpperCase()}</p>
            <p className="mt-1.5 text-base font-medium text-ink">{m.value}</p>
          </div>
        ))}
      </div>

      <Button className="mt-8" size="lg" onClick={() => navigate(`/tests/${test.id}/run`)}>
        {submittedAttempts.length > 0 ? "Retry test" : "Start test"}
      </Button>

      {submittedAttempts.length > 0 && (
        <div className="mt-10">
          <h2 className="text-sm font-semibold text-ink">Previous attempts</h2>
          <div className="mt-3 space-y-2">
            {submittedAttempts.map((a) => (
              <Card key={a.id}>
                <CardContent className="flex items-center justify-between py-3">
                  <span className="text-sm text-ink-muted">{formatDate(a.submittedAt)}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-ink">{a.score}%</span>
                    <Button asChild size="sm" variant="ghost">
                      <Link to={`/attempts/${a.id}`}>Review</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
