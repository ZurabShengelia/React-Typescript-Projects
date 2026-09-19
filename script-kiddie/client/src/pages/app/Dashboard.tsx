import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LineChart as RLineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { api, getErrorMessage } from "@/lib/api";
import type { DashboardData, Category } from "@/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/common/EmptyState";
import { DashboardSkeleton } from "@/components/common/LoadingState";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { LineChart as LineChartIcon, History } from "lucide-react";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    let mounted = true;
    Promise.all([api.get("/dashboard"), api.get("/categories")])
      .then(([dashRes, catRes]) => {
        if (!mounted) return;
        setData(dashRes.data.data);
        setCategories(catRes.data.data);
      })
      .catch((err) => mounted && setError(getErrorMessage(err)))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <DashboardSkeleton />;
  if (error) return <Alert variant="danger">{error}</Alert>;
  if (!data || !categories) return null;

  const supportingMetrics = [
    { label: "Completed", value: data.totals.completedTests },
    { label: "Success rate", value: `${data.totals.successRate}%` },
    { label: "Strongest category", value: data.categoryPerformance[0]?.name ?? "—" },
  ];

  const weakestAttempted = categories
    .filter((c) => c.performance)
    .sort((a, b) => (a.performance!.averageScore - b.performance!.averageScore))[0];
  const unattempted = categories.find((c) => !c.performance && c.testCount > 0);
  const suggestion = weakestAttempted ?? unattempted;
  const suggestionReason = weakestAttempted
    ? `Your lowest average score is in this category (${weakestAttempted.performance!.averageScore}%).`
    : "You haven't attempted any assessments in this category yet.";

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-ink">
          {greeting()}{user ? `, ${user.name.split(" ")[0]}` : ""}
        </h2>
        <p className="mt-1 text-sm text-ink-muted">Continue improving your security knowledge.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr),2fr]">
        <div className="rounded-md border border-base-border bg-base-panel px-6 py-5">
          <p className="text-mono-label">SECURITY OVERVIEW</p>
          <p className="mt-2 text-3xl font-semibold leading-none text-ink">{data.totals.averageScore}%</p>
          <p className="mt-1.5 text-sm text-ink-muted">Overall assessment score</p>
        </div>
        <div className="grid grid-cols-3 divide-x divide-base-border rounded-md border border-base-border bg-base-panel">
          {supportingMetrics.map((m) => (
            <div key={m.label} className="px-5 py-4">
              <p className="text-mono-label">{m.label.toUpperCase()}</p>
              <p className="mt-2 text-xl font-semibold text-ink">{m.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Performance over time</CardTitle>
          </CardHeader>
          <CardContent>
            {data.performanceTrend.length === 0 ? (
              <EmptyState
                icon={LineChartIcon}
                title="No attempts yet"
                description="Complete a test to start tracking your score over time."
              />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <RLineChart data={data.performanceTrend.map((p) => ({ ...p, date: formatDate(p.date) }))}>
                  {}
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-chart-grid)" />
                  <XAxis
                    dataKey="date"
                    stroke="var(--color-chart-axis)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="var(--color-chart-axis)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    domain={[0, 100]}
                  />
                  <Tooltip
                    cursor={{ stroke: "var(--color-chart-grid)" }}
                    contentStyle={{
                      background: "var(--color-panel)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 6,
                      fontSize: 13,
                    }}
                    labelStyle={{ color: "var(--color-ink)" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="var(--color-chart-line)"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "var(--color-chart-line)" }}
                  />
                </RLineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
          </CardHeader>
          <CardContent className={data.recentAttempts.length === 0 ? undefined : "space-y-1"}>
            {data.recentAttempts.length === 0 ? (
              <EmptyState
                icon={History}
                title="No assessments completed"
                description="Your activity will appear here after you complete your first security assessment."
                action={
                  <Button asChild size="sm" variant="secondary">
                    <Link to="/tests">Browse assessments</Link>
                  </Button>
                }
              />
            ) : (
              data.recentAttempts.slice(0, 6).map((a) => (
                <Link
                  key={a.id}
                  to={`/attempts/${a.id}`}
                  className="flex items-center justify-between rounded-md px-2 py-2.5 text-sm hover:bg-base-raised"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">{a.test?.title ?? "Deleted test"}</p>
                    <p className="text-xs text-ink-faint">{formatDate(a.submittedAt)}</p>
                  </div>
                  <span className="shrink-0 text-sm font-medium text-ink-muted">{a.score}%</span>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Security skill profile</CardTitle>
            <Link to="/attempts" className="text-xs font-medium text-accent hover:underline">
              View all attempts
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categories.map((c) => (
                <div key={c.id}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-ink">{c.name}</span>
                    {c.performance ? (
                      <span className="text-ink-faint">
                        {c.performance.averageScore}% avg · {c.performance.attempts} attempt{c.performance.attempts === 1 ? "" : "s"}
                      </span>
                    ) : (
                      <span className="text-ink-faint">Not yet assessed</span>
                    )}
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-base-raised">
                    <div
                      className={c.performance ? "h-full rounded-full bg-accent" : "h-full rounded-full bg-base-border"}
                      style={{ width: c.performance ? `${c.performance.averageScore}%` : "100%" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {suggestion && (
          <Card>
            <CardHeader>
              <CardTitle>Continue learning</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-mono-label">SUGGESTED CATEGORY</p>
              <p className="mt-2 text-lg font-semibold text-ink">{suggestion.name}</p>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">{suggestionReason}</p>
              <Button asChild className="mt-5 w-full" variant="secondary">
                <Link to={`/tests?category=${suggestion.id}`}>View assessments</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
