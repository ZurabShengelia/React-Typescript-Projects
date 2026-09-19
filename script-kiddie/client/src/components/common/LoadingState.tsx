import { Skeleton } from "@/components/ui/skeleton";

export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-md border border-base-border bg-base-panel p-5">
          <Skeleton className="mb-3 h-4 w-20" />
          <Skeleton className="mb-2 h-5 w-3/4" />
          <Skeleton className="mb-4 h-4 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-4 w-80" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="rounded-md border border-base-border bg-base-panel p-5 lg:col-span-1">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-3 h-10 w-28" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-md border border-base-border bg-base-panel p-5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-3 h-7 w-16" />
          </div>
        ))}
      </div>

      <div className="rounded-md border border-base-border bg-base-panel p-5">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="mt-5 h-56 w-full" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="space-y-3 rounded-md border border-base-border bg-base-panel p-5">
            <Skeleton className="h-4 w-36" />
            {Array.from({ length: 4 }).map((__, j) => (
              <Skeleton key={j} className="h-10 w-full" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 rounded-md border border-base-border bg-base-panel p-5">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="space-y-3 rounded-md border border-base-border bg-base-panel p-5">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-2/3" />
        </div>
      ))}
    </div>
  );
}

export function PageSpinner() {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-base-border border-t-accent" />
    </div>
  );
}
