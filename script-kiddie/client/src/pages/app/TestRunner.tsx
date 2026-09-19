import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { api, getErrorMessage } from "@/lib/api";
import type { RunnerSession } from "@/types";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PageSpinner } from "@/components/common/LoadingState";
import { Alert } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type AnswerMap = Record<string, number[]>;

export default function TestRunner() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<RunnerSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const startedAtRef = useRef<number>(Date.now());

  useEffect(() => {
    let mounted = true;
    api
      .post(`/tests/${id}/start`)
      .then((res) => {
        if (!mounted) return;
        setSession(res.data.data);
        startedAtRef.current = Date.now();
      })
      .catch((err) => mounted && setError(getErrorMessage(err)));
    return () => {
      mounted = false;
    };
  }, [id]);

  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (session) {
        e.preventDefault();
        e.returnValue = "";
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [session]);

  const question = session?.questions[current];
  const totalQuestions = session?.questions.length ?? 0;
  const answeredCount = Object.keys(answers).length;
  const progressPct = totalQuestions ? Math.round(((current + 1) / totalQuestions) * 100) : 0;

  const selected = useMemo(() => (question ? answers[question.id] ?? [] : []), [answers, question]);

  function toggleOption(optionIndex: number) {
    if (!question) return;
    setAnswers((prev) => {
      const existing = prev[question.id] ?? [];
      if (question.type === "single") {
        return { ...prev, [question.id]: [optionIndex] };
      }
      const next = existing.includes(optionIndex)
        ? existing.filter((i) => i !== optionIndex)
        : [...existing, optionIndex];
      return { ...prev, [question.id]: next };
    });
  }

  function goTo(index: number) {
    if (!session) return;
    setCurrent(Math.max(0, Math.min(session.questions.length - 1, index)));
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!question) return;
      if (e.key === "ArrowRight") goTo(current + 1);
      if (e.key === "ArrowLeft") goTo(current - 1);
      const num = Number(e.key);
      if (!Number.isNaN(num) && num >= 1 && num <= question.options.length) {
        toggleOption(num - 1);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);

  }, [question, current]);

  async function handleSubmit() {
    if (!session || !id) return;
    setSubmitting(true);
    try {
      const durationSeconds = Math.round((Date.now() - startedAtRef.current) / 1000);
      const payload = {
        answers: session.questions.map((q) => ({
          question: q.id,
          selectedOptionIndexes: answers[q.id] ?? [],
        })),
        durationSeconds,
      };
      const res = await api.post(`/tests/${id}/submit`, payload);
      toast.success("Test submitted");
      navigate(`/attempts/${res.data.data.attemptId}`, { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err));
      setSubmitting(false);
      setConfirmOpen(false);
    }
  }

  if (error) return <Alert variant="danger">{error}</Alert>;
  if (!session || !question) return <PageSpinner />;

  const isLast = current === session.questions.length - 1;

  return (
    <div className="flex h-screen flex-col bg-base">
      <div className="border-b border-base-border px-6 py-4">
        <div className="mx-auto max-w-3xl">
          {session.test && (
            <div className="mb-2 flex items-center gap-2 text-sm">
              <span className="text-ink-faint">{session.test.categoryName}</span>
              <span className="text-ink-faint">·</span>
              <span className="font-medium text-ink">{session.test.title}</span>
            </div>
          )}
          <div className="flex items-center justify-between text-sm text-ink-muted">
            <span className="font-mono text-xs text-ink-faint">QUESTION {current + 1} OF {totalQuestions}</span>
            <span>{answeredCount} of {totalQuestions} answered</span>
          </div>
          <div className="mt-2">
            <Progress value={progressPct} />
          </div>
        </div>
      </div>

      <div className="flex flex-1 items-start justify-center overflow-y-auto px-6 py-12">
        <div className="w-full max-w-3xl">
          <h2 className="text-xl font-semibold leading-snug text-ink">{question.prompt}</h2>
          {question.type === "multiple" && (
            <p className="mt-2 text-sm text-ink-faint">Select all that apply.</p>
          )}

          <div className="mt-8 space-y-3">
            {question.options.map((opt) => {
              const isSelected = selected.includes(opt.index);
              return (
                <button
                  key={opt.index}
                  type="button"
                  onClick={() => toggleOption(opt.index)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md border px-4 py-3.5 text-left text-base transition-colors",
                    isSelected
                      ? "border-accent bg-accent-muted text-ink"
                      : "border-base-border bg-base-panel text-ink-muted hover:border-base-borderStrong hover:text-ink"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs font-mono",
                      isSelected ? "border-accent bg-accent text-accent-ink" : "border-base-borderStrong text-ink-faint"
                    )}
                  >
                    {opt.index + 1}
                  </span>
                  {opt.text}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="border-t border-base-border px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Button variant="secondary" onClick={() => goTo(current - 1)} disabled={current === 0}>
            Previous
          </Button>
          {isLast ? (
            <Button onClick={() => setConfirmOpen(true)}>Submit test</Button>
          ) : (
            <Button onClick={() => goTo(current + 1)}>Next</Button>
          )}
        </div>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogTitle className="text-lg font-semibold text-ink">Submit this test?</DialogTitle>
          <DialogDescription className="mt-2 text-sm text-ink-muted">
            You've answered {answeredCount} of {totalQuestions} questions.
            {answeredCount < totalQuestions && " Unanswered questions will be marked incorrect."}
            {" "}This action cannot be undone.
          </DialogDescription>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setConfirmOpen(false)}>Keep reviewing</Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Submitting…" : "Submit"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
