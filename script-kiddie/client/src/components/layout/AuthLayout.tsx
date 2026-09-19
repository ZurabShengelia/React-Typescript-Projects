import type { ReactNode } from "react";

export function AuthLayout({ panel, children }: { panel: ReactNode; children: ReactNode }) {
  return (
    <div className="mx-auto grid max-w-[1200px] items-center gap-16 px-6 py-16 lg:min-h-[calc(100vh-4rem-3.5rem)] lg:grid-cols-[440px,1fr] lg:py-20">
      <div className="w-full">{children}</div>
      <div className="hidden lg:block">{panel}</div>
    </div>
  );
}
