import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Check, X, MinusCircle } from "lucide-react";
import { api, getErrorMessage } from "@/lib/api";
import type { AttemptDetail, TestSummary } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DifficultyBadge } from "@/components/common/DifficultyBadge";
import { PageSpinner } from "@/components/common/LoadingState";
import { Alert } from "@/components/ui/alert";
import { formatDate, formatDuration, cn } from "@/lib/utils";

export default function AttemptReview() {
  const { id } = useParams<{ id: string }>();
  const [attempt, setAttempt] = useState<AttemptDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nextTest, setNextTest] = useState<TestSummary | null>(null);

  useEffect(() => {
    let mounted = true;
    api
      .get(`/attempts/${id}`)
      .then((res) => mounted && setAttempt(res.data.data))
      .catch((err) => mounted && setError(getErrorMessage(err)));
    return () => {
      mounted = false;
    };
  }, [id]);

  useEffect(() => {
    const categoryId = attempt?.test?.category.id;
    if (!categoryId) return;
    let mounted = true;
    api
      .get("/tests", { params: { category: categoryId, limit: 12 } })
      .then((res) => {
        if (!mounted) return;
        const candidates: TestSummary[] = res.data.data;
        const suggestion = candidates.find((t) => t.id !== attempt?.test?._id && t.state === "not_started");
        setNextTest(suggestion ?? null);
      })
      .catch(() => mounted && setNextTest(null));
    return () => {
      mounted = false;
    };
  }, [attempt]);

  if (error) return <Alert variant="danger">{error}</Alert>;
  if (!attempt) return <PageSpinner />;

  const performanceLabel = attempt.score >= 80 ? "Strong" : attempt.score >= 50 ? "Passing" : "Needs review";
  const performanceVariant = attempt.score >= 80 ? "success" : attempt.score >= 50 ? "warning" : "danger";
  const incorrectCount = attempt.totalQuestions - attempt.correctCount;

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/attempts" className="mb-6 inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Back to attempts
      </Link>

      <p className="text-mono-label">ASSESSMENT COMPLETE</p>
      <h1 className="mt-2 text-2xl font-semibold text-ink">{attempt.test?.title ?? "Deleted test"}</h1>
      <div className="mt-2 flex items-center gap-2">
        <DifficultyBadge difficulty={attempt.test?.difficulty ?? "easy"} />
        <span className="text-sm text-ink-faint">{attempt.test?.category?.name ?? "Uncategorized"}</span>
      </div>

      <div className="mt-6 flex flex-wrap items-end justify-between gap-6 rounded-md border border-base-border bg-base-panel px-6 py-5">
        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-semibold leading-none text-ink">{attempt.score}%</span>
          <Badge variant={performanceVariant}>{performanceLabel}</Badge>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <div>
            <p className="text-ink-faint">Questions</p>
            <p className="font-medium text-ink">{attempt.totalQuestions}</p>
          </div>
          <div>
            <p className="text-ink-faint">Correct</p>
            <p className="font-medium text-success">{attempt.correctCount}</p>
          </div>
          <div>
            <p className="text-ink-faint">Incorrect</p>
            <p className="font-medium text-danger">{incorrectCount}</p>
          </div>
          <div>
            <p className="text-ink-faint">Duration</p>
            <p className="font-medium text-ink">{formatDuration(attempt.durationSeconds)}</p>
          </div>
        </div>
      </div>
      <p className="mt-3 text-xs text-ink-faint">Submitted {formatDate(attempt.submittedAt)}</p>

      <h2 className="mt-10 mb-4 text-sm font-semibold text-ink">Answer review</h2>
      <div className="space-y-4">
        {attempt.review.map((q, idx) => (
          <Card key={q.id}>
            <CardContent>
              <div className="flex items-start justify-between gap-4">
                <p className="text-base font-medium text-ink">{idx + 1}. {q.prompt}</p>
                {q.wasAnswered ? (
                  q.isCorrect ? (
                    <Badge variant="success"><Check className="h-3 w-3" /> Correct</Badge>
                  ) : (
                    <Badge variant="danger"><X className="h-3 w-3" /> Incorrect</Badge>
                  )
                ) : (
                  <Badge variant="neutral"><MinusCircle className="h-3 w-3" /> Unanswered</Badge>
                )}
              </div>

              <div className="mt-4 space-y-2">
                {q.options.map((opt) => {
                  const isCorrect = q.correctOptionIndexes.includes(opt.index);
                  const isSelected = q.selectedOptionIndexes.includes(opt.index);
                  return (
                    <div
                      key={opt.index}
                      className={cn(
                        "rounded-md border px-3 py-2 text-sm",
                        isCorrect
                          ? "border-success/40 bg-success-muted text-ink"
                          : isSelected
                          ? "border-danger/40 bg-danger-muted text-ink"
                          : "border-base-border text-ink-muted"
                      )}
                    >
                      {opt.text}
                      {isCorrect && <span className="ml-2 text-xs text-success">Correct answer</span>}
                      {isSelected && !isCorrect && <span className="ml-2 text-xs text-danger">Your answer</span>}
                    </div>
                  );
                })}
              </div>

              {q.explanation && (
                <p className="mt-3 rounded-md bg-base-raised px-3 py-2 text-sm text-ink-muted">{q.explanation}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {nextTest && (
        <div className="mt-10">
          <p className="text-mono-label mb-3">NEXT ASSESSMENT</p>
          <Card>
            <CardContent className="flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <DifficultyBadge difficulty={nextTest.difficulty} />
                  <span className="text-xs text-ink-faint">{nextTest.category?.name ?? "—"}</span>
                </div>
                <p className="mt-1.5 truncate text-base font-medium text-ink">{nextTest.title}</p>
                <p className="text-xs text-ink-faint">{nextTest.questionCount} questions</p>
              </div>
              <Button asChild size="sm">
                <Link to={`/tests/${nextTest.id}`}>Start</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
